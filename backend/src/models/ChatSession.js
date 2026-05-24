const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: { type: String, required: true },
  language: { type: String, default: 'english' },
  tokensUsed: Number,
  createdAt: { type: Date, default: Date.now },
});

const chatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, default: 'New Chat' },
  subject: String,
  messages: [messageSchema],
  language: {
    type: String,
    enum: ['english', 'shona', 'ndebele'],
    default: 'english',
  },
  totalTokensUsed: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  documentContext: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
}, {
  timestamps: true,
});

chatSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
