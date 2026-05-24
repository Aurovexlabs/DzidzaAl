const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: String,
  topic: String,
  goal: String,               // What they plan to achieve this session

  // Pomodoro config
  workMinutes: { type: Number, default: 25 },
  breakMinutes: { type: Number, default: 5 },
  longBreakMinutes: { type: Number, default: 15 },
  longBreakAfter: { type: Number, default: 4 }, // pomodoros before long break

  // Progress
  pomodorosCompleted: { type: Number, default: 0 },
  totalFocusMinutes: { type: Number, default: 0 },
  distractionCount: { type: Number, default: 0 },
  focusScore: { type: Number, default: 0 }, // 0-100 calculated from distractions

  // Status
  status: { type: String, enum: ['active', 'break', 'completed', 'abandoned'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,

  // Reflection (filled at end)
  accomplishments: String,
  obstacles: String,
  rating: { type: Number, min: 1, max: 5 },

  xpEarned: { type: Number, default: 0 },
}, { timestamps: true });

focusSessionSchema.index({ user: 1, startedAt: -1 });

module.exports = mongoose.model('FocusSession', focusSessionSchema);
