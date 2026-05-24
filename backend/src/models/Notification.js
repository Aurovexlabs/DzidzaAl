const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'study_reminder',
      'missed_session',
      'performance_alert',
      'weak_topic',
      'improvement',
      'spaced_repetition',
      'partner_match',
      'group_activity',
      'ai_coach',
      'streak',
      'badge_earned',
      'otp',
      'security',
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  data: mongoose.Schema.Types.Mixed,
  scheduledFor: Date,
  sentAt: Date,
}, {
  timestamps: true,
});

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
