const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  front: { type: String, required: true },
  back: { type: String, required: true },
  subject: String,
  topic: String,
  sourceDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  aiGenerated: { type: Boolean, default: true },

  // Spaced repetition (SM-2 algorithm)
  interval: { type: Number, default: 1 },
  easeFactor: { type: Number, default: 2.5 },
  repetitions: { type: Number, default: 0 },
  nextReviewDate: { type: Date, default: Date.now },
  lastReviewDate: Date,
  lastQuality: { type: Number, min: 0, max: 5 },

  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

flashcardSchema.index({ user: 1, nextReviewDate: 1 });

// SM-2 Spaced Repetition update
flashcardSchema.methods.updateSM2 = function (quality) {
  // quality: 0-5 (0=blackout, 5=perfect)
  if (quality >= 3) {
    if (this.repetitions === 0) this.interval = 1;
    else if (this.repetitions === 1) this.interval = 6;
    else this.interval = Math.round(this.interval * this.easeFactor);
    this.repetitions += 1;
  } else {
    this.repetitions = 0;
    this.interval = 1;
  }
  this.easeFactor = Math.max(
    1.3,
    this.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );
  this.lastQuality = quality;
  this.lastReviewDate = new Date();
  this.nextReviewDate = new Date(Date.now() + this.interval * 24 * 60 * 60 * 1000);
};

module.exports = mongoose.model('Flashcard', flashcardSchema);
