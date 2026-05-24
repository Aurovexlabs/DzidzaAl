const OnboardingDraft = require("../models/OnboardingDraft");
const { validateAcademicOnboarding } = require("./userController");

const draftExpiryMs = 30 * 24 * 60 * 60 * 1000;

// POST /api/onboarding/drafts
const createDraft = async (req, res, next) => {
  try {
    const payload = req.body || {};
    // If completing the draft, validate payload strictly
    if (payload.completed) {
      const validation = validateAcademicOnboarding(payload, {
        completed: true,
      });
      if (!validation.ok) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validation.errors,
        });
      }
    }
    const draft = await OnboardingDraft.create({
      data: payload,
      completed: Boolean(payload.completed),
      ipAddress: req.ip,
      user: req.user ? req.user._id : undefined,
      expiresAt: new Date(Date.now() + draftExpiryMs),
    });
    res
      .status(201)
      .json({ success: true, data: { draftId: draft._id, draft } });
  } catch (err) {
    next(err);
  }
};

// GET /api/onboarding/drafts/:id
const getDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const draft = await OnboardingDraft.findById(id);
    if (!draft)
      return res
        .status(404)
        .json({ success: false, message: "Draft not found" });
    res.json({ success: true, data: { draft } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/onboarding/drafts/:id
const updateDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    if (payload.completed) {
      const validation = validateAcademicOnboarding(payload, {
        completed: true,
      });
      if (!validation.ok) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validation.errors,
        });
      }
    }
    const updated = await OnboardingDraft.findByIdAndUpdate(
      id,
      {
        data: payload,
        completed: Boolean(payload.completed),
        expiresAt: new Date(Date.now() + draftExpiryMs),
      },
      { new: true, upsert: true },
    );
    res.json({ success: true, data: { draft: updated } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/onboarding/drafts/:id
const deleteDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    await OnboardingDraft.findByIdAndDelete(id);
    res.json({ success: true, message: "Draft removed" });
  } catch (err) {
    next(err);
  }
};

module.exports = { createDraft, getDraft, updateDraft, deleteDraft };
