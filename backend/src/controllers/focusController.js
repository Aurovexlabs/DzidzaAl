const FocusSession = require('../models/FocusSession');
const StudySession = require('../models/StudySession');
const User = require('../models/User');
const { analyseFocusSession } = require('../services/aiService');

// POST /api/focus/start
const startSession = async (req, res, next) => {
  try {
    const { subject, topic, goal, workMinutes = 25, breakMinutes = 5, longBreakMinutes = 15 } = req.body;

    const session = await FocusSession.create({
      user: req.user._id,
      subject, topic, goal,
      workMinutes, breakMinutes, longBreakMinutes,
      status: 'active',
      startedAt: new Date(),
    });

    res.status(201).json({ success: true, data: { session } });
  } catch (err) { next(err); }
};

// PATCH /api/focus/:id/pomodoro-complete
const completePomodoro = async (req, res, next) => {
  try {
    const session = await FocusSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'active' },
      {
        $inc: {
          pomodorosCompleted: 1,
          totalFocusMinutes: req.body.workMinutes || 25,
        },
        status: 'break',
      },
      { new: true }
    );
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: { session } });
  } catch (err) { next(err); }
};

// PATCH /api/focus/:id/break-complete
const completeBreak = async (req, res, next) => {
  try {
    const session = await FocusSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'break' },
      { status: 'active' },
      { new: true }
    );
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: { session } });
  } catch (err) { next(err); }
};

// PATCH /api/focus/:id/distraction
const logDistraction = async (req, res, next) => {
  try {
    const session = await FocusSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $inc: { distractionCount: 1 } },
      { new: true }
    );
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: { distractionCount: session.distractionCount } });
  } catch (err) { next(err); }
};

// POST /api/focus/:id/complete
const completeSession = async (req, res, next) => {
  try {
    const { accomplishments, obstacles, rating, abandoned = false } = req.body;
    const session = await FocusSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const { feedback, focusScore } = await analyseFocusSession({
      subject: session.subject,
      goal: session.goal,
      pomodorosCompleted: session.pomodorosCompleted,
      totalMinutes: session.totalFocusMinutes,
      distractionCount: session.distractionCount,
      accomplishments,
    });

    session.status = abandoned ? 'abandoned' : 'completed';
    session.endedAt = new Date();
    session.accomplishments = accomplishments;
    session.obstacles = obstacles;
    session.rating = rating;
    session.focusScore = focusScore;

    // XP: 2 XP per pomodoro + bonus for high focus score
    const xpEarned = (session.pomodorosCompleted * 10) + (focusScore >= 80 ? 25 : focusScore >= 60 ? 10 : 0);
    session.xpEarned = xpEarned;
    await session.save();

    if (!abandoned && session.totalFocusMinutes > 0) {
      await StudySession.create({
        user: req.user._id,
        subject: session.subject || 'General',
        topic: session.topic,
        durationMinutes: session.totalFocusMinutes,
        type: 'study',
        focusScore,
        xpEarned,
      });

      const user = await User.findById(req.user._id);
      user.xp += xpEarned;
      user.updateLevel();
      user.updateStreak();
      await user.save();
    }

    res.json({ success: true, data: { session, feedback, focusScore, xpEarned } });
  } catch (err) { next(err); }
};

// GET /api/focus/history
const getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const sessions = await FocusSession.find({ user: req.user._id, status: { $in: ['completed', 'abandoned'] } })
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const stats = await FocusSession.aggregate([
      { $match: { user: req.user._id, status: 'completed' } },
      { $group: {
        _id: null,
        totalPomodoros: { $sum: '$pomodorosCompleted' },
        totalMinutes: { $sum: '$totalFocusMinutes' },
        avgFocusScore: { $avg: '$focusScore' },
        totalSessions: { $sum: 1 },
      }},
    ]);

    res.json({ success: true, data: { sessions, stats: stats[0] || {} } });
  } catch (err) { next(err); }
};

module.exports = { startSession, completePomodoro, completeBreak, logDistraction, completeSession, getHistory };
