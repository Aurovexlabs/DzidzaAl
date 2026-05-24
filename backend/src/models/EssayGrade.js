const mongoose = require('mongoose');

const essayGradeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: String,
  topic: String,
  question: { type: String, required: true },
  userAnswer: { type: String, required: true },
  educationLevel: String,
  maxMarks: { type: Number, default: 20 },

  // AI grading results
  earnedMarks: Number,
  percentage: Number,
  grade: String,

  // Detailed breakdown
  criteria: [{
    name: String,           // e.g. "Content & Knowledge", "Structure", "Language"
    maxMarks: Number,
    earnedMarks: Number,
    feedback: String,
  }],

  overallFeedback: String,
  strengths: [String],
  improvements: [String],
  modelAnswer: String,      // AI-generated model answer for comparison
  wordCount: Number,
  status: { type: String, enum: ['pending', 'graded'], default: 'pending' },

}, { timestamps: true });

essayGradeSchema.index({ user: 1, subject: 1 });

module.exports = mongoose.model('EssayGrade', essayGradeSchema);
