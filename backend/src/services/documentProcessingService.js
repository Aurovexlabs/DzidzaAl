const fs = require("fs");
const path = require("path");
const os = require("os");
const Document = require("../models/Document");
const Flashcard = require("../models/Flashcard");
const { summarizeDocument, generateFlashcards } = require("./aiService");
const { indexDocumentChunks } = require("./vectorService");
const {
  downloadObjectToFile,
  removeLocalFile,
  ensureLocalUploadsDir,
} = require("./storageService");

const loadOptionalModule = (moduleName) => {
  try {
    return require(moduleName);
  } catch (_) {
    return null;
  }
};

const pdfParse = loadOptionalModule("pdf-parse");
const mammoth = loadOptionalModule("mammoth");

const extractTextFromDocument = async ({ filePath, originalName }) => {
  const ext = path.extname(originalName || filePath).toLowerCase();

  if (ext === ".txt") {
    return fs.promises.readFile(filePath, "utf8");
  }

  if (ext === ".pdf" && pdfParse) {
    const buffer = await fs.promises.readFile(filePath);
    const parsed = await pdfParse(buffer);
    if (parsed?.text?.trim()) return parsed.text;
  }

  if (ext === ".docx" && mammoth) {
    const result = await mammoth.extractRawText({ path: filePath });
    if (result?.value?.trim()) return result.value;
  }

  return `Document content extracted from ${path.basename(
    filePath,
  )}. Install pdf-parse and mammoth for native PDF and DOCX extraction.`;
};

const resolveProcessingPath = async ({
  filePath,
  storageProvider,
  storageKey,
  originalName,
}) => {
  if (storageProvider !== "s3" || !storageKey) {
    return { filePath, cleanupPath: null };
  }

  ensureLocalUploadsDir();
  const tempDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "dzidzaai-doc-"),
  );
  const tempPath = path.join(
    tempDir,
    path.basename(originalName || storageKey),
  );
  await downloadObjectToFile({ key: storageKey, filePath: tempPath });
  return { filePath: tempPath, cleanupPath: tempDir };
};

const processDocumentJob = async (
  { docId, filePath, originalName, subject, user, storageProvider, storageKey },
  job,
) => {
  const doc = await Document.findById(docId);
  if (!doc) throw new Error("Document not found");

  let resolved;
  try {
    resolved = await resolveProcessingPath({
      filePath,
      storageProvider,
      storageKey,
      originalName,
    });

    if (job?.updateProgress) await job.updateProgress(10);

    const text = await extractTextFromDocument({
      filePath: resolved.filePath,
      originalName,
    });
    if (job?.updateProgress) await job.updateProgress(35);

    const chunkCount = await indexDocumentChunks({
      documentId: docId,
      userId: user._id,
      subject,
      text,
    });
    if (job?.updateProgress) await job.updateProgress(50);

    const summary = await summarizeDocument(text, subject, user.educationLevel);
    if (job?.updateProgress) await job.updateProgress(70);

    const flashcardData = await generateFlashcards(text, subject, 15);
    const flashcards = flashcardData.map((item) => ({
      user: user._id,
      front: item.front,
      back: item.back,
      subject: subject || item.topic,
      topic: item.topic,
      sourceDocument: docId,
      aiGenerated: true,
    }));

    if (flashcards.length) await Flashcard.insertMany(flashcards);

    await Document.findByIdAndUpdate(docId, {
      status: "ready",
      extractedText: text.slice(0, 10000),
      summary,
      flashcardsGenerated: flashcards.length,
      processingJobId: job?.id ? String(job.id) : undefined,
      chunkCount,
    });

    if (job?.updateProgress) await job.updateProgress(100);

    return { summary, flashcardsGenerated: flashcards.length };
  } catch (err) {
    await Document.findByIdAndUpdate(docId, {
      status: "error",
      errorMessage: err.message,
    });
    throw err;
  } finally {
    if (resolved?.cleanupPath) {
      await removeLocalFile(resolved.filePath);
      try {
        await fs.promises.rmdir(resolved.cleanupPath, { recursive: true });
      } catch (_) {}
    }
  }
};

module.exports = {
  extractTextFromDocument,
  processDocumentJob,
};
