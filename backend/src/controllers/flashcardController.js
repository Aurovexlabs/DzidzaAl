const Flashcard = require('../models/Flashcard');
const User = require('../models/User');

// GET /api/flashcards
const getFlashcards = async (req, res, next) => {
  try {
    const { subject, dueOnly } = req.query;
    const filter = { user: req.user._id, isActive: true };
    if (subject) filter.subject = subject;
    if (dueOnly === 'true') filter.nextReviewDate = { $lte: new Date() };

    const flashcards = await Flashcard.find(filter).sort({ nextReviewDate: 1 }).limit(50);
    res.json({ success: true, data: { flashcards, total: flashcards.length } });
  } catch (err) { next(err); }
};

// GET /api/flashcards/due
const getDueFlashcards = async (req, res, next) => {
  try {
    const flashcards = await Flashcard.find({
      user: req.user._id,
      isActive: true,
      nextReviewDate: { $lte: new Date() },
    }).sort({ nextReviewDate: 1 }).limit(20);
    res.json({ success: true, data: { flashcards, count: flashcards.length } });
  } catch (err) { next(err); }
};

// POST /api/flashcards
const createFlashcard = async (req, res, next) => {
  try {
    const { front, back, subject, topic } = req.body;
    const flashcard = await Flashcard.create({
      user: req.user._id, front, back, subject, topic, aiGenerated: false,
    });
    res.status(201).json({ success: true, data: { flashcard } });
  } catch (err) { next(err); }
};

// POST /api/flashcards/:id/review
const reviewFlashcard = async (req, res, next) => {
  try {
    const { quality } = req.body;
    if (quality < 0 || quality > 5) {
      return res.status(400).json({ success: false, message: 'Quality must be 0-5' });
    }

    const flashcard = await Flashcard.findOne({ _id: req.params.id, user: req.user._id });
    if (!flashcard) return res.status(404).json({ success: false, message: 'Flashcard not found' });

    flashcard.updateSM2(quality);
    await flashcard.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { xp: 3 } });

    res.json({
      success: true,
      data: { nextReviewDate: flashcard.nextReviewDate, interval: flashcard.interval },
    });
  } catch (err) { next(err); }
};

// DELETE /api/flashcards/:id
const deleteFlashcard = async (req, res, next) => {
  try {
    await Flashcard.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isActive: false });
    res.json({ success: true, message: 'Flashcard deleted' });
  } catch (err) { next(err); }
};

// GET /api/flashcards/stats
const getFlashcardStats = async (req, res, next) => {
  try {
    const total = await Flashcard.countDocuments({ user: req.user._id, isActive: true });
    const due = await Flashcard.countDocuments({ user: req.user._id, isActive: true, nextReviewDate: { $lte: new Date() } });
    const bySubject = await Flashcard.aggregate([
      { $match: { user: req.user._id, isActive: true } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: { total, due, bySubject } });
  } catch (err) { next(err); }
};

module.exports = { getFlashcards, getDueFlashcards, createFlashcard, reviewFlashcard, deleteFlashcard, getFlashcardStats };
