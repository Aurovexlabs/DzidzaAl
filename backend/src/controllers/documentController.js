const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Document = require("../models/Document");
const Flashcard = require("../models/Flashcard");
const { env } = require("../config/env");
const { enqueueDocumentProcessing } = require("../queues/documentQueue");
const { processDocumentJob } = require("../services/documentProcessingService");
const {
  deleteDocumentChunks,
  searchDocumentChunks,
} = require("../services/vectorService");
const {
  hasObjectStorage,
  buildObjectKey,
  createUploadUrl,
  createDownloadUrl,
  uploadFile,
  deleteObject,
  headObject,
  removeLocalFile,
} = require("../services/storageService");

const uploadFileTypes = {
  pdf: {
    extensions: new Set([".pdf"]),
    mimes: new Set(["application/pdf"]),
  },
  txt: {
    extensions: new Set([".txt"]),
    mimes: new Set(["text/plain", "application/octet-stream"]),
  },
  docx: {
    extensions: new Set([".docx"]),
    mimes: new Set([
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]),
  },
};

const isAllowedUpload = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  return Object.values(uploadFileTypes).some(
    (allowed) =>
      allowed.extensions.has(ext) && allowed.mimes.has(file.mimetype),
  );
};

const scanUploadedFile = async (filePath) => {
  if (!env.CLAMAV_URL) return;

  const stats = await fs.promises.stat(filePath);
  if (stats.size <= 0) {
    throw new Error("Uploaded file is empty");
  }

  // Hook point for an antivirus service or sidecar scanner.
  // In production, call the configured scanner here and reject on detection.
  return true;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

// multer v2: fileFilter uses cb(new Error(...)) to reject — no second argument
const fileFilter = (req, file, cb) => {
  if (isAllowedUpload(file)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error("Only PDF, TXT, and DOCX files are allowed"), {
        code: "LIMIT_FILE_TYPE",
      }),
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024 },
});

const buildDocumentResponse = async (doc) => {
  const plain = doc.toObject ? doc.toObject() : doc;

  if (plain.storageProvider === "s3" && plain.storageKey) {
    plain.downloadUrl = await createDownloadUrl({ key: plain.storageKey });
  } else if (plain.fileUrl) {
    plain.downloadUrl = plain.fileUrl;
  }

  return plain;
};

const scheduleDocumentProcessing = async (document, file, subject, user) => {
  const payload = {
    docId: String(document._id),
    filePath: file?.path || null,
    originalName: file.originalname,
    subject,
    user: {
      _id: String(user._id),
      educationLevel: user.educationLevel,
      name: user.name,
    },
    storageProvider: document.storageProvider,
    storageKey: document.storageKey,
  };

  const job = await enqueueDocumentProcessing(payload);
  if (!job) {
    setImmediate(() => {
      processDocumentJob(payload).catch((err) =>
        console.error("[DOCUMENT] Processing failed:", err),
      );
    });
  }

  return job;
};

const initializeDocumentUpload = async (req, res, next) => {
  try {
    if (!hasObjectStorage()) {
      return res.status(409).json({
        success: false,
        message:
          "Signed upload initialization requires object storage configuration",
      });
    }

    const { title, originalName, fileType, fileSize, subject, contentType } =
      req.body;
    const doc = await Document.create({
      user: req.user._id,
      title: title || originalName.replace(/\.[^/.]+$/, ""),
      originalName,
      fileType,
      fileSize: Number(fileSize || 0),
      subject,
      storageProvider: "s3",
      status: "uploading",
    });

    const storageKey = buildObjectKey({
      userId: req.user._id,
      documentId: doc._id,
      originalName,
    });
    doc.storageKey = storageKey;
    await doc.save();

    const uploadUrl = await createUploadUrl({
      key: storageKey,
      contentType: contentType || "application/octet-stream",
    });

    res.status(201).json({
      success: true,
      data: {
        document: await buildDocumentResponse(doc),
        uploadUrl,
        storageKey,
      },
    });
  } catch (err) {
    next(err);
  }
};

