const Timetable = require('../models/Timetable');
const { optimizeTimetable } = require('../services/aiService');

// GET /api/timetable
const getTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findOne({ user: req.user._id, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: { timetable } });
  } catch (err) { next(err); }
};

// POST /api/timetable
const createTimetable = async (req, res, next) => {
  try {
    const { name, slots } = req.body;
    await Timetable.updateMany({ user: req.user._id }, { isActive: false });
    const timetable = await Timetable.create({ user: req.user._id, name: name || 'My Timetable', slots: slots || [] });
    res.status(201).json({ success: true, data: { timetable } });
  } catch (err) { next(err); }
};

// PUT /api/timetable/:id/slots
const updateSlots = async (req, res, next) => {
  try {
    const { slots } = req.body;
    const timetable = await Timetable.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { slots },
      { new: true }
    );
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: { timetable } });
  } catch (err) { next(err); }
};

// POST /api/timetable/:id/optimize
const optimizeSchedule = async (req, res, next) => {
  try {
    const timetable = await Timetable.findOne({ _id: req.params.id, user: req.user._id });
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });

    const user = req.user;
    const schoolSlots = timetable.slots.filter((s) => s.type === 'school');
    const freeSlots = timetable.slots.filter((s) => s.type === 'rest' || !s.subject);

    const result = await optimizeTimetable({
      subjects: user.subjects || [],
      freeSlots,
      performanceData: user.subjects?.map((s) => ({ name: s.name, mastery: s.masteryScore })),
      educationLevel: user.educationLevel,
    });

    const aiSlots = result.schedule.map((s) => ({ ...s, aiGenerated: true }));
    timetable.slots = [...schoolSlots, ...aiSlots];
    timetable.aiOptimized = true;
    timetable.aiInsights = result.insights.map((msg) => ({ type: 'optimization', message: msg }));
    await timetable.save();

    res.json({ success: true, data: { timetable, insights: result.insights } });
  } catch (err) { next(err); }
};

// PATCH /api/timetable/slots/:slotId/complete
const markSlotComplete = async (req, res, next) => {
  try {
    const timetable = await Timetable.findOne({ user: req.user._id, isActive: true, 'slots._id': req.params.slotId });
    if (!timetable) return res.status(404).json({ success: false, message: 'Slot not found' });
    const slot = timetable.slots.id(req.params.slotId);
    slot.isCompleted = true;
    slot.completedAt = new Date();
    await timetable.save();
    res.json({ success: true, data: { slot } });
  } catch (err) { next(err); }
};

module.exports = { getTimetable, createTimetable, updateSlots, optimizeSchedule, markSlotComplete };
