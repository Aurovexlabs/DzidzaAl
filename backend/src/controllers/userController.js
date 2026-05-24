const User = require("../models/User");
const StudySession = require("../models/StudySession");

const SUPPORTED_LEVELS = new Set([
  "Primary School",
  "Secondary School",
  "ZJC",
  "O-Level",
  "A-Level",
  "College",
  "University",
  "Professional Certification",
  "Other",
]);

const SCHOOL_LEVELS = new Set([
  "Primary School",
  "Secondary School",
  "ZJC",
  "O-Level",
  "A-Level",
]);

const TERTIARY_LEVELS = new Set(["College", "University"]);

const CERT_LEVELS = new Set(["Professional Certification"]);

const normalizeList = (value) => [
  ...new Set(
    (Array.isArray(value) ? value : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  ),
];

const buildSubjectItems = (items, sourceType) =>
  normalizeList(items).map((name) => ({
    name,
    sourceType,
    isCustom: false,
  }));

const buildAcademicProfile = (existing, payload) => {
  const educationLevel = payload.educationLevel || existing?.track || "Other";
  const school = {
    ...(existing?.school || {}),
    ...(payload.schoolName !== undefined ? { name: payload.schoolName } : {}),
    ...(payload.country !== undefined ? { country: payload.country } : {}),
    ...(payload.curriculum !== undefined
      ? { curriculum: payload.curriculum }
      : {}),
    ...(payload.currentGradeFormYear !== undefined
      ? { currentGradeFormYear: payload.currentGradeFormYear }
      : {}),
  };
  const institution = {
    ...(existing?.institution || {}),
    ...(payload.institutionName !== undefined
      ? { name: payload.institutionName }
      : {}),
    ...(payload.country !== undefined ? { country: payload.country } : {}),
    ...(payload.facultySchool !== undefined
      ? { facultySchool: payload.facultySchool }
      : {}),
  };
  const program = {
    ...(existing?.program || {}),
    ...(payload.degreeProgram !== undefined
      ? { degreeProgram: payload.degreeProgram }
      : {}),
    ...(payload.major !== undefined ? { major: payload.major } : {}),
    ...(payload.specialization !== undefined
      ? { specialization: payload.specialization }
      : {}),
    ...(payload.yearOfStudy !== undefined
      ? { yearOfStudy: payload.yearOfStudy }
      : {}),
    ...(payload.semester !== undefined ? { semester: payload.semester } : {}),
  };
  const certification = {
    ...(existing?.certification || {}),
    ...(payload.certificationName !== undefined
      ? { name: payload.certificationName }
      : {}),
    ...(payload.certificationProvider !== undefined
      ? { provider: payload.certificationProvider }
      : {}),
    ...(payload.examLevel !== undefined
      ? { examLevel: payload.examLevel }
      : {}),
  };
  const curriculumMetadata = {
    ...(existing?.curriculumMetadata || {}),
    ...(payload.curriculumSystem !== undefined
      ? { system: payload.curriculumSystem }
      : {}),
    ...(payload.curriculumBoard !== undefined
      ? { board: payload.curriculumBoard }
      : {}),
    ...(payload.country !== undefined ? { region: payload.country } : {}),
  };
  const preferences = {
    ...(existing?.preferences || {}),
    ...(payload.preferredDifficulty
      ? { difficulty: payload.preferredDifficulty }
      : {}),
    ...(payload.tutoringStyle ? { tutoringStyle: payload.tutoringStyle } : {}),
    ...(payload.responseDepth ? { responseDepth: payload.responseDepth } : {}),
  };

  const academicInterests = normalizeList(
    payload.academicInterests ?? existing?.academicInterests,
  );
  const academicGoals = normalizeList(
    payload.academicGoals ?? existing?.academicGoals,
  );

  const schoolSubjects = buildSubjectItems(payload.subjects, "subject");
  const courseModules = buildSubjectItems(
    payload.courseModules || payload.modules,
    educationLevel === "Professional Certification"
      ? "certification_topic"
      : "module",
  );

  const selectedItems =
    schoolSubjects.length || courseModules.length
      ? [...schoolSubjects, ...courseModules]
      : existing?.selectedItems || [];

  return {
    track: educationLevel,
    school,
    institution,
    program,
    certification,
    curriculumMetadata,
    academicInterests,
    academicGoals,
    preferences,
    notes:
      payload.notes !== undefined
        ? String(payload.notes || "").trim()
        : existing?.notes,
    lastCompletedStep:
      payload.lastCompletedStep !== undefined
        ? String(payload.lastCompletedStep || "").trim()
        : existing?.lastCompletedStep,
    completedAt: payload.completed ? new Date() : existing?.completedAt,
    selectedItems,
  };
};

const validateAcademicOnboarding = (payload, { completed = false } = {}) => {
  const errors = [];
  const educationLevel = String(payload.educationLevel || "").trim();
  if (!SUPPORTED_LEVELS.has(educationLevel)) {
    errors.push({
      field: "educationLevel",
      message: "Select a valid education level",
    });
  }

  const subjects = normalizeList(payload.subjects);
  const courseModules = normalizeList(payload.courseModules || payload.modules);
  const academicInterests = normalizeList(payload.academicInterests);
  const academicGoals = normalizeList(payload.academicGoals);

  if (completed && !subjects.length && !courseModules.length) {
    errors.push({
      field: "subjects",
      message: "Add at least one subject or course/module",
    });
  }

  const requireText = (field, value, message) => {
    if (completed && !String(value || "").trim()) {
      errors.push({ field, message });
    }
  };

  if (SCHOOL_LEVELS.has(educationLevel)) {
    requireText("schoolName", payload.schoolName, "School name is required");
    requireText("country", payload.country, "Country is required");
    requireText(
      "curriculum",
      payload.curriculum,
      "Curriculum/system is required",
    );
    requireText(
      "currentGradeFormYear",
      payload.currentGradeFormYear,
      "Current grade/form/year is required",
    );
    if (completed && !subjects.length) {
      errors.push({
        field: "subjects",
        message: "Select at least one subject",
      });
    }
  } else if (TERTIARY_LEVELS.has(educationLevel)) {
    requireText(
      "institutionName",
      payload.institutionName,
      "Institution name is required",
    );
    requireText("country", payload.country, "Country is required");
    requireText(
      "facultySchool",
      payload.facultySchool,
      "Faculty/school is required",
    );
    requireText(
      "degreeProgram",
      payload.degreeProgram,
      "Degree program is required",
    );
    requireText(
      "yearOfStudy",
      payload.yearOfStudy,
      "Year of study is required",
    );
    requireText("semester", payload.semester, "Semester is required");
    if (completed && !courseModules.length) {
      errors.push({
        field: "courseModules",
        message: "Add at least one course/module",
      });
    }
  } else if (CERT_LEVELS.has(educationLevel)) {
    requireText(
      "certificationName",
      payload.certificationName,
      "Certification name is required",
    );
    requireText(
      "certificationProvider",
      payload.certificationProvider,
      "Certification provider is required",
    );
    requireText("examLevel", payload.examLevel, "Exam level is required");
    if (completed && !courseModules.length) {
      errors.push({
        field: "courseModules",
        message: "Add at least one module/topic",
      });
    }
  }

  if (completed && !academicInterests.length && !academicGoals.length) {
    errors.push({
      field: "academicInterests",
      message: "Add at least one academic interest or goal",
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    normalized: {
      educationLevel,
      subjects,
      courseModules,
      academicInterests,
      academicGoals,
    },
  };
};

// GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      "name",
      "educationLevel",
      "preferredLanguage",
      "timezone",
      "profilePicture",
    ];
    const updates = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, message: "Profile updated", data: { user } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/subjects
const updateSubjects = async (req, res, next) => {
  try {
    const { subjects } = req.body;
    if (!Array.isArray(subjects)) {
      return res
        .status(400)
        .json({ success: false, message: "subjects must be an array" });
    }

    const user = await User.findById(req.user._id);
    subjects.forEach(({ name, masteryScore }) => {
      const existing = user.subjects.find((s) => s.name === name);
      if (existing) {
        if (masteryScore !== undefined) existing.masteryScore = masteryScore;
      } else {
        user.subjects.push({ name, masteryScore: masteryScore || 0 });
      }
    });
    await user.save();
    res.json({
      success: true,
      message: "Subjects updated",
      data: { subjects: user.subjects },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/stats
const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sessions = await StudySession.find({
      user: userId,
      date: { $gte: thirtyDaysAgo },
    });

    const totalHours =
      sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
    const bySubject = sessions.reduce((acc, s) => {
      acc[s.subject] = (acc[s.subject] || 0) + s.durationMinutes;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        badges: user.badges,
        subjects: user.subjects,
        totalHoursThisMonth: Math.round(totalHours * 10) / 10,
        sessionsBySubject: bySubject,
        totalSessions: sessions.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/leaderboard  (top 10 by XP)
const getLeaderboard = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true, isEmailVerified: true })
      .select("name xp level streak educationLevel")
      .sort({ xp: -1 })
      .limit(10);

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      xp: u.xp,
      level: u.level,
      streak: u.streak.current,
      educationLevel: u.educationLevel,
    }));

    res.json({ success: true, data: { leaderboard } });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/academic-profile
const getAcademicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "educationLevel academicProfile onboardingCompleted subjects",
    );
    res.json({
      success: true,
      data: {
        academicProfile: user?.academicProfile || {},
        onboardingCompleted: !!user?.onboardingCompleted,
        educationLevel: user?.educationLevel,
        subjects: user?.subjects || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/academic-profile
const saveAcademicProfile = async (req, res, next) => {
  try {
    const completed = Boolean(req.body.completed);
    const validation = validateAcademicOnboarding(req.body, { completed });
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validation.errors,
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const mergedProfile = buildAcademicProfile(user.academicProfile || {}, {
      ...req.body,
      ...validation.normalized,
      completed,
    });

    user.educationLevel =
      validation.normalized.educationLevel || user.educationLevel;
    user.academicProfile = mergedProfile;
    if (mergedProfile.selectedItems && mergedProfile.selectedItems.length) {
      user.subjects = mergedProfile.selectedItems;
    }
    if (completed) {
      user.onboardingCompleted = true;
    }

    await user.save();

    res.json({
      success: true,
      message: completed ? "Onboarding completed" : "Onboarding draft saved",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users (soft delete)
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword } = req.body || {};
    if (!currentPassword) {
      return res
        .status(400)
        .json({ success: false, message: "currentPassword is required" });
    }

    const user = await User.findById(userId).select("+password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const ok = await user.comparePassword(currentPassword);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });

    // soft-delete: mark inactive and anonymize identifying fields
    await User.findByIdAndUpdate(userId, {
      isActive: false,
      email: `deleted+${userId}@dzidza.local`,
      name: "Deleted User",
      deletedAt: new Date(),
    });

    // remove sessions and refresh tokens if present
    try {
      const RefreshToken = require("../models/RefreshToken");
      await RefreshToken.deleteMany({ user: userId });
    } catch (e) {}
    try {
      await StudySession.deleteMany({ user: userId });
    } catch (e) {}

    res.json({ success: true, message: "Account deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateSubjects,
  getStats,
  getLeaderboard,
  getAcademicProfile,
  saveAcademicProfile,
  deleteAccount,
  validateAcademicOnboarding,
  buildAcademicProfile,
};
