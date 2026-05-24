const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: { type: String, required: true },
  topic: String,
  durationMinutes: { type: Number, required: true },
  type: {
    type: String,
    enum: ['study', 'revision', 'quiz', 'chat', 'document_review'],
    default: 'study',
  },
  xpEarned: { type: Number, default: 0 },
  notes: String,
  timetableSlotId: mongoose.Schema.Types.ObjectId,
  focusScore: { type: Number, min: 0, max: 100 },
  date: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

studySessionSchema.index({ user: 1, date: -1 });
studySessionSchema.index({ user: 1, subject: 1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
