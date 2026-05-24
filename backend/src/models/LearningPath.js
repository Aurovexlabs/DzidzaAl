const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: String,
  description: String,
  topic: String,
  subject: String,
  estimatedHours: Number,
  resources: [{ type: String, url: String, description: String }],
  prerequisites: [String],
  isCompleted: { type: Boolean, default: false },
  completedAt: Date,
  masteryRequired: { type: Number, default: 70 }, // % required before moving on
  order: Number,
});

const learningPathSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  title: String,
  description: String,
  educationLevel: String,
  targetExamDate: Date,
  currentMilestoneIndex: { type: Number, default: 0 },
  milestones: [milestoneSchema],
  totalEstimatedHours: Number,
  completionPercentage: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  aiGenerated: { type: Boolean, default: true },
  lastUpdated: Date,
}, { timestamps: true });

learningPathSchema.index({ user: 1, subject: 1 });

// Recalculate completion
learningPathSchema.methods.recalculateProgress = function () {
  if (!this.milestones.length) return;
  const done = this.milestones.filter(m => m.isCompleted).length;
  this.completionPercentage = Math.round((done / this.milestones.length) * 100);
  const nextIdx = this.milestones.findIndex(m => !m.isCompleted);
  this.currentMilestoneIndex = nextIdx === -1 ? this.milestones.length - 1 : nextIdx;
};

module.exports = mongoose.model('LearningPath', learningPathSchema);
