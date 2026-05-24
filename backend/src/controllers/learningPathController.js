const LearningPath = require('../models/LearningPath');
const User = require('../models/User');
const { generateLearningPath } = require('../services/aiService');

// POST /api/learning-path/generate
const generate = async (req, res, next) => {
  try {
    const { subject, targetExamDate, hoursPerDay } = req.body;
    if (!subject) return res.status(400).json({ success: false, message: 'Subject is required' });

    const user = await User.findById(req.user._id);
    const subjectData = user.subjects?.find(s => s.name === subject);
    const weakTopics = user.subjects
      ?.filter(s => s.masteryScore < 60)
      .map(s => s.name) || [];

    const pathData = await generateLearningPath({
      subject,
      educationLevel: user.educationLevel,
      currentMastery: subjectData?.masteryScore || 0,
      targetExamDate,
      weakTopics,
      hoursPerDay: hoursPerDay || 2,
    });

    // Deactivate existing paths for this subject
    await LearningPath.updateMany({ user: user._id, subject, isActive: true }, { isActive: false });

    const path = await LearningPath.create({
      user: user._id,
      subject,
      educationLevel: user.educationLevel,
      title: pathData.title,
      description: pathData.description,
      totalEstimatedHours: pathData.totalEstimatedHours,
      milestones: pathData.milestones,
      targetExamDate,
      isActive: true,
    });

    res.status(201).json({ success: true, data: { path } });
  } catch (err) { next(err); }
};

// GET /api/learning-path
const getAll = async (req, res, next) => {
  try {
    const paths = await LearningPath.find({ user: req.user._id, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: { paths } });
  } catch (err) { next(err); }
};

// GET /api/learning-path/:id
const getOne = async (req, res, next) => {
  try {
    const path = await LearningPath.findOne({ _id: req.params.id, user: req.user._id });
    if (!path) return res.status(404).json({ success: false, message: 'Learning path not found' });
    res.json({ success: true, data: { path } });
  } catch (err) { next(err); }
};

// PATCH /api/learning-path/:pathId/milestones/:milestoneId/complete
const completeMilestone = async (req, res, next) => {
  try {
    const path = await LearningPath.findOne({ _id: req.params.pathId, user: req.user._id });
    if (!path) return res.status(404).json({ success: false, message: 'Path not found' });

    const milestone = path.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    milestone.isCompleted = true;
    milestone.completedAt = new Date();
    path.recalculateProgress();
    path.lastUpdated = new Date();
    await path.save();

    // Award XP for milestone completion
    await User.findByIdAndUpdate(req.user._id, { $inc: { xp: 50 } });

    res.json({ success: true, data: { path, completionPercentage: path.completionPercentage } });
  } catch (err) { next(err); }
};

// DELETE /api/learning-path/:id
const remove = async (req, res, next) => {
  try {
    await LearningPath.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isActive: false });
    res.json({ success: true, message: 'Learning path removed' });
  } catch (err) { next(err); }
};

module.exports = { generate, getAll, getOne, completeMilestone, remove };
