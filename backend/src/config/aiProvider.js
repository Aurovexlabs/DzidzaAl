"use strict";
/**
 * DzidzaAI — Multi-Provider AI Abstraction Layer
 *
 * Supports: OpenAI (GPT-4o-mini), Google Gemini (1.5 Flash), DeepSeek (Chat)
 *
 * Priority:
 *   1. Env var AI_PROVIDER if explicitly set
 *   2. OPENAI_API_KEY  → OpenAI
 *   3. GEMINI_API_KEY  → Gemini
 *   4. DEEPSEEK_API_KEY → DeepSeek
 *
 * All providers expose the same interface:
 *   chat(messages, opts)   → { content, tokensUsed, provider }
 *   json(prompt, opts)     → parsed object (retries on bad JSON)
 *
 * Failover: if the primary provider throws, the next available is tried once.
 */

const NodeCache = require("node-cache");
const responseCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5-min cache

const LOCAL_VECTOR_DIMENSIONS = 64;

const localEmbedding = (text) => {
  const crypto = require("crypto");
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const vector = new Array(LOCAL_VECTOR_DIMENSIONS).fill(0);
  for (const token of normalized.split(" ").filter(Boolean)) {
    const hash = crypto.createHash("sha256").update(token).digest();
    const index = hash.readUInt32BE(0) % LOCAL_VECTOR_DIMENSIONS;
    vector[index] += 1;
  }

  const magnitude =
    Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
};

// ─── Determine provider priority ─────────────────────────────────────────────
const buildProviderList = () => {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  const all = [];

  if (explicit) {
    // If explicitly set, put it first — still include others for failover
    const map = { openai: "openai", gemini: "gemini", deepseek: "deepseek" };
    if (map[explicit]) all.push(map[explicit]);
  }

  if (!all.includes("openai") && process.env.OPENAI_API_KEY) all.push("openai");
  if (!all.includes("gemini") && process.env.GEMINI_API_KEY) all.push("gemini");
  if (!all.includes("deepseek") && process.env.DEEPSEEK_API_KEY)
    all.push("deepseek");

  return all;
};

// ─── Provider adapters ────────────────────────────────────────────────────────

// OpenAI (also used for DeepSeek which is OpenAI-compatible)
const openAICompletions = async (
  apiKey,
  baseURL,
  model,
  messages,
  opts = {},
) => {
  const { default: OpenAI } = await Promise.resolve().then(() =>
    require("openai"),
  );
  const client = new OpenAI({ apiKey, baseURL });

  const params = {
    model,
    messages,
    max_tokens: opts.maxTokens || 1200,
    temperature: opts.temperature ?? 0.7,
  };
  if (opts.json) params.response_format = { type: "json_object" };

  const res = await client.chat.completions.create(params);
  return {
    content: res.choices[0].message.content,
    tokensUsed: res.usage?.total_tokens || 0,
  };
};

const openAIEmbeddings = async (apiKey, baseURL, model, input) => {
  const { default: OpenAI } = await Promise.resolve().then(() =>
    require("openai"),
  );
  const client = new OpenAI({ apiKey, baseURL });
  const res = await client.embeddings.create({
    model,
    input,
  });

  return {
    vectors: res.data.map((item) => item.embedding),
    tokensUsed: res.usage?.total_tokens || 0,
  };
};

// Google Gemini
const geminiCompletions = async (messages, opts = {}) => {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Convert OpenAI message format to Gemini format
  const systemMsg = messages.find((m) => m.role === "system");
  const chatHistory = messages
    .filter((m) => m.role !== "system")
    .slice(0, -1)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  const lastMsg = messages.filter((m) => m.role !== "system").at(-1);

  let prompt = lastMsg?.content || "";
  if (systemMsg) prompt = `${systemMsg.content}\n\n${prompt}`;
  if (opts.json)
    prompt +=
      "\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no explanation.";

  const chat = model.startChat({
    history: chatHistory,
    generationConfig: {
      maxOutputTokens: opts.maxTokens || 1200,
      temperature: opts.temperature ?? 0.7,
    },
  });

  const result = await chat.sendMessage(prompt);
  const text = result.response.text();

  return {
    content: text,
    tokensUsed: result.response.usageMetadata?.totalTokenCount || 0,
  };
};

