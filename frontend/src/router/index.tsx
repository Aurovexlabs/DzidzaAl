import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import React from "react";
import { AppLayout } from "../components/Layout";
import { AIToolsPage, KnowledgeGapsPage } from "../pages/AIToolsPages";
import {
  ForgotPasswordPage,
  LoginPage,
  SignupPage,
  VerifyEmailPage,
} from "../pages/AuthPages";
import { DashboardPage } from "../pages/DashboardPage";
import {
  CodeSandboxPage,
  EssayGraderPage,
  ExamSimulatorPage,
  FocusModePage,
  LearningPathPage,
  PastPapersPage,
  VoiceTutorPage,
  WhiteboardPage,
} from "../pages/NewFeaturePages";
import { OnboardingPage } from "../pages/OnboardingPage";
import {
  AnalyticsPage,
  DocumentsPage,
  FlashcardsPage,
  PartnersPage,
  SettingsPage,
  TimetablePage,
} from "../pages/OtherPages";
import {
  AboutPage,
  BlogPage,
  ContactPage,
  FeaturesPage,
  LandingPage,
  PricingPage,
  PrivacyPage,
  TermsPage,
} from "../pages/PublicPages";
import { QuizPage } from "../pages/QuizPage";
import {
  AdminPanelPage,
  NotificationsPage,
  ProfilePage,
  SearchPage,
} from "../pages/SystemPages";
import { TutorPage } from "../pages/TutorPage";
import type { AuthStore } from "../store/authStore";

// ─── Router context ───────────────────────────────────────────────────────────
export interface RouterContext {
  auth: Pick<AuthStore, "isAuthenticated" | "user">;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <div
      style={{
        padding: 60,
        textAlign: "center",
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}
      >
        <SearchX size={48} strokeWidth={1.8} />
      </div>
      <h2
        style={{
          fontFamily: "'Lora',serif",
          color: "var(--ink)",
          marginBottom: 8,
          fontSize: 22,
        }}
      >
        Page not found
      </h2>
      <p style={{ color: "var(--ink3)", marginBottom: 20, fontSize: 14 }}>
        This page doesn't exist.
      </p>
      <a href="/dashboard" style={{ color: "var(--accent)", fontSize: 14 }}>
        ← Go to dashboard
      </a>
    </div>
  ),
});

export const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: context.auth.user?.onboardingCompleted
          ? "/dashboard"
          : "/onboarding",
      });
    }
  },
  component: LandingPage,
});

export const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

export const featuresRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features",
  component: FeaturesPage,
});

export const pricingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pricing",
  component: PricingPage,
});

export const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contact",
  component: ContactPage,
});

export const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchPage,
});

export const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog",
  component: BlogPage,
});

export const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPage,
});

export const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: TermsPage,
});

export const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: NotificationsPage,
});

export const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

// ─── Auth routes (guest only) ─────────────────────────────────────────────────
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: (s.redirect as string) ?? "",
  }),
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) throw redirect({ to: "/dashboard" });
  },
  component: LoginPage,
});

export const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) throw redirect({ to: "/dashboard" });
    try {
      const meta = window.localStorage.getItem("dzidzaai:onboarding:draftMeta");
      if (!meta) throw redirect({ to: "/onboarding" });
      const parsed = JSON.parse(meta);
      if (!parsed?.completed) throw redirect({ to: "/onboarding" });
    } catch (e) {
      // redirect to onboarding if no completed draft
      throw redirect({ to: "/onboarding" });
    }
  },
  component: SignupPage,
});

export const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-email",
  validateSearch: (s: Record<string, unknown>) => ({
    email: (s.email as string) ?? "",
  }),
  component: VerifyEmailPage,
});

export const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  beforeLoad: ({ context }) => {
    // allow both anonymous and authenticated users
    if (context.auth.isAuthenticated && context.auth.user?.onboardingCompleted)
      throw redirect({ to: "/dashboard" });
  },
  component: OnboardingPage,
});

export const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
});

// ─── App layout (auth guard) ──────────────────────────────────────────────────
export const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_app",
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (!context.auth.user?.onboardingCompleted) {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: AppLayout,
});

// ─── Route factory ────────────────────────────────────────────────────────────
const mkRoute = (path: string, component: React.ComponentType<any>) =>
  createRoute({
    getParentRoute: () => appLayoutRoute,
    path,
    component: component as any,
  });

// ─── Core pages ───────────────────────────────────────────────────────────────
export const dashboardRoute = mkRoute("/dashboard", DashboardPage);
export const tutorRoute = mkRoute("/tutor", TutorPage);
export const quizRoute = mkRoute("/quiz", QuizPage);
export const timetableRoute = mkRoute("/timetable", TimetablePage);
export const flashcardsRoute = mkRoute("/flashcards", FlashcardsPage);
export const analyticsRoute = mkRoute("/analytics", AnalyticsPage);
export const partnersRoute = mkRoute("/partners", PartnersPage);
export const documentsRoute = mkRoute("/documents", DocumentsPage);
export const settingsRoute = mkRoute("/settings", SettingsPage);

// ─── Feature pages (batch 1) ──────────────────────────────────────────────────
export const examRoute = mkRoute("/exam-simulator", ExamSimulatorPage);
export const learningPathRoute = mkRoute("/learning-path", LearningPathPage);
export const focusRoute = mkRoute("/focus", FocusModePage);
export const essayRoute = mkRoute("/essay-grader", EssayGraderPage);
export const voiceRoute = mkRoute("/voice-tutor", VoiceTutorPage);
export const pastPapersRoute = mkRoute("/past-papers", PastPapersPage);
export const codeRoute = mkRoute("/code-sandbox", CodeSandboxPage);
export const whiteboardRoute = mkRoute("/whiteboard", WhiteboardPage);

// ─── AI Tools pages (batch 2) ─────────────────────────────────────────────────
export const knowledgeGapsRoute = mkRoute("/knowledge-gaps", KnowledgeGapsPage);
export const aiToolsRoute = mkRoute("/ai-tools", AIToolsPage);
export const adminRoute = mkRoute("/admin", AdminPanelPage);

// ─── Route tree ───────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  landingRoute,
  aboutRoute,
  featuresRoute,
  pricingRoute,
  contactRoute,
  searchRoute,
  blogRoute,
  privacyRoute,
  termsRoute,
  notificationsRoute,
  profileRoute,
  loginRoute,
  signupRoute,
  verifyEmailRoute,
  onboardingRoute,
  forgotPasswordRoute,
  appLayoutRoute.addChildren([
    // Core
    dashboardRoute,
    tutorRoute,
    quizRoute,
    timetableRoute,
    flashcardsRoute,
    analyticsRoute,
    partnersRoute,
    documentsRoute,
    settingsRoute,
    adminRoute,
    // Feature batch 1
    examRoute,
    learningPathRoute,
    focusRoute,
    essayRoute,
    voiceRoute,
    pastPapersRoute,
    codeRoute,
    whiteboardRoute,
    // AI Tools batch 2
    knowledgeGapsRoute,
    aiToolsRoute,
  ]),
]);

// ─── Router ───────────────────────────────────────────────────────────────────
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadDelay: 100,
  scrollRestoration: true,
  context: { auth: undefined! },
});