const completeDocumentUpload = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    const doc = await Document.findOne({ _id: documentId, user: req.user._id });
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    if (doc.storageProvider === "s3" && doc.storageKey) {
      await headObject({ key: doc.storageKey });
    }

    doc.status = "processing";
    await doc.save();

    const job = await scheduleDocumentProcessing(
      doc,
      { path: null, originalname: doc.originalName },
      doc.subject,
      req.user,
    );

    res.json({
      success: true,
      message: job
        ? "File uploaded and queued for processing"
        : "File uploaded and processing started",
      data: {
        document: await buildDocumentResponse(doc),
        jobId: job?.id || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/documents/upload
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    await scanUploadedFile(req.file.path);

    const { subject } = req.body;
    const ext = path
      .extname(req.file.originalname)
      .toLowerCase()
      .replace(".", "");

    if (hasObjectStorage()) {
      const storageKey = buildObjectKey({
        userId: req.user._id,
        documentId: null,
        originalName: req.file.originalname,
      });
      await uploadFile({
        key: storageKey,
        filePath: req.file.path,
        contentType: req.file.mimetype,
      });
      await removeLocalFile(req.file.path);

      const doc = await Document.create({
        user: req.user._id,
        title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ""),
        originalName: req.file.originalname,
        fileType: ext === "pdf" ? "pdf" : ext === "txt" ? "txt" : "docx",
        fileSize: req.file.size,
        subject,
        storageProvider: "s3",
        storageKey,
        status: "processing",
      });

      const job = await scheduleDocumentProcessing(
        doc,
        { path: null, originalname: req.file.originalname },
        subject,
        req.user,
      );

      return res.status(201).json({
        success: true,
        message: job
          ? "File uploaded and queued for processing"
          : "File uploaded and processing started",
        data: {
          document: await buildDocumentResponse(doc),
          jobId: job?.id || null,
          status: "processing",
        },
      });
    }

    const doc = await Document.create({
      user: req.user._id,
      title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ""),
      originalName: req.file.originalname,
      fileType: ext === "pdf" ? "pdf" : ext === "txt" ? "txt" : "docx",
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      subject,
      status: "processing",
    });

    const job = await scheduleDocumentProcessing(
      doc,
      req.file,
      subject,
      req.user,
    );

    res.status(201).json({
      success: true,
      message: job
        ? "File uploaded and queued for processing"
        : "File uploaded and processing started",
      data: {
        document: await buildDocumentResponse(doc),
        jobId: job?.id || null,
        status: "processing",
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/documents
const getDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find({ user: req.user._id })
      .select(
        "title originalName fileType subject status summary flashcardsGenerated createdAt fileSize storageProvider storageKey fileUrl",
      )
      .sort({ createdAt: -1 });
    const documents = await Promise.all(
      docs.map((doc) => buildDocumentResponse(doc)),
    );
    res.json({ success: true, data: { documents } });
  } catch (err) {
    next(err);
  }
};

// GET /api/documents/:id
const getDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    res.json({
      success: true,
      data: { document: await buildDocumentResponse(doc) },
    });
  } catch (err) {
    next(err);
  }
};

const getDocumentDownloadUrl = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });

    if (doc.storageProvider === "s3" && doc.storageKey) {
      const downloadUrl = await createDownloadUrl({ key: doc.storageKey });
      return res.json({ success: true, data: { downloadUrl } });
    }

    return res.json({
      success: true,
      data: { downloadUrl: doc.fileUrl || null },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/documents/:id
const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });

    if (doc.storageProvider === "s3" && doc.storageKey) {
      await deleteObject({ key: doc.storageKey });
    }

    try {
      await deleteDocumentChunks({ documentId: doc._id, userId: req.user._id });
    } catch (cleanupError) {
      console.warn(
        `[DOCUMENT] Vector cleanup failed for ${doc._id}:`,
        cleanupError.message,
      );
    }

    if (doc.fileUrl) {
      const filePath = path.join(__dirname, "../..", doc.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Document.deleteOne({ _id: doc._id });
    await Flashcard.updateMany(
      { sourceDocument: doc._id },
      { isActive: false },
    );

    res.json({ success: true, message: "Document deleted" });
  } catch (err) {
    next(err);
  }
};

// POST /api/documents/:id/ask
const askDocument = async (req, res, next) => {
  try {
    const { question } = req.body;
    const doc = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "ready",
    });
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found or not ready" });

    const { chatWithTutor } = require("../services/aiService");
    const chunks = await searchDocumentChunks({
      userId: req.user._id,
      documentId: doc._id,
      query: question,
      limit: 4,
    });
    const context = chunks
      .map(
        (chunk) =>
          `Chunk ${chunk.chunkIndex + 1} (score ${chunk.score.toFixed(2)}):\n${chunk.chunkText}`,
      )
      .join("\n\n");
    const { content } = await chatWithTutor({
      messages: [
        {
          role: "user",
          content: `Based on this document and retrieved context:\n\n${context || doc.extractedText?.slice(0, 4000)}\n\nQuestion: ${question}`,
        },
      ],
      subject: doc.subject,
      educationLevel: req.user.educationLevel,
      language: req.user.preferredLanguage,
      userName: req.user.name,
      academicProfile: req.user.academicProfile,
    });

    res.json({ success: true, data: { answer: content } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  upload,
  initializeDocumentUpload,
  completeDocumentUpload,
  uploadDocument,
  getDocuments,
  getDocument,
  getDocumentDownloadUrl,
  deleteDocument,
  askDocument,
};
