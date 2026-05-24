const crypto = require("crypto");
const DocumentChunk = require("../models/DocumentChunk");
const { env } = require("../config/env");
const { embedMany, embedText: providerEmbedText } = require("./aiService");

const VECTOR_DIMENSIONS = 64;

const normalizeText = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const chunkText = (text, chunkSize = 1200, overlap = 200) => {
  const clean = String(text || "").trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(clean.length, start + chunkSize);
    let slice = clean.slice(start, end);
    if (end < clean.length) {
      const lastSentence = Math.max(
        slice.lastIndexOf("."),
        slice.lastIndexOf("\n"),
      );
      if (lastSentence > chunkSize * 0.5) {
        slice = slice.slice(0, lastSentence + 1);
      }
    }

    const trimmed = slice.trim();
    if (trimmed) chunks.push(trimmed);
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
};

const localEmbed = (text) => {
  const vector = new Array(VECTOR_DIMENSIONS).fill(0);
  const tokens = normalizeText(text).split(" ").filter(Boolean);

  for (const token of tokens) {
    const hash = crypto.createHash("sha256").update(token).digest();
    const index = hash.readUInt32BE(0) % VECTOR_DIMENSIONS;
    vector[index] += 1;
  }

  const magnitude =
    Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
};

const embedText = async (text) => {
  const provider = (env.EMBEDDING_PROVIDER || "").toLowerCase();

  if (provider === "local") {
    return {
      vector: localEmbed(text),
      provider: "local-hash",
      model: "hash-64",
    };
  }

  const remote = await providerEmbedText(text, {
    provider: env.EMBEDDING_PROVIDER,
    model: env.EMBEDDING_MODEL,
  });

  if (remote.vector?.length) {
    return remote;
  }

  return {
    vector: localEmbed(text),
    provider: "local-hash",
    model: "hash-64",
  };
};

const embedChunks = async (chunks) => {
  const provider = (env.EMBEDDING_PROVIDER || "").toLowerCase();

  if (provider === "local" || chunks.length === 0) {
    return chunks.map((chunk) => ({
      vector: localEmbed(chunk),
      provider: "local-hash",
      model: "hash-64",
    }));
  }

  const remote = await embedMany(chunks, {
    provider: env.EMBEDDING_PROVIDER,
    model: env.EMBEDDING_MODEL,
  });

  if (
    Array.isArray(remote.vectors) &&
    remote.vectors.length === chunks.length
  ) {
    return remote.vectors.map((vector) => ({
      vector,
      provider: remote.provider,
      model: remote.model,
    }));
  }

  return chunks.map((chunk) => ({
    vector: localEmbed(chunk),
    provider: "local-hash",
    model: "hash-64",
  }));
};

const cosineSimilarity = (a, b) => {
  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    dot += a[index] * b[index];
    aMagnitude += a[index] * a[index];
    bMagnitude += b[index] * b[index];
  }

  const denominator = Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude) || 1;
  return dot / denominator;
};

const getVectorBackend = () => {
  if (env.VECTOR_BACKEND) return env.VECTOR_BACKEND;
  return env.QDRANT_URL ? "qdrant" : "local";
};

const usesQdrant = () =>
  getVectorBackend() === "qdrant" && Boolean(env.QDRANT_URL);

const getQdrantCollection = () =>
  env.QDRANT_COLLECTION || "dzidzaai_document_chunks";

const qdrantBaseUrl = () => String(env.QDRANT_URL || "").replace(/\/+$/, "");

const qdrantRequest = async (pathname, options = {}) => {
  if (!usesQdrant()) {
    throw new Error("Qdrant is not configured");
  }

  const response = await fetch(`${qdrantBaseUrl()}${pathname}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(env.QDRANT_API_KEY ? { "api-key": env.QDRANT_API_KEY } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Qdrant request failed (${response.status}): ${errorText || response.statusText}`,
    );
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const ensureQdrantCollection = async () => {
  if (!usesQdrant()) return false;

  const collection = getQdrantCollection();
  try {
    await qdrantRequest(`/collections/${collection}`);
    return true;
  } catch (err) {
    if (!String(err.message || "").includes("404")) {
      throw err;
    }
  }

  await qdrantRequest(`/collections/${collection}`, {
    method: "PUT",
    body: JSON.stringify({
      vectors: {
        size: VECTOR_DIMENSIONS,
        distance: "Cosine",
      },
    }),
  });

  return true;
};

const deleteDocumentChunks = async ({ documentId, userId }) => {
  await DocumentChunk.deleteMany({ document: documentId, user: userId });

  if (!usesQdrant()) return true;

  await ensureQdrantCollection();
  await qdrantRequest(
    `/collections/${getQdrantCollection()}/points/delete?wait=true`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: {
          must: [
            { key: "userId", match: { value: String(userId) } },
            { key: "documentId", match: { value: String(documentId) } },
          ],
        },
      }),
    },
  );

  return true;
};

