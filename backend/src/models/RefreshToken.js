const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    userAgent: String,
    ipAddress: String,
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    revokedAt: Date,
    replacedByJti: String,
  },
  { timestamps: true },
);

refreshTokenSchema.index({ user: 1, revokedAt: 1, expiresAt: -1 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
