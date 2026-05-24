const express = require("express");
const router = express.Router();

const { body, param } = require("express-validator");
const validate = require("../middleware/validate");
const validateSchema = require("../middleware/validateSchema");
const { authenticate } = require("../middleware/auth");
const {
  authLimiter,
  otpLimiter,
  aiLimiter,
} = require("../middleware/rateLimiter");
const {
  documentUploadInitSchema,
  documentUploadCompleteSchema,
} = require("../validation/documentSchemas");
const { onboardingDraftSchema } = require("../validation/onboardingSchemas");
const {
  signupSchema,
  loginSchema,
  otpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require("../validation/authSchemas");

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const auth = require("../controllers/authController");
const authRouter = express.Router();

authRouter.post(
  "/signup",
  authLimiter,
  validateSchema(signupSchema),
  auth.signup,
);
authRouter.post(
  "/verify-email",
  otpLimiter,
  validateSchema(otpSchema),
  auth.verifyEmail,
);
authRouter.post(
  "/resend-otp",
  otpLimiter,
  validateSchema(resendOtpSchema),
  auth.resendOTP,
);
authRouter.post("/login", authLimiter, validateSchema(loginSchema), auth.login);
authRouter.post("/refresh", auth.refreshToken);
authRouter.post("/logout", authenticate, auth.logout);
authRouter.post(
  "/forgot-password",
  otpLimiter,
  validateSchema(forgotPasswordSchema),
  auth.forgotPassword,
);
authRouter.post(
  "/reset-password",
  validateSchema(resetPasswordSchema),
  auth.resetPassword,
);
authRouter.post(
  "/change-password",
  authenticate,
  validateSchema(changePasswordSchema),
  auth.changePassword,
);
authRouter.get("/me", authenticate, auth.getMe);

router.use("/auth", authRouter);

// ─── USERS ────────────────────────────────────────────────────────────────────
const users = require("../controllers/userController");
const usersRouter = express.Router();
usersRouter.use(authenticate);

usersRouter.get("/profile", users.getProfile);
usersRouter.put("/profile", users.updateProfile);
usersRouter.put("/subjects", users.updateSubjects);
usersRouter.get("/stats", users.getStats);
usersRouter.get("/leaderboard", users.getLeaderboard);
usersRouter.get("/academic-profile", users.getAcademicProfile);
usersRouter.put("/academic-profile", users.saveAcademicProfile);
usersRouter.delete("/", users.deleteAccount);

router.use("/users", usersRouter);

// ─── ONBOARDING (anonymous drafts) ───────────────────────────────────────────
const onboarding = require("../controllers/onboardingController");
const onboardingRouter = express.Router();

onboardingRouter.post(
  "/drafts",
  authLimiter,
  validateSchema(onboardingDraftSchema),
  onboarding.createDraft,
);
onboardingRouter.get("/drafts/:id", onboarding.getDraft);
onboardingRouter.put(
  "/drafts/:id",
  authLimiter,
  validateSchema(onboardingDraftSchema),
  onboarding.updateDraft,
);
onboardingRouter.delete("/drafts/:id", authLimiter, onboarding.deleteDraft);

router.use("/onboarding", onboardingRouter);

// ─── CHAT ─────────────────────────────────────────────────────────────────────
const chat = require("../controllers/chatController");
const chatRouter = express.Router();
chatRouter.use(authenticate);

chatRouter.post("/sessions", chat.createSession);
chatRouter.get("/sessions", chat.getSessions);
chatRouter.get("/sessions/:id", chat.getSession);
chatRouter.post(
  "/sessions/:id/message",
  aiLimiter,
  body("content").trim().isLength({ min: 1, max: 4000 }),
  chat.sendMessage,
);
chatRouter.delete("/sessions/:id", chat.deleteSession);

router.use("/chat", chatRouter);

// ─── QUIZZES ──────────────────────────────────────────────────────────────────
const quiz = require("../controllers/quizController");
const quizRouter = express.Router();
quizRouter.use(authenticate);

quizRouter.post(
  "/generate",
  aiLimiter,
  body("subject").trim().notEmpty(),
  body("count").optional().isInt({ min: 1, max: 20 }),
  body("difficulty").optional().isIn(["easy", "medium", "hard"]),
  quiz.generateNewQuiz,
);
quizRouter.get("/", quiz.getQuizzes);
quizRouter.get("/:id", quiz.getQuiz);
quizRouter.post("/:id/start", quiz.startQuiz);
quizRouter.post("/:id/submit", quiz.submitQuiz);
quizRouter.delete("/:id", quiz.deleteQuiz);

router.use("/quizzes", quizRouter);

// ─── TIMETABLE ────────────────────────────────────────────────────────────────
const timetable = require("../controllers/timetableController");
const ttRouter = express.Router();
ttRouter.use(authenticate);

ttRouter.get("/", timetable.getTimetable);
ttRouter.post("/", timetable.createTimetable);
ttRouter.put("/:id/slots", timetable.updateSlots);
ttRouter.post("/:id/optimize", aiLimiter, timetable.optimizeSchedule);
ttRouter.patch("/slots/:slotId/complete", timetable.markSlotComplete);

router.use("/timetable", ttRouter);

// ─── FLASHCARDS ───────────────────────────────────────────────────────────────
const flashcards = require("../controllers/flashcardController");
const fcRouter = express.Router();
fcRouter.use(authenticate);

fcRouter.get("/", flashcards.getFlashcards);
fcRouter.get("/due", flashcards.getDueFlashcards);
fcRouter.get("/stats", flashcards.getFlashcardStats);
fcRouter.post("/", flashcards.createFlashcard);
fcRouter.post(
  "/:id/review",
  body("quality").isInt({ min: 0, max: 5 }),
  flashcards.reviewFlashcard,
);
fcRouter.delete("/:id", flashcards.deleteFlashcard);

router.use("/flashcards", fcRouter);

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
const analytics = require("../controllers/analyticsController");
const analyticsRouter = express.Router();
analyticsRouter.use(authenticate);

analyticsRouter.get("/overview", analytics.getOverview);
analyticsRouter.get("/subject/:subject", analytics.getSubjectAnalytics);
analyticsRouter.get("/coach-message", aiLimiter, analytics.getCoachMessage);
analyticsRouter.get("/education", analytics.getEducationAnalytics);
analyticsRouter.post("/study-session", analytics.logStudySession);

router.use("/analytics", analyticsRouter);

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
const docs = require("../controllers/documentController");
const docsRouter = express.Router();
docsRouter.use(authenticate);

docsRouter.post(
  "/upload-init",
  validateSchema(documentUploadInitSchema),
  docs.initializeDocumentUpload,
);
docsRouter.post(
  "/upload-complete",
  validateSchema(documentUploadCompleteSchema),
  docs.completeDocumentUpload,
);
docsRouter.post("/upload", docs.upload.single("file"), docs.uploadDocument);
docsRouter.get("/", docs.getDocuments);
docsRouter.get("/:id/download-url", docs.getDocumentDownloadUrl);
docsRouter.get("/:id", docs.getDocument);
docsRouter.delete("/:id", docs.deleteDocument);
docsRouter.post("/:id/ask", aiLimiter, docs.askDocument);

router.use("/documents", docsRouter);

// ─── PARTNERS ─────────────────────────────────────────────────────────────────
const partners = require("../controllers/partnerController");
const partnersRouter = express.Router();
partnersRouter.use(authenticate);

partnersRouter.get("/suggestions", partners.getSuggestions);
partnersRouter.get("/requests", partners.getRequests);
partnersRouter.get("/", partners.getPartners);
partnersRouter.post("/request/:userId", partners.sendRequest);
partnersRouter.put("/:id/respond", partners.respondToRequest);
partnersRouter.get("/groups", partners.getGroups);
partnersRouter.get("/groups/discover", partners.discoverGroups);
partnersRouter.post("/groups", partners.createGroup);
partnersRouter.post("/groups/:id/join", partners.joinGroup);

router.use("/partners", partnersRouter);

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
const notifications = require("../controllers/notificationController");
const notifRouter = express.Router();
notifRouter.use(authenticate);

notifRouter.get("/", notifications.getNotifications);
notifRouter.patch("/:id/read", notifications.markRead);
notifRouter.patch("/read-all", notifications.markAllRead);
notifRouter.delete("/:id", notifications.deleteNotification);

router.use("/notifications", notifRouter);

// ─── EXAM SIMULATOR ───────────────────────────────────────────────────────────
const exam = require("../controllers/examController");
const examRouter = express.Router();
examRouter.use(authenticate);

examRouter.post(
  "/generate",
  aiLimiter,
  body("subject").trim().notEmpty(),
  exam.generate,
);
examRouter.get("/", exam.getAll);
examRouter.get("/:id", exam.getOne);
examRouter.post("/:id/start", exam.start);
examRouter.post("/:id/save-progress", exam.saveProgress);
examRouter.post("/:id/submit", exam.submit);
examRouter.delete("/:id", exam.remove);

router.use("/exams", examRouter);

// ─── LEARNING PATH ────────────────────────────────────────────────────────────
const lp = require("../controllers/learningPathController");
const lpRouter = express.Router();
lpRouter.use(authenticate);

lpRouter.post(
  "/generate",
  aiLimiter,
  body("subject").trim().notEmpty(),
  lp.generate,
);
lpRouter.get("/", lp.getAll);
lpRouter.get("/:id", lp.getOne);
lpRouter.patch(
  "/:pathId/milestones/:milestoneId/complete",
  lp.completeMilestone,
);
lpRouter.delete("/:id", lp.remove);

router.use("/learning-path", lpRouter);

// ─── FOCUS / POMODORO ─────────────────────────────────────────────────────────
const focus = require("../controllers/focusController");
const focusRouter = express.Router();
focusRouter.use(authenticate);

focusRouter.post("/start", focus.startSession);
focusRouter.patch("/:id/pomodoro-complete", focus.completePomodoro);
focusRouter.patch("/:id/break-complete", focus.completeBreak);
focusRouter.patch("/:id/distraction", focus.logDistraction);
focusRouter.post("/:id/complete", focus.completeSession);
focusRouter.get("/history", focus.getHistory);

router.use("/focus", focusRouter);

// ─── ESSAY GRADER ─────────────────────────────────────────────────────────────
const essay = require("../controllers/essayController");
const essayRouter = express.Router();
essayRouter.use(authenticate);

essayRouter.post(
  "/grade",
  aiLimiter,
  body("question").trim().notEmpty(),
  body("answer").trim().isLength({ min: 20 }),
  essay.grade,
);
essayRouter.get("/", essay.getAll);
essayRouter.get("/:id", essay.getOne);
essayRouter.delete("/:id", essay.remove);

router.use("/essays", essayRouter);

// ─── VOICE ────────────────────────────────────────────────────────────────────
const voice = require("../controllers/voiceController");
const voiceRouter = express.Router();
voiceRouter.use(authenticate);
voiceRouter.post(
  "/process",
  aiLimiter,
  body("transcript").trim().notEmpty(),
  voice.process,
);

router.use("/voice", voiceRouter);

// ─── AI FEATURES (knowledge gaps, explain, practice, notes) ────────────────
const aiCtrl = require("../controllers/aiController");
const aiRouter = express.Router();

// Protected AI feature routes
aiRouter.get("/knowledge-gaps", authenticate, aiCtrl.knowledgeGaps);
aiRouter.post(
  "/explain",
  authenticate,
  aiLimiter,
  body("concept").trim().notEmpty(),
  aiCtrl.explain,
);
aiRouter.post(
  "/practice-problems",
  authenticate,
  aiLimiter,
  body("topic").trim().notEmpty(),
  body("subject").trim().notEmpty(),
  aiCtrl.practiceProblems,
);
aiRouter.post(
  "/study-notes",
  authenticate,
  aiLimiter,
  body("topic").trim().notEmpty(),
  body("subject").trim().notEmpty(),
  aiCtrl.studyNotes,
);

router.use("/ai", aiRouter);

module.exports = router;
