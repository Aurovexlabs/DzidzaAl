const mongoose = require("mongoose");

const documentChunkSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chunkIndex: { type: Number, required: true },
    chunkText: { type: String, required: true },
    subject: String,
    vectorId: { type: String, index: true },
    embeddingProvider: { type: String, default: "local-hash" },
    embeddingModel: { type: String, default: "hash-64" },
    embedding: [{ type: Number, required: true }],
  },
  { timestamps: true },
);

documentChunkSchema.index({ document: 1, chunkIndex: 1 }, { unique: true });
documentChunkSchema.index({ user: 1, document: 1 });

module.exports = mongoose.model("DocumentChunk", documentChunkSchema);
