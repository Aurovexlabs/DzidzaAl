import type {
  AnalyticsOverview,
  ApiResponse,
  ChatSession,
  Document,
  Flashcard,
  Quiz,
  Timetable,
  User,
} from "../types";
import api from "./api";

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data: {
    name: string;
    email: string;
    password: string;
    educationLevel: string;
    draftId?: string;
  }) =>
    api.post<ApiResponse<{ email: string; name: string }>>(
      "/auth/signup",
      data,
    ),

  verifyEmail: (data: { email: string; otp: string }) =>
    api.post<ApiResponse<{ user: User; accessToken: string }>>(
      "/auth/verify-email",
      data,
    ),

  resendOTP: (email: string, type = "email_verification") =>
    api.post("/auth/resend-otp", { email, type }),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; accessToken: string }>>(
      "/auth/login",
      data,
    ),

  logout: () => api.post("/auth/logout"),

  refresh: () =>
    api.post<ApiResponse<{ user: User; accessToken: string }>>(
      "/auth/refresh",
      {},
    ),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post("/auth/reset-password", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),

  getMe: () => api.get<ApiResponse<{ user: User }>>("/auth/me"),
};

// ─── USERS ────────────────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => api.get<ApiResponse<{ user: User }>>("/users/profile"),

  getAcademicProfile: () =>
    api.get<
      ApiResponse<{
        academicProfile: User["academicProfile"];
        onboardingCompleted: boolean;
        educationLevel: User["educationLevel"];
        subjects: User["subjects"];
      }>
    >("/users/academic-profile"),

  saveAcademicProfile: (data: Record<string, unknown>) =>
    api.put<ApiResponse<{ user: User }>>("/users/academic-profile", data),

  updateProfile: (data: Partial<User>) =>
    api.put<ApiResponse<{ user: User }>>("/users/profile", data),

  deleteAccount: (currentPassword?: string) =>
    api.delete("/users", { data: { currentPassword } }),

  updateSubjects: (subjects: Array<{ name: string; masteryScore?: number }>) =>
    api.put("/users/subjects", { subjects }),

  getStats: () => api.get("/users/stats"),

  getLeaderboard: () => api.get("/users/leaderboard"),
};

// ─── ONBOARDING / DRAFTS (anonymous-friendly) ───────────────────────────────
export const onboardingApi = {
  createDraft: (data: Record<string, unknown>) =>
    api.post<ApiResponse<{ draftId: string; draft: any }>>(
      "/onboarding/drafts",
      data,
    ),
  getDraft: (id: string) => api.get(`/onboarding/drafts/${id}`),
  updateDraft: (id: string, data: Record<string, unknown>) =>
    api.put(`/onboarding/drafts/${id}`, data),
  deleteDraft: (id: string) => api.delete(`/onboarding/drafts/${id}`),
};

// ─── CHAT ─────────────────────────────────────────────────────────────────────
export const chatApi = {
  createSession: (data: {
    subject?: string;
    language?: string;
    title?: string;
  }) => api.post<ApiResponse<{ session: ChatSession }>>("/chat/sessions", data),

  getSessions: () =>
    api.get<ApiResponse<{ sessions: ChatSession[] }>>("/chat/sessions"),

  getSession: (id: string) =>
    api.get<ApiResponse<{ session: ChatSession }>>(`/chat/sessions/${id}`),

  sendMessage: (sessionId: string, content: string, language?: string) =>
    api.post<ApiResponse<{ message: { role: string; content: string } }>>(
      `/chat/sessions/${sessionId}/message`,
      { content, language },
    ),

  deleteSession: (id: string) => api.delete(`/chat/sessions/${id}`),
};

// ─── QUIZZES ──────────────────────────────────────────────────────────────────
export const quizApi = {
  generate: (data: {
    subject: string;
    topic?: string;
    difficulty?: string;
    count?: number;
  }) => api.post<ApiResponse<{ quiz: Quiz }>>("/quizzes/generate", data),

  getAll: (params?: { subject?: string; status?: string; page?: number }) =>
    api.get<ApiResponse<{ quizzes: Quiz[]; total: number }>>("/quizzes", {
      params,
    }),

  getOne: (id: string) =>
    api.get<ApiResponse<{ quiz: Quiz }>>(`/quizzes/${id}`),

  start: (id: string) =>
    api.post<ApiResponse<{ quiz: Quiz }>>(`/quizzes/${id}/start`),

  submit: (
    id: string,
    answers: Array<{
      questionId: string;
      selectedAnswer: string;
      timeTaken?: number;
    }>,
  ) => api.post(`/quizzes/${id}/submit`, { answers }),

  delete: (id: string) => api.delete(`/quizzes/${id}`),
};

