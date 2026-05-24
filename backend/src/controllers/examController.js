const ExamSession = require("../models/ExamSession");
const User = require("../models/User");
const StudySession = require("../models/StudySession");
const {
  generateExam,
  gradeExamAnswers,
  analyzeExamPerformance,
} = require("../services/aiService");

// POST /api/exams/generate
const generate = async (req, res, next) => {
  try {
    const { subject, year, paper, questionTypes, totalMarks } = req.body;
    if (!subject)
      return res
        .status(400)
        .json({ success: false, message: "Subject is required" });

    const examData = await generateExam({
      subject,
      educationLevel: req.user.educationLevel,
      year,
      paper,
      questionTypes: questionTypes || ["mcq", "short_answer", "essay"],
      totalMarks: totalMarks || 100,
      academicProfile: req.user.academicProfile,
    });

    const exam = await ExamSession.create({
      user: req.user._id,
      title: examData.title || `${subject} Exam`,
      subject,
      educationLevel: req.user.educationLevel,
      year,
      paper,
      questions: examData.questions,
      timeLimitMinutes: examData.timeLimitMinutes || 180,
      totalMarks: examData.totalMarks || totalMarks || 100,
      status: "pending",
    });

    res.status(201).json({ success: true, data: { exam } });
  } catch (err) {
    next(err);
  }
};

