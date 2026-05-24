export interface User {
  _id: string;
  name: string;
  email: string;
  educationLevel:
    | "Primary School"
    | "Secondary School"
    | "ZJC"
    | "O-Level"
    | "A-Level"
    | "College"
    | "University"
    | "Professional Certification"
    | "Other";
  preferredLanguage: "english" | "shona" | "ndebele";
  subjects: Subject[];
  xp: number;
  level: number;
  streak: { current: number; longest: number; lastStudyDate?: string };
  badges: Badge[];
  isEmailVerified: boolean;
  onboardingCompleted?: boolean;
  academicProfile?: AcademicProfile;
  profilePicture?: string;
  createdAt: string;
}

export interface AcademicProfile {
  track?: User["educationLevel"];
  school?: {
    name?: string;
    country?: string;
    curriculum?: string;
    currentGradeFormYear?: string;
  };
  institution?: {
    name?: string;
    country?: string;
    facultySchool?: string;
  };
  program?: {
    degreeProgram?: string;
    major?: string;
    specialization?: string;
    yearOfStudy?: string;
    semester?: string;
  };
  certification?: {
    name?: string;
    provider?: string;
    examLevel?: string;
  };
  curriculumMetadata?: {
    system?: string;
    board?: string;
    region?: string;
  };
  academicInterests?: string[];
  academicGoals?: string[];
  preferences?: {
    difficulty?: "beginner" | "intermediate" | "advanced";
    tutoringStyle?: "guided" | "exam_focused" | "visual" | "practice_first";
    responseDepth?: "concise" | "balanced" | "detailed";
  };
  notes?: string;
  lastCompletedStep?: string;
  completedAt?: string;
}

export interface Subject {
  name: string;
  masteryScore: number;
  hoursStudied: number;
  lastStudied?: string;
}

export interface Badge {
  name: string;
  earnedAt: string;
  icon: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  language?: string;
  createdAt?: string;
}

export interface ChatSession {
  _id: string;
  title: string;
  subject?: string;
  language: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  _id: string;
  text: string;
  type: "multiple_choice" | "short_answer" | "true_false";
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  subject?: string;
  topic?: string;
}

export interface Quiz {
  _id: string;
  title: string;
  subject: string;
  topic?: string;
  educationLevel: string;
  questions: Question[];
  status: "pending" | "in_progress" | "completed";
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  currentDifficulty: "easy" | "medium" | "hard";
  createdAt: string;
  completedAt?: string;
}

export interface TimeSlot {
  _id?: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  type: "school" | "study" | "revision" | "rest" | "spaced_repetition";
  isCompleted: boolean;
  aiGenerated?: boolean;
  notes?: string;
}

export interface Timetable {
  _id: string;
  name: string;
  slots: TimeSlot[];
  aiOptimized: boolean;
  aiInsights: Array<{ type: string; message: string }>;
  createdAt: string;
}

export interface Flashcard {
  _id: string;
  front: string;
  back: string;
  subject?: string;
  topic?: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate?: string;
  aiGenerated: boolean;
}

export interface Document {
  _id: string;
  title: string;
  originalName: string;
  fileType: string;
  subject?: string;
  status: "uploading" | "processing" | "ready" | "error";
  summary?: string;
  flashcardsGenerated: number;
  fileSize: number;
  createdAt: string;
  downloadUrl?: string | null;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  isRead: boolean;
  createdAt: string;
}

export interface StudyPartner {
  _id: string;
  requester: User;
  recipient: User;
  status: "pending" | "accepted" | "declined";
  matchScore: number;
  sharedSubjects: string[];
}

export interface AnalyticsOverview {
  totalHoursThisMonth: number;
  avgQuizScore: number;
  flashcardsDue: number;
  streak: { current: number; longest: number };
  xp: number;
  level: number;
  weeklyHours: Array<{ day: string; hours: number }>;
  examReadiness: Array<{ subject: string; readiness: number; status: string }>;
  sessionCount: number;
  weekVsPrevWeek: { thisWeek: number; lastWeek: number; change: number };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

// ─── NEW FEATURE TYPES ────────────────────────────────────────────────────────

export interface ExamQuestion {
  _id: string;
  text: string;
  type: "mcq" | "short_answer" | "essay";
  options?: string[];
  correctAnswer?: string;
  marks: number;
  topic?: string;
  markingGuide?: string;
}

export interface ExamAnswer {
  questionId: string;
  questionText?: string;
  type: "mcq" | "short_answer" | "essay";
  userAnswer: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  score?: number;
  maxScore?: number;
  feedback?: string;
  timeTaken?: number;
}

export interface ExamSession {
  _id: string;
  title: string;
  subject: string;
  educationLevel?: string;
  year?: string;
  paper?: string;
  questions: ExamQuestion[];
  answers: ExamAnswer[];
  timeLimitMinutes: number;
  totalMarks: number;
  earnedMarks?: number;
  percentage?: number;
  grade?: string;
  status: "pending" | "in_progress" | "submitted" | "graded";
  aiFeedback?: string;
  weakTopics?: string[];
  strongTopics?: string[];
  xpEarned?: number;
  startedAt?: string;
  submittedAt?: string;
  createdAt: string;
}

export interface Milestone {
  _id: string;
  title: string;
  description: string;
  topic: string;
  subject: string;
  estimatedHours: number;
  resources: Array<{ type: string; description: string; url?: string }>;
  prerequisites: string[];
  isCompleted: boolean;
  completedAt?: string;
  masteryRequired: number;
  order: number;
}

export interface LearningPath {
  _id: string;
  subject: string;
  title: string;
  description: string;
  educationLevel?: string;
  targetExamDate?: string;
  currentMilestoneIndex: number;
  milestones: Milestone[];
  totalEstimatedHours: number;
  completionPercentage: number;
  isActive: boolean;
  createdAt: string;
}

export interface FocusSession {
  _id: string;
  subject?: string;
  topic?: string;
  goal?: string;
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  pomodorosCompleted: number;
  totalFocusMinutes: number;
  distractionCount: number;
  focusScore: number;
  status: "active" | "break" | "completed" | "abandoned";
  startedAt: string;
  endedAt?: string;
  accomplishments?: string;
  rating?: number;
  xpEarned?: number;
}

export interface EssayGradeCriteria {
  name: string;
  maxMarks: number;
  earnedMarks: number;
  feedback: string;
}

export interface EssayGrade {
  _id: string;
  subject?: string;
  question: string;
  userAnswer: string;
  maxMarks: number;
  earnedMarks: number;
  percentage: number;
  grade: string;
  criteria: EssayGradeCriteria[];
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  modelAnswer?: string;
  wordCount: number;
  createdAt: string;
}
