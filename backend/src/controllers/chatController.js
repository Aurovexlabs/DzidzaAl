const ChatSession = require("../models/ChatSession");
const StudySession = require("../models/StudySession");
const User = require("../models/User");
const { chatWithTutor } = require("../services/aiService");

// POST /api/chat/sessions
const createSession = async (req, res, next) => {
  try {
    const { subject, language, title } = req.body;
    const session = await ChatSession.create({
      user: req.user._id,
      subject,
      language: language || req.user.preferredLanguage || "english",
      title: title || (subject ? `${subject} session` : "New Chat"),
    });
    res.status(201).json({ success: true, data: { session } });
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/sessions
const getSessions = async (req, res, next) => {
  try {
    const sessions = await ChatSession.find({
      user: req.user._id,
      isActive: true,
    })
      .select("title subject language createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(20);
    res.json({ success: true, data: { sessions } });
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/sessions/:id
const getSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    res.json({ success: true, data: { session } });
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/sessions/:id/message
const sendMessage = async (req, res, next) => {
  try {
    const { content, language } = req.body;
    if (!content?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Message content required" });

    const session = await ChatSession.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });

    session.messages.push({
      role: "user",
      content,
      language: language || session.language,
    });

    const history = session.messages
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));
    const { content: aiResponse, tokensUsed } = await chatWithTutor({
      messages: history,
      subject: session.subject,
      educationLevel: req.user.educationLevel,
      language: language || session.language,
      userName: req.user.name,
      academicProfile: req.user.academicProfile,
    });

    session.messages.push({
      role: "assistant",
      content: aiResponse,
      tokensUsed,
    });
    session.totalTokensUsed += tokensUsed || 0;
    if (session.messages.length === 2) {
      session.title = content.slice(0, 60);
    }
    await session.save();

    // Award XP for chat interaction
    await User.findByIdAndUpdate(req.user._id, { $inc: { xp: 5 } });

    res.json({
      success: true,
      data: { message: { role: "assistant", content: aiResponse } },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/chat/sessions/:id
const deleteSession = async (req, res, next) => {
  try {
    await ChatSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
    );
    res.json({ success: true, message: "Session deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSession,
  getSessions,
  getSession,
  sendMessage,
  deleteSession,
};
