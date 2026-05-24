const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['multiple_choice', 'short_answer', 'true_false'],
    default: 'multiple_choice',
  },
  options: [String],
  correctAnswer: { type: String, required: true },
  explanation: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  subject: String,
  topic: String,
  aiGenerated: { type: Boolean, default: true },
});

const attemptSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId },
  selectedAnswer: String,
  isCorrect: Boolean,
  timeTaken: Number,
  answeredAt: { type: Date, default: Date.now },
});

const quizSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: String,
  subject: { type: String, required: true },
  topic: String,
  educationLevel: String,
  questions: [questionSchema],
  attempts: [attemptSchema],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
  },
  score: { type: Number, default: 0 },
  totalQuestions: Number,
  correctAnswers: { type: Number, default: 0 },
  timeLimitMinutes: Number,
  startedAt: Date,
  completedAt: Date,
  currentDifficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  aiGenerated: { type: Boolean, default: true },
  sourceDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
}, {
  timestamps: true,
});

quizSchema.index({ user: 1, subject: 1, createdAt: -1 });

module.exports = mongoose.model('Quiz', quizSchema);
