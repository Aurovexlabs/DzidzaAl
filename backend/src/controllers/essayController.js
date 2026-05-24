const EssayGrade = require('../models/EssayGrade');
const User = require('../models/User');
const { gradeEssay } = require('../services/aiService');

// POST /api/essays/grade
const grade = async (req, res, next) => {
  try {
    const { question, answer, subject, maxMarks } = req.body;
    if (!question || !answer) return res.status(400).json({ success: false, message: 'Question and answer are required' });
    if (answer.trim().split(' ').length < 10) {
      return res.status(400).json({ success: false, message: 'Answer is too short to grade' });
    }

    const result = await gradeEssay({
      question,
      answer,
      subject,
      educationLevel: req.user.educationLevel,
      maxMarks: maxMarks || 20,
    });

    const essayGrade = await EssayGrade.create({
      user: req.user._id,
      subject,
      question,
      userAnswer: answer,
      educationLevel: req.user.educationLevel,
      maxMarks: maxMarks || 20,
      earnedMarks: result.earnedMarks,
      percentage: result.percentage,
      grade: result.grade,
      criteria: result.criteria,
      overallFeedback: result.overallFeedback,
      strengths: result.strengths,
      improvements: result.improvements,
      modelAnswer: result.modelAnswer,
      wordCount: result.wordCount || answer.split(' ').length,
      status: 'graded',
    });

    // Award XP for submitting work
    await User.findByIdAndUpdate(req.user._id, { $inc: { xp: 15 } });

    res.status(201).json({ success: true, data: { grade: essayGrade } });
  } catch (err) { next(err); }
};

// GET /api/essays
const getAll = async (req, res, next) => {
  try {
    const { subject, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    if (subject) filter.subject = subject;

    const [grades, total] = await Promise.all([
      EssayGrade.find(filter)
        .select('subject question grade percentage earnedMarks maxMarks wordCount createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      EssayGrade.countDocuments(filter),
    ]);

    res.json({ success: true, data: { grades, total } });
  } catch (err) { next(err); }
};

// GET /api/essays/:id
const getOne = async (req, res, next) => {
  try {
    const grade = await EssayGrade.findOne({ _id: req.params.id, user: req.user._id });
    if (!grade) return res.status(404).json({ success: false, message: 'Grade not found' });
    res.json({ success: true, data: { grade } });
  } catch (err) { next(err); }
};

// DELETE /api/essays/:id
const remove = async (req, res, next) => {
  try {
    await EssayGrade.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

module.exports = { grade, getAll, getOne, remove };
