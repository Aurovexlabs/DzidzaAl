const mongoose = require('mongoose');

const examAnswerSchema = new mongoose.Schema({
  questionId: mongoose.Schema.Types.ObjectId,
  questionText: String,
  type: { type: String, enum: ['mcq', 'short_answer', 'essay'] },
  userAnswer: String,
  correctAnswer: String,
  isCorrect: Boolean,
  score: Number,        // 0-100 per question (for partial marks on essays)
  maxScore: Number,
  feedback: String,     // AI feedback for each answer
  timeTaken: Number,    // seconds
});

const examSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  subject: { type: String, required: true },
  educationLevel: String,
  year: String,           // e.g. "2023" for past papers
  paper: String,          // e.g. "Paper 1", "Paper 2"

  // Questions (mixed types)
  questions: [{
    text: String,
    type: { type: String, enum: ['mcq', 'short_answer', 'essay'], default: 'mcq' },
    options: [String],
    correctAnswer: String,
    marks: { type: Number, default: 1 },
    topic: String,
    imageUrl: String,
  }],

  answers: [examAnswerSchema],

  // Timing
  timeLimitMinutes: { type: Number, required: true },
  startedAt: Date,
  submittedAt: Date,
  timeRemainingSeconds: Number,

  // Results
  status: { type: String, enum: ['pending', 'in_progress', 'submitted', 'graded'], default: 'pending' },
  totalMarks: Number,
  earnedMarks: Number,
  percentage: Number,
  grade: String,          // A, B, C etc based on ZIMSEC grading
  aiFeedback: String,     // Overall exam performance feedback
  weakTopics: [String],
  strongTopics: [String],

  xpEarned: { type: Number, default: 0 },
  isAiGenerated: { type: Boolean, default: true },
}, { timestamps: true });

examSessionSchema.index({ user: 1, subject: 1, createdAt: -1 });

// ZIMSEC grade calculator
examSessionSchema.methods.calculateGrade = function () {
  const p = this.percentage;
  if (p >= 75) return 'A';
  if (p >= 60) return 'B';
  if (p >= 50) return 'C';
  if (p >= 40) return 'D';
  if (p >= 30) return 'E';
  return 'U';
};

module.exports = mongoose.model('ExamSession', examSessionSchema);
