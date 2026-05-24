"use strict";
const {
  analyzeKnowledgeGaps,
  explainConcept,
  generatePracticeProblems,
  generateStudyNotes,
} = require("../services/aiService");
const Quiz = require("../models/Quiz");
const User = require("../models/User");

// GET /api/ai/knowledge-gaps
const knowledgeGaps = async (req, res, next) => {
  try {
    const { subject } = req.query;
    const userId = req.user._id;
    const user = await User.findById(userId).select("subjects educationLevel");
    const recentQuizzes = await Quiz.find({
      user: userId,
      status: "completed",
      ...(subject ? { subject } : {}),
    })
      .sort({ completedAt: -1 })
      .limit(10)
      .select(
        "subject score correctAnswers totalQuestions currentDifficulty completedAt",
      );

    const quizHistory = recentQuizzes.map((q) => ({
      subject: q.subject,
      score: q.score,
      correctAnswers: q.correctAnswers,
      total: q.totalQuestions,
      difficulty: q.currentDifficulty,
      date: q.completedAt,
    }));

    const masteryData = (user.subjects || []).map((s) => ({
      subject: s.name,
      mastery: s.masteryScore,
      hours: s.hoursStudied,
    }));

    const analysis = await analyzeKnowledgeGaps({
      subject: subject || "all subjects",
      educationLevel: user.educationLevel,
      quizHistory,
      masteryData,
      academicProfile: user.academicProfile,
    });

    res.json({ success: true, data: { analysis } });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/explain
const explain = async (req, res, next) => {
  try {
    const { concept, subject, style = "standard", language } = req.body;
    if (!concept)
      return res
        .status(400)
        .json({ success: false, message: "concept is required" });

    const explanation = await explainConcept({
      concept,
      subject,
      educationLevel: req.user.educationLevel,
      language: language || req.user.preferredLanguage || "english",
      style,
      academicProfile: req.user.academicProfile,
    });

    res.json({ success: true, data: { explanation, concept, style } });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/practice-problems
const practiceProblems = async (req, res, next) => {
  try {
    const {
      topic,
      subject,
      count = 5,
      includeWorkedSolution = true,
    } = req.body;
    if (!topic || !subject) {
      return res
        .status(400)
        .json({ success: false, message: "topic and subject are required" });
    }

    const problems = await generatePracticeProblems({
      topic,
      subject,
      educationLevel: req.user.educationLevel,
      count: Math.min(count, 10),
      includeWorkedSolution,
      academicProfile: req.user.academicProfile,
    });

    res.json({ success: true, data: { problems, topic, subject } });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/study-notes
const studyNotes = async (req, res, next) => {
  try {
    const { topic, subject, language } = req.body;
    if (!topic || !subject) {
      return res
        .status(400)
        .json({ success: false, message: "topic and subject are required" });
    }

    const notes = await generateStudyNotes({
      topic,
      subject,
      educationLevel: req.user.educationLevel,
      language: language || req.user.preferredLanguage || "english",
      academicProfile: req.user.academicProfile,
    });

    res.json({ success: true, data: { notes, topic, subject } });
  } catch (err) {
    next(err);
  }
};

module.exports = { knowledgeGaps, explain, practiceProblems, studyNotes };