// ─── Core completion function with failover ───────────────────────────────────
const complete = async (messages, opts = {}) => {
  const providers = buildProviderList();

  if (providers.length === 0) {
    throw new Error(
      "No AI engine configured. Set at least one of: OPENAI_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY in your .env file.",
    );
  }

  let lastError;

  for (const provider of providers) {
    try {
      let result;

      if (provider === "openai") {
        result = await openAICompletions(
          process.env.OPENAI_API_KEY,
          undefined,
          "gpt-4o-mini",
          messages,
          opts,
        );
      } else if (provider === "gemini") {
        result = await geminiCompletions(messages, opts);
      } else if (provider === "deepseek") {
        result = await openAICompletions(
          process.env.DEEPSEEK_API_KEY,
          "https://api.deepseek.com",
          "deepseek-chat",
          messages,
          opts,
        );
      }

      return { ...result, provider };
    } catch (err) {
      console.error(`[AI] Provider "${provider}" failed: ${err.message}`);
      lastError = err;
      // Continue to next provider
    }
  }

  throw new Error(`All AI engines failed. Last error: ${lastError?.message}`);
};

// ─── JSON helper with retry + repair ─────────────────────────────────────────
const completeJSON = async (prompt, opts = {}) => {
  const MAX_RETRIES = 2;
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await complete([{ role: "user", content: prompt }], {
      ...opts,
      json: true,
    });

    let text = result.content.trim();

    // Strip markdown code fences if present (Gemini sometimes adds them)
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    // Find first { and last } to extract JSON
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      text = text.slice(start, end + 1);
    }

    try {
      const parsed = JSON.parse(text);
      return {
        data: parsed,
        provider: result.provider,
        tokensUsed: result.tokensUsed,
      };
    } catch (parseErr) {
      console.error(
        `[AI] JSON parse failed (attempt ${attempt + 1}):`,
        parseErr.message,
      );
      lastError = parseErr;

      if (attempt < MAX_RETRIES) {
        // Ask the model to fix its output
        prompt = `${prompt}\n\nYour previous response could not be parsed as JSON. Return ONLY raw JSON with no markdown or explanations.`;
      }
    }
  }

  throw new Error(
    `AI returned invalid JSON after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`,
  );
};

// ─── Cache wrapper ────────────────────────────────────────────────────────────
const completeWithCache = async (cacheKey, messages, opts = {}) => {
  if (opts.noCache) return complete(messages, opts);
  const cached = responseCache.get(cacheKey);
  if (cached) return { ...cached, fromCache: true };
  const result = await complete(messages, opts);
  responseCache.set(cacheKey, result);
  return result;
};

const embedMany = async (texts, opts = {}) => {
  const inputs = Array.isArray(texts) ? texts : [texts];
  const cleaned = inputs.map((text) => String(text || "").trim());

  if (!cleaned.length) {
    return { vectors: [], provider: null, model: null, tokensUsed: 0 };
  }

  const provider = (
    opts.provider ||
    process.env.EMBEDDING_PROVIDER ||
    ""
  ).toLowerCase();
  const model =
    opts.model || process.env.EMBEDDING_MODEL || "text-embedding-3-small";

  if (
    (provider === "openai" || provider === "") &&
    process.env.OPENAI_API_KEY
  ) {
    const result = await openAIEmbeddings(
      process.env.OPENAI_API_KEY,
      undefined,
      model,
      cleaned,
    );
    return {
      vectors: result.vectors,
      provider: "openai",
      model,
      tokensUsed: result.tokensUsed,
    };
  }

  if (
    (provider === "deepseek" || provider === "") &&
    process.env.DEEPSEEK_API_KEY
  ) {
    const result = await openAIEmbeddings(
      process.env.DEEPSEEK_API_KEY,
      "https://api.deepseek.com",
      model,
      cleaned,
    );
    return {
      vectors: result.vectors,
      provider: "deepseek",
      model,
      tokensUsed: result.tokensUsed,
    };
  }

  return {
    vectors: cleaned.map(localEmbedding),
    provider: "local-hash",
    model: "hash-64",
    tokensUsed: 0,
  };
};

const embedText = async (text, opts = {}) => {
  const result = await embedMany([text], opts);
  if (result.vectors.length && result.vectors[0]) {
    return {
      vector: result.vectors[0],
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
    };
  }

  return {
    vector: localEmbedding(text),
    provider: "local-hash",
    model: "hash-64",
    tokensUsed: 0,
  };
};

module.exports = {
  complete,
  completeJSON,
  completeWithCache,
  embedMany,
  embedText,
};
