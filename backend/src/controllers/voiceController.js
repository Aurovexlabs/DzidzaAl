const ChatSession = require('../models/ChatSession');
const User = require('../models/User');
const { processVoiceTranscript } = require('../services/aiService');

// POST /api/voice/process
// Receives transcript from Web Speech API, returns AI tutor text response
const process = async (req, res, next) => {
  try {
    const { transcript, sessionId, subject, language } = req.body;
    if (!transcript?.trim()) {
      return res.status(400).json({ success: false, message: 'Transcript is required' });
    }

    const response = await processVoiceTranscript({
      transcript,
      subject,
      educationLevel: req.user.educationLevel,
      language: language || req.user.preferredLanguage || 'english',
    });

    // Optionally save to a chat session if sessionId provided
    if (sessionId) {
      const session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
      if (session) {
        session.messages.push({ role: 'user', content: `[Voice] ${transcript}` });
        session.messages.push({ role: 'assistant', content: response });
        await session.save();
      }
    }

    await User.findByIdAndUpdate(req.user._id, { $inc: { xp: 5 } });

    res.json({ success: true, data: { response, transcript } });
  } catch (err) { next(err); }
};

module.exports = { process };
