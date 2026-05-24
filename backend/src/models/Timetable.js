const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subject: { type: String, required: true },
  type: {
    type: String,
    enum: ['school', 'study', 'revision', 'rest', 'spaced_repetition'],
    default: 'study',
  },
  isCompleted: { type: Boolean, default: false },
  completedAt: Date,
  notes: String,
  aiGenerated: { type: Boolean, default: false },
});

const timetableSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { type: String, default: 'My Timetable' },
  slots: [timeSlotSchema],
  imageUrl: String,
  ocrRawText: String,
  aiOptimized: { type: Boolean, default: false },
  weekStart: Date,
  isActive: { type: Boolean, default: true },
  aiInsights: [{
    type: String,
    message: String,
    createdAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

timetableSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