const upsertQdrantChunks = async ({ documentId, userId, subject, records }) => {
  if (!usesQdrant() || !records.length) return 0;

  await ensureQdrantCollection();

  const points = records.map((record) => ({
    id: record.vectorId,
    vector: record.embedding,
    payload: {
      documentId: String(documentId),
      userId: String(userId),
      chunkIndex: record.chunkIndex,
      chunkText: record.chunkText,
      subject: subject || null,
      embeddingProvider: record.embeddingProvider,
      embeddingModel: record.embeddingModel,
    },
  }));

  let written = 0;
  for (let index = 0; index < points.length; index += 64) {
    const batch = points.slice(index, index + 64);
    await qdrantRequest(
      `/collections/${getQdrantCollection()}/points?wait=true`,
      {
        method: "PUT",
        body: JSON.stringify({ points: batch }),
      },
    );
    written += batch.length;
  }

  return written;
};

const searchQdrantChunks = async ({ userId, query, documentId, limit = 5 }) => {
  if (!usesQdrant()) return [];

  await ensureQdrantCollection();
  const queryEmbedding = await embedText(query);
  const filter = {
    must: [{ key: "userId", match: { value: String(userId) } }],
  };

  if (documentId) {
    filter.must.push({
      key: "documentId",
      match: { value: String(documentId) },
    });
  }

  const result = await qdrantRequest(
    `/collections/${getQdrantCollection()}/points/search`,
    {
      method: "POST",
      body: JSON.stringify({
        vector: queryEmbedding.vector,
        limit,
        with_payload: true,
        with_vector: false,
        filter,
      }),
    },
  );

  const points = Array.isArray(result?.result) ? result.result : [];
  return points.map((point) => ({
    score: point.score,
    vectorId: point.id,
    ...point.payload,
    document: point.payload?.documentId,
    user: point.payload?.userId,
  }));
};

const indexDocumentChunks = async ({ documentId, userId, subject, text }) => {
  const chunks = chunkText(text);
  if (!chunks.length) return 0;

  await deleteDocumentChunks({ documentId, userId });

  const embeddings = await embedChunks(chunks);
  const records = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const embedding = embeddings[index];
    records.push({
      document: documentId,
      user: userId,
      chunkIndex: index,
      chunkText: chunk,
      subject,
      vectorId: `${documentId}:${index}`,
      embeddingProvider: embedding.provider,
      embeddingModel: embedding.model,
      embedding: embedding.vector,
    });
  }

  await DocumentChunk.insertMany(records);

  try {
    await upsertQdrantChunks({ documentId, userId, subject, records });
  } catch (err) {
    console.warn(
      "[VECTOR] Qdrant upsert failed, using Mongo fallback:",
      err.message,
    );
  }

  return records.length;
};

const searchDocumentChunks = async ({
  userId,
  query,
  documentId,
  limit = 5,
}) => {
  if (usesQdrant()) {
    try {
      const qdrantResults = await searchQdrantChunks({
        userId,
        query,
        documentId,
        limit,
      });

      if (qdrantResults.length) {
        return qdrantResults;
      }
    } catch (err) {
      console.warn(
        "[VECTOR] Qdrant search failed, falling back to Mongo:",
        err.message,
      );
    }
  }

  const queryEmbedding = await embedText(query);
  const filter = { user: userId };
  if (documentId) filter.document = documentId;

  const chunks = await DocumentChunk.find(filter).select(
    "document chunkIndex chunkText embedding subject vectorId embeddingProvider embeddingModel",
  );

  return chunks
    .map((chunk) => ({
      ...chunk.toObject(),
      score: cosineSimilarity(queryEmbedding.vector, chunk.embedding || []),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
};

module.exports = {
  VECTOR_DIMENSIONS,
  chunkText,
  embedText,
  deleteDocumentChunks,
  indexDocumentChunks,
  searchDocumentChunks,
};
