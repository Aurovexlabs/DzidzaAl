const User = require("../models/User");
const { StudyPartner, StudyGroup } = require("../models/StudyPartner");
const Notification = require("../models/Notification");
const { computeMatchScore } = require("../services/aiService");
const notificationService = require("../services/notificationService");

// GET /api/partners/suggestions
const getSuggestions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const existing = await StudyPartner.find({
      $or: [{ requester: user._id }, { recipient: user._id }],
    }).select("requester recipient");
    const excludeIds = new Set([
      user._id.toString(),
      ...existing.map((p) => p.requester.toString()),
      ...existing.map((p) => p.recipient.toString()),
    ]);

    const candidates = await User.find({
      _id: { $nin: [...excludeIds] },
      isActive: true,
      isEmailVerified: true,
      educationLevel: user.educationLevel,
    })
      .select("name subjects educationLevel streak")
      .limit(50);

    const matches = candidates
      .map((c) => {
        const { score, sharedSubjects } = computeMatchScore(user, c);
        return { user: c, score, sharedSubjects };
      })
      .filter((m) => m.score > 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json({ success: true, data: { suggestions: matches } });
  } catch (err) {
    next(err);
  }
};

// POST /api/partners/request/:userId
const sendRequest = async (req, res, next) => {
  try {
    const recipient = await User.findById(req.params.userId);
    if (!recipient)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const existing = await StudyPartner.findOne({
      $or: [
        { requester: req.user._id, recipient: recipient._id },
        { requester: recipient._id, recipient: req.user._id },
      ],
    });
    if (existing)
      return res
        .status(409)
        .json({ success: false, message: "Request already exists" });

    const requesterUser = await User.findById(req.user._id);
    const { score, sharedSubjects } = computeMatchScore(
      requesterUser,
      recipient,
    );

    const partner = await StudyPartner.create({
      requester: req.user._id,
      recipient: recipient._id,
      matchScore: score,
      sharedSubjects,
    });

    await notificationService.sendPartnerMatch(
      recipient._id,
      req.user.name,
      score,
    );

    res.status(201).json({ success: true, data: { partner } });
  } catch (err) {
    next(err);
  }
};

// GET /api/partners/requests
const getRequests = async (req, res, next) => {
  try {
    const requests = await StudyPartner.find({
      recipient: req.user._id,
      status: "pending",
    })
      .populate("requester", "name educationLevel subjects streak")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { requests } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/partners/:id/respond
const respondToRequest = async (req, res, next) => {
  try {
    const { action } = req.body;
    if (!["accepted", "declined"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action must be accepted or declined",
      });
    }

    const partner = await StudyPartner.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id, status: "pending" },
      { status: action },
      { new: true },
    );
    if (!partner)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    if (action === "accepted") {
      await notificationService
        .sendPartnerAccepted(partner.requester, req.user.name)
        .catch(() => {});
    }

    res.json({ success: true, data: { partner } });
  } catch (err) {
    next(err);
  }
};

// GET /api/partners
const getPartners = async (req, res, next) => {
  try {
    const partners = await StudyPartner.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: "accepted",
    }).populate("requester recipient", "name educationLevel subjects streak");
    res.json({ success: true, data: { partners } });
  } catch (err) {
    next(err);
  }
};

// POST /api/partners/groups
const createGroup = async (req, res, next) => {
  try {
    const { name, subject, description } = req.body;
    const group = await StudyGroup.create({
      name,
      subject,
      description,
      admin: req.user._id,
      members: [req.user._id],
    });
    res.status(201).json({ success: true, data: { group } });
  } catch (err) {
    next(err);
  }
};

// GET /api/partners/groups
const getGroups = async (req, res, next) => {
  try {
    const groups = await StudyGroup.find({
      members: req.user._id,
      isActive: true,
    })
      .populate("members", "name")
      .populate("admin", "name");
    res.json({ success: true, data: { groups } });
  } catch (err) {
    next(err);
  }
};

// GET /api/partners/groups/discover
const discoverGroups = async (req, res, next) => {
  try {
    const groups = await StudyGroup.find({
      isActive: true,
      members: { $ne: req.user._id },
    })
      .populate("admin", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { groups } });
  } catch (err) {
    next(err);
  }
};

// POST /api/partners/groups/:id/join
const joinGroup = async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    if (group.members.includes(req.user._id)) {
      return res
        .status(409)
        .json({ success: false, message: "Already a member" });
    }
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ success: false, message: "Group is full" });
    }
    group.members.push(req.user._id);
    await group.save();
    res.json({ success: true, data: { group } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSuggestions,
  sendRequest,
  getRequests,
  respondToRequest,
  getPartners,
  createGroup,
  getGroups,
  discoverGroups,
  joinGroup,
};
