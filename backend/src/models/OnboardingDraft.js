const mongoose = require("mongoose");

const OnboardingDraftSchema = new mongoose.Schema(
  {
    data: { type: Object, default: {} },
    completed: { type: Boolean, default: false },
    ipAddress: { type: String },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true },
);

// TTL index to remove abandoned drafts after expiry
OnboardingDraftSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OnboardingDraft", OnboardingDraftSchema);
