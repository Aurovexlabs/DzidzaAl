const StudySession = require("../models/StudySession");
const Quiz = require("../models/Quiz");
const Flashcard = require("../models/Flashcard");
const User = require("../models/User");
const { generateCoachMessage } = require("../services/aiService");

// GET /api/analytics/overview
const getOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [sessions30d, quizzes30d, flashcardsDue, user] = await Promise.all([
      StudySession.find({ user: userId, date: { $gte: thirtyDaysAgo } }),
      Quiz.find({
        user: userId,
        status: "completed",
        completedAt: { $gte: thirtyDaysAgo },
      }),
      Flashcard.countDocuments({
        user: userId,
        isActive: true,
        nextReviewDate: { $lte: now },
      }),
      User.findById(userId),
    ]);

    const totalHours =
      sessions30d.reduce((s, x) => s + x.durationMinutes, 0) / 60;
    const avgQuizScore = quizzes30d.length
      ? Math.round(
          quizzes30d.reduce((s, q) => s + q.score, 0) / quizzes30d.length,
        )
      : 0;

    // Weekly hours (last 7 days by day)
    const weeklyHours = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now);
      day.setDate(day.getDate() - (6 - i));
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const dayMinutes = sessions30d
        .filter((s) => s.date >= day && s.date < nextDay)
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      return {
        day: day.toLocaleDateString("en-US", { weekday: "short" }),
        hours: Math.round((dayMinutes / 60) * 10) / 10,
      };
    });

    // Exam readiness per subject
    const examReadiness = (user.subjects || []).map((s) => ({
      subject: s.name,
      readiness: s.masteryScore,
      hoursStudied: s.hoursStudied,
      status:
        s.masteryScore >= 70
          ? "on_track"
          : s.masteryScore >= 40
            ? "needs_work"
            : "critical",
    }));

    const weekSessions = sessions30d.filter((s) => s.date >= sevenDaysAgo);
    const prevWeekSessions = sessions30d.filter((s) => s.date < sevenDaysAgo);
    const weekHours =
      weekSessions.reduce((s, x) => s + x.durationMinutes, 0) / 60;
    const prevWeekHours =
      prevWeekSessions.reduce((s, x) => s + x.durationMinutes, 0) / 60;

    res.json({
      success: true,
      data: {
        totalHoursThisMonth: Math.round(totalHours * 10) / 10,
        avgQuizScore,
        flashcardsDue,
        streak: user.streak,
        xp: user.xp,
        level: user.level,
        weeklyHours,
        examReadiness,
        sessionCount: sessions30d.length,
        weekVsPrevWeek: {
          thisWeek: Math.round(weekHours * 10) / 10,
          lastWeek: Math.round(prevWeekHours * 10) / 10,
          change:
            prevWeekHours > 0
              ? Math.round(((weekHours - prevWeekHours) / prevWeekHours) * 100)
              : 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/subject/:subject
const getSubjectAnalytics = async (req, res, next) => {
  try {
    const { subject } = req.params;
    const userId = req.user._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [sessions, quizzes] = await Promise.all([
      StudySession.find({
        user: userId,
        subject,
        date: { $gte: thirtyDaysAgo },
      }).sort({ date: 1 }),
      Quiz.find({
        user: userId,
        subject,
        status: "completed",
        completedAt: { $gte: thirtyDaysAgo },
      }).sort({ completedAt: 1 }),
    ]);

    const quizTrend = quizzes.map((q) => ({
      date: q.completedAt,
      score: q.score,
      difficulty: q.currentDifficulty,
    }));

    const user = await User.findById(userId).select("subjects");
    const subjectData = user.subjects?.find((s) => s.name === subject);

    res.json({
      success: true,
      data: {
        subject,
        mastery: subjectData?.masteryScore || 0,
        totalHours:
          Math.round(
            (sessions.reduce((s, x) => s + x.durationMinutes, 0) / 60) * 10,
          ) / 10,
        quizCount: quizzes.length,
        avgScore: quizzes.length
          ? Math.round(
              quizzes.reduce((s, q) => s + q.score, 0) / quizzes.length,
            )
          : 0,
        quizTrend,
        sessions: sessions.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/coach-message
const getCoachMessage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "name subjects streak preferredLanguage xp",
    );
    const weakSubjects = (user.subjects || [])
      .filter((s) => s.masteryScore < 60)
      .map((s) => s.name);

    const message = await generateCoachMessage({
      userName: user.name,
      performanceData: user.subjects
        ?.slice(0, 5)
        .map((s) => ({ name: s.name, mastery: s.masteryScore })),
      streak: user.streak.current,
      weakSubjects,
      language: user.preferredLanguage,
    });

    res.json({ success: true, data: { message } });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/education
const getEducationAnalytics = async (req, res, next) => {
  try {
    const [educationLevels, subjectCounts, curriculumCounts, programCounts] =
      await Promise.all([
        User.aggregate([
          { $match: { isActive: true, isEmailVerified: true } },
          { $group: { _id: "$educationLevel", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        User.aggregate([
          { $match: { isActive: true, isEmailVerified: true } },
          { $unwind: { path: "$subjects", preserveNullAndEmptyArrays: false } },
          { $group: { _id: "$subjects.name", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ]),
        User.aggregate([
          { $match: { isActive: true, isEmailVerified: true } },
          {
            $group: {
              _id: "$academicProfile.curriculumMetadata.system",
              count: { $sum: 1 },
            },
          },
          { $match: { _id: { $ne: null, $ne: "" } } },
          { $sort: { count: -1 } },
        ]),
        User.aggregate([
          { $match: { isActive: true, isEmailVerified: true } },
          {
            $group: {
              _id: "$academicProfile.program.degreeProgram",
              count: { $sum: 1 },
            },
          },
          { $match: { _id: { $ne: null, $ne: "" } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ]),
      ]);

    res.json({
      success: true,
      data: {
        educationLevels,
        subjectCounts,
        curriculumCounts,
        programCounts,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/analytics/study-session
const logStudySession = async (req, res, next) => {
  try {
    const { subject, topic, durationMinutes, type, notes, focusScore } =
      req.body;
    if (!subject || !durationMinutes) {
      return res.status(400).json({
        success: false,
        message: "subject and durationMinutes required",
      });
    }

    const xpEarned = Math.round(durationMinutes * 0.5);
    const session = await StudySession.create({
      user: req.user._id,
      subject,
      topic,
      durationMinutes,
      type,
      notes,
      focusScore,
      xpEarned,
    });

    const user = await User.findById(req.user._id);
    user.xp += xpEarned;
    user.updateLevel();
    user.updateStreak();
    const subjectIdx = user.subjects?.findIndex((s) => s.name === subject);
    if (subjectIdx >= 0) {
      user.subjects[subjectIdx].hoursStudied += durationMinutes / 60;
      user.subjects[subjectIdx].lastStudied = new Date();
    }
    await user.save();

    res.status(201).json({ success: true, data: { session, xpEarned } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview,
  getSubjectAnalytics,
  getCoachMessage,
  getEducationAnalytics,
  logStudySession,
};
