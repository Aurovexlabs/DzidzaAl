const Quiz = require("../models/Quiz");
const User = require("../models/User");
const StudySession = require("../models/StudySession");
const { generateQuiz, adjustDifficulty } = require("../services/aiService");

// POST /api/quizzes/generate
const generateNewQuiz = async (req, res, next) => {
  try {
    const { subject, topic, difficulty, count = 10 } = req.body;
    if (!subject)
      return res
        .status(400)
        .json({ success: false, message: "Subject is required" });

    const user = req.user;
    const subjectData = user.subjects?.find((s) => s.name === subject);
    const recentQuizzes = await Quiz.find({
      user: user._id,
      subject,
      status: "completed",
    })
      .sort({ completedAt: -1 })
      .limit(5)
      .select("score");
    const recentScores = recentQuizzes.map((q) => q.score);
    const effectiveDifficulty =
      difficulty ||
      adjustDifficulty(subjectData?.lastDifficulty || "medium", recentScores);

    const questions = await generateQuiz({
      subject,
      topic,
      educationLevel: user.educationLevel,
      difficulty: effectiveDifficulty,
      count: Math.min(count, 20),
      academicProfile: user.academicProfile,
    });

    const quiz = await Quiz.create({
      user: user._id,
      subject,
      topic,
      educationLevel: user.educationLevel,
      title: topic ? `${subject}: ${topic}` : `${subject} Quiz`,
      questions,
      totalQuestions: questions.length,
      currentDifficulty: effectiveDifficulty,
    });

    res.status(201).json({ success: true, data: { quiz } });
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes
const getQuizzes = async (req, res, next) => {
  try {
    const { subject, status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    if (subject) filter.subject = subject;
    if (status) filter.status = status;

    const quizzes = await Quiz.find(filter)
      .select(
        "title subject topic status score totalQuestions currentDifficulty createdAt completedAt",
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Quiz.countDocuments(filter);
    res.json({
      success: true,
      data: {
        quizzes,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes/:id
const getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    res.json({ success: true, data: { quiz } });
  } catch (err) {
    next(err);
  }
};

// POST /api/quizzes/:id/start
const startQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: "pending" },
      { status: "in_progress", startedAt: new Date() },
      { new: true },
    );
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found or already started" });
    res.json({ success: true, data: { quiz } });
  } catch (err) {
    next(err);
  }
};

// POST /api/quizzes/:id/submit
const submitQuiz = async (req, res, next) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers))
      return res
        .status(400)
        .json({ success: false, message: "answers array required" });

    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    if (quiz.status === "completed")
      return res
        .status(400)
        .json({ success: false, message: "Quiz already completed" });

    let correctCount = 0;
    const attempts = answers
      .map(({ questionId, selectedAnswer, timeTaken }) => {
        const question = quiz.questions.id(questionId);
        if (!question) return null;
        const isCorrect = question.correctAnswer === selectedAnswer;
        if (isCorrect) correctCount++;
        return { question: questionId, selectedAnswer, isCorrect, timeTaken };
      })
      .filter(Boolean);

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    quiz.attempts = attempts;
    quiz.correctAnswers = correctCount;
    quiz.score = score;
    quiz.status = "completed";
    quiz.completedAt = new Date();
    await quiz.save();

    // Update subject mastery + XP
    const user = await User.findById(req.user._id);
    const subjectIdx = user.subjects?.findIndex((s) => s.name === quiz.subject);
    if (subjectIdx >= 0) {
      const prev = user.subjects[subjectIdx].masteryScore;
      user.subjects[subjectIdx].masteryScore = Math.round(
        prev * 0.7 + score * 0.3,
      );
      user.subjects[subjectIdx].lastStudied = new Date();
    }
    const xpEarned = Math.round(score * 0.5) + 10;
    user.xp += xpEarned;
    user.updateLevel();
    user.updateStreak();
    await user.save();

    await StudySession.create({
      user: req.user._id,
      subject: quiz.subject,
      topic: quiz.topic,
      durationMinutes: Math.round((new Date() - quiz.startedAt) / 60000) || 15,
      type: "quiz",
      xpEarned,
    });

    res.json({
      success: true,
      data: {
        score,
        correctAnswers: correctCount,
        totalQuestions: quiz.questions.length,
        xpEarned,
        attempts,
        questions: quiz.questions,
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/quizzes/:id
const deleteQuiz = async (req, res, next) => {
  try {
    await Quiz.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: "Quiz deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateNewQuiz,
  getQuizzes,
  getQuiz,
  startQuiz,
  submitQuiz,
  deleteQuiz,
};
