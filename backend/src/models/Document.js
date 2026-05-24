const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    originalName: String,
    fileType: {
      type: String,
      enum: ["pdf", "docx", "txt", "image"],
    },
    fileUrl: String,
    storageProvider: {
      type: String,
      enum: ["local", "s3"],
      default: "local",
    },
    storageKey: String,
    fileSize: Number,
    subject: String,
    status: {
      type: String,
      enum: ["uploading", "processing", "ready", "error"],
      default: "uploading",
    },
    extractedText: String,
    summary: String,
    flashcardsGenerated: { type: Number, default: 0 },
    pageCount: Number,
    chunkCount: { type: Number, default: 0 },
    tags: [String],
    errorMessage: String,
  },
  {
    timestamps: true,
  },
);

documentSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Document", documentSchema);