// GET /api/exams
const getAll = async (req, res, next) => {
  try {
    const { subject, status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    if (subject) filter.subject = subject;
    if (status) filter.status = status;

    const [exams, total] = await Promise.all([
      ExamSession.find(filter)
        .select(
          "title subject year paper status percentage grade timeLimitMinutes totalMarks createdAt submittedAt",
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      ExamSession.countDocuments(filter),
    ]);

    res.json({ success: true, data: { exams, total, page: parseInt(page) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/exams/:id
const getOne = async (req, res, next) => {
  try {
    const exam = await ExamSession.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!exam)
      return res
        .status(404)
        .json({ success: false, message: "Exam not found" });
    res.json({ success: true, data: { exam } });
  } catch (err) {
    next(err);
  }
};

// POST /api/exams/:id/start
const start = async (req, res, next) => {
  try {
    const exam = await ExamSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: "pending" },
      { status: "in_progress", startedAt: new Date() },
      { new: true },
    );
    if (!exam)
      return res
        .status(404)
        .json({ success: false, message: "Exam not found or already started" });
    res.json({ success: true, data: { exam } });
  } catch (err) {
    next(err);
  }
};

// POST /api/exams/:id/save-progress
const saveProgress = async (req, res, next) => {
  try {
    const { answers, timeRemainingSeconds } = req.body;
    await ExamSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: "in_progress" },
      { answers, timeRemainingSeconds },
    );
    res.json({ success: true, message: "Progress saved" });
  } catch (err) {
    next(err);
  }
};

// POST /api/exams/:id/submit
const submit = async (req, res, next) => {
  try {
    const { answers = [] } = req.body;
    if (!Array.isArray(answers)) {
      return res
        .status(400)
        .json({ success: false, message: "answers array required" });
    }

    const exam = await ExamSession.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        status: { $in: ["pending", "in_progress"] },
      },
      { $set: { status: "submitted" } },
      { new: true },
    );

    if (!exam) {
      const existing = await ExamSession.findOne({
        _id: req.params.id,
        user: req.user._id,
      }).select("status");

      if (!existing) {
        return res
          .status(404)
          .json({ success: false, message: "Exam not found" });
      }

      return res
        .status(400)
        .json({ success: false, message: "Already submitted" });
    }

    // Auto-grade MCQs
    let earnedMarks = 0;
    const gradedAnswers = answers.map((a) => {
      const question = exam.questions.id(a.questionId);
      if (!question) return a;
      if (a.type === "mcq") {
        const isCorrect = a.userAnswer === question.correctAnswer;
        if (isCorrect) earnedMarks += question.marks || 1;
        return {
          ...a,
          isCorrect,
          score: isCorrect ? question.marks || 1 : 0,
          maxScore: question.marks || 1,
          correctAnswer: question.correctAnswer,
        };
      }
      return { ...a, maxScore: question.marks || 1, isCorrect: null, score: 0 };
    });

    // AI grade subjective answers
    const aiGradings = await gradeExamAnswers({
      questions: exam.questions,
      answers: gradedAnswers.filter((a) => a.type !== "mcq"),
      subject: exam.subject,
      educationLevel: exam.educationLevel,
    });

    // Merge AI grades
    aiGradings.forEach((grading) => {
      const idx = gradedAnswers.findIndex(
        (a) => a.questionText === grading.questionText,
      );
      if (idx !== -1) {
        gradedAnswers[idx].score = grading.score || 0;
        gradedAnswers[idx].feedback = grading.feedback;
        earnedMarks += grading.score || 0;
      }
    });

    const percentage = Math.round((earnedMarks / exam.totalMarks) * 100);
    const weakTopics = [
      ...new Set(
        gradedAnswers
          .filter((a) => a.score / a.maxScore < 0.5)
          .map((a) => {
            const q = exam.questions.id(a.questionId);
            return q?.topic;
          })
          .filter(Boolean),
      ),
    ];

    const aiFeedback = await analyzeExamPerformance({
      subject: exam.subject,
      educationLevel: exam.educationLevel,
      percentage,
      grade: exam.calculateGrade.call({ percentage }),
      weakTopics,
      answers: gradedAnswers,
    });

    exam.answers = gradedAnswers;
    exam.earnedMarks = earnedMarks;
    exam.percentage = percentage;
    exam.grade = exam.calculateGrade.call({ percentage });
    exam.weakTopics = weakTopics;
    exam.aiFeedback = aiFeedback;
    exam.status = "graded";
    exam.submittedAt = new Date();

    // XP based on score
    const xpEarned = Math.round(percentage * 0.8) + 20;
    exam.xpEarned = xpEarned;
    const updatedExam = await ExamSession.findOneAndUpdate(
      {
        _id: exam._id,
        user: req.user._id,
        status: { $in: ["submitted", "graded"] },
      },
      {
        $set: {
          answers: exam.answers,
          earnedMarks: exam.earnedMarks,
          percentage: exam.percentage,
          grade: exam.grade,
          weakTopics: exam.weakTopics,
          aiFeedback: exam.aiFeedback,
          status: exam.status,
          submittedAt: exam.submittedAt,
          xpEarned: exam.xpEarned,
        },
      },
      { new: true },
    );

    if (!updatedExam) {
      return res.status(409).json({
        success: false,
        message: "Exam submission conflict. Please retry.",
      });
    }

    // Update user XP, mastery, streak
    const user = await User.findById(req.user._id);
    user.xp += xpEarned;
    user.updateLevel();
    user.updateStreak();
    const subIdx = user.subjects?.findIndex((s) => s.name === exam.subject);
    if (subIdx >= 0) {
      user.subjects[subIdx].masteryScore = Math.round(
        user.subjects[subIdx].masteryScore * 0.6 + percentage * 0.4,
      );
    }
    await user.save();

    const durationMins =
      Math.round((new Date() - exam.startedAt) / 60000) ||
      exam.timeLimitMinutes;
    await StudySession.create({
      user: req.user._id,
      subject: exam.subject,
      type: "quiz",
      durationMinutes: durationMins,
      xpEarned,
    });

    res.json({ success: true, data: { exam: updatedExam, xpEarned } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/exams/:id
const remove = async (req, res, next) => {
  try {
    await ExamSession.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    res.json({ success: true, message: "Exam deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generate,
  getAll,
  getOne,
  start,
  saveProgress,
  submit,
  remove,
};