// ─── TIMETABLE ────────────────────────────────────────────────────────────────
export const timetableApi = {
  get: () => api.get<ApiResponse<{ timetable: Timetable }>>("/timetable"),

  create: (data: { name?: string; slots?: any[] }) =>
    api.post<ApiResponse<{ timetable: Timetable }>>("/timetable", data),

  updateSlots: (id: string, slots: any[]) =>
    api.put(`/timetable/${id}/slots`, { slots }),

  optimize: (id: string) =>
    api.post<ApiResponse<{ timetable: Timetable; insights: string[] }>>(
      `/timetable/${id}/optimize`,
    ),

  markSlotComplete: (slotId: string) =>
    api.patch(`/timetable/slots/${slotId}/complete`),
};

// ─── FLASHCARDS ───────────────────────────────────────────────────────────────
export const flashcardApi = {
  getAll: (params?: { subject?: string; dueOnly?: boolean }) =>
    api.get<ApiResponse<{ flashcards: Flashcard[] }>>("/flashcards", {
      params,
    }),

  getDue: () =>
    api.get<ApiResponse<{ flashcards: Flashcard[]; count: number }>>(
      "/flashcards/due",
    ),

  getStats: () => api.get("/flashcards/stats"),

  create: (data: {
    front: string;
    back: string;
    subject?: string;
    topic?: string;
  }) => api.post("/flashcards", data),

  review: (id: string, quality: number) =>
    api.post(`/flashcards/${id}/review`, { quality }),

  delete: (id: string) => api.delete(`/flashcards/${id}`),
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getOverview: () =>
    api.get<ApiResponse<AnalyticsOverview>>("/analytics/overview"),

  getSubject: (subject: string) =>
    api.get(`/analytics/subject/${encodeURIComponent(subject)}`),

  getEducation: () => api.get("/analytics/education"),

  getCoachMessage: () =>
    api.get<ApiResponse<{ message: string }>>("/analytics/coach-message"),

  logSession: (data: {
    subject: string;
    durationMinutes: number;
    type?: string;
    topic?: string;
    notes?: string;
  }) => api.post("/analytics/study-session", data),
};

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
export const documentApi = {
  initUpload: (data: {
    title: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    subject?: string;
    contentType?: string;
  }) =>
    api.post<
      ApiResponse<{ document: Document; uploadUrl: string; storageKey: string }>
    >("/documents/upload-init", data),

  completeUpload: (data: { documentId: string }) =>
    api.post<ApiResponse<{ document: Document; jobId: string | null }>>(
      "/documents/upload-complete",
      data,
    ),

  upload: (formData: FormData) =>
    api.post<ApiResponse<{ document: Document }>>(
      "/documents/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    ),

  getAll: () => api.get<ApiResponse<{ documents: Document[] }>>("/documents"),

  getOne: (id: string) => api.get(`/documents/${id}`),

  getDownloadUrl: (id: string) =>
    api.get<ApiResponse<{ downloadUrl: string | null }>>(
      `/documents/${id}/download-url`,
    ),

  delete: (id: string) => api.delete(`/documents/${id}`),

  ask: (id: string, question: string) =>
    api.post<ApiResponse<{ answer: string }>>(`/documents/${id}/ask`, {
      question,
    }),
};

// ─── PARTNERS ─────────────────────────────────────────────────────────────────
export const partnerApi = {
  getSuggestions: () => api.get("/partners/suggestions"),

  getRequests: () => api.get("/partners/requests"),

  getPartners: () => api.get("/partners"),

  sendRequest: (userId: string) => api.post(`/partners/request/${userId}`),

  respond: (id: string, action: "accepted" | "declined") =>
    api.put(`/partners/${id}/respond`, { action }),

  getGroups: () => api.get("/partners/groups"),

  discoverGroups: () => api.get("/partners/groups/discover"),

  createGroup: (data: {
    name: string;
    subject?: string;
    description?: string;
  }) => api.post("/partners/groups", data),

  joinGroup: (id: string) => api.post(`/partners/groups/${id}/join`),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notificationApi = {
  getAll: (params?: { unreadOnly?: boolean; page?: number }) =>
    api.get("/notifications", { params }),

  markRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllRead: () => api.patch("/notifications/read-all"),

  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// ─── EXAM SIMULATOR ───────────────────────────────────────────────────────────
export const examApi = {
  generate: (data: {
    subject: string;
    year?: string;
    paper?: string;
    questionTypes?: string[];
    totalMarks?: number;
  }) => api.post("/exams/generate", data),

  getAll: (params?: { subject?: string; status?: string; page?: number }) =>
    api.get("/exams", { params }),

  getOne: (id: string) => api.get(`/exams/${id}`),

  start: (id: string) => api.post(`/exams/${id}/start`),

  saveProgress: (
    id: string,
    data: { answers: any[]; timeRemainingSeconds: number },
  ) => api.post(`/exams/${id}/save-progress`, data),

  submit: (id: string, answers: any[]) =>
    api.post(`/exams/${id}/submit`, { answers }),

  delete: (id: string) => api.delete(`/exams/${id}`),
};

// ─── LEARNING PATH ────────────────────────────────────────────────────────────
export const learningPathApi = {
  generate: (data: {
    subject: string;
    targetExamDate?: string;
    hoursPerDay?: number;
  }) => api.post("/learning-path/generate", data),

  getAll: () => api.get("/learning-path"),

  getOne: (id: string) => api.get(`/learning-path/${id}`),

  completeMilestone: (pathId: string, milestoneId: string) =>
    api.patch(`/learning-path/${pathId}/milestones/${milestoneId}/complete`),

  delete: (id: string) => api.delete(`/learning-path/${id}`),
};

// ─── FOCUS / POMODORO ─────────────────────────────────────────────────────────
export const focusApi = {
  start: (data: {
    subject?: string;
    topic?: string;
    goal?: string;
    workMinutes?: number;
    breakMinutes?: number;
  }) => api.post("/focus/start", data),

  pomodoroComplete: (id: string, workMinutes: number) =>
    api.patch(`/focus/${id}/pomodoro-complete`, { workMinutes }),

  breakComplete: (id: string) => api.patch(`/focus/${id}/break-complete`),

  logDistraction: (id: string) => api.patch(`/focus/${id}/distraction`),

  complete: (
    id: string,
    data: {
      accomplishments?: string;
      obstacles?: string;
      rating?: number;
      abandoned?: boolean;
    },
  ) => api.post(`/focus/${id}/complete`, data),

  getHistory: (params?: { page?: number }) =>
    api.get("/focus/history", { params }),
};

// ─── ESSAY GRADER ─────────────────────────────────────────────────────────────
export const essayApi = {
  grade: (data: {
    question: string;
    answer: string;
    subject?: string;
    maxMarks?: number;
  }) => api.post("/essays/grade", data),

  getAll: (params?: { subject?: string; page?: number }) =>
    api.get("/essays", { params }),

  getOne: (id: string) => api.get(`/essays/${id}`),

  delete: (id: string) => api.delete(`/essays/${id}`),
};

// ─── VOICE ────────────────────────────────────────────────────────────────────
export const voiceApi = {
  process: (data: {
    transcript: string;
    sessionId?: string;
    subject?: string;
    language?: string;
  }) => api.post("/voice/process", data),
};

// ─── AI FEATURES ──────────────────────────────────────────────────────────────
export const aiApi = {
  knowledgeGaps: (subject?: string) =>
    api.get("/ai/knowledge-gaps", { params: subject ? { subject } : {} }),

  explain: (data: {
    concept: string;
    subject?: string;
    style?: "standard" | "eli5" | "exam" | "visual";
    language?: string;
  }) => api.post("/ai/explain", data),

  practiceProblems: (data: {
    topic: string;
    subject: string;
    count?: number;
    includeWorkedSolution?: boolean;
  }) => api.post("/ai/practice-problems", data),

  studyNotes: (data: { topic: string; subject: string; language?: string }) =>
    api.post("/ai/study-notes", data),
};
