import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Mail,
  MapPin,
  MessageSquareText,
  MicVocal,
  MoonStar,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  SunMedium,
  Target,
  Zap,
} from "lucide-react";
import React from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  ProgressBar,
  SectionHeader,
} from "../components/ui";
import { useThemeStore } from "../store/themeStore";

const productStats = [
  {
    label: "Study sessions",
    value: "12k+",
    detail: "weekly learning interactions",
  },
  {
    label: "Quiz completions",
    value: "98.4%",
    detail: "average platform completion",
  },
  {
    label: "Average streak",
    value: "21 days",
    detail: "across active learners",
  },
  {
    label: "Curriculum coverage",
    value: "ZIMSEC",
    detail: "localized academic focus",
  },
];

const featureCards = [
  {
    icon: MessageSquareText,
    title: "Conversational AI Tutor",
    text: "Ask questions, request examples, and get structured answers tuned to your level and subject.",
  },
  {
    icon: BookOpen,
    title: "Flashcards & Spaced Repetition",
    text: "Convert notes into high-retention review cards with review scheduling that adapts to performance.",
  },
  {
    icon: CalendarDays,
    title: "Timetable Intelligence",
    text: "Turn deadlines and exam dates into a realistic study plan with AI-assisted schedule optimization.",
  },
  {
    icon: Target,
    title: "Quizzes & Exam Practice",
    text: "Generate paper-style assessments, track mastery, and identify weak topics before exams arrive.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Learning Workspace",
    text: "Session protection, role-aware access, and validated uploads keep student data and study materials safe.",
  },
  {
    icon: MicVocal,
    title: "Voice Study Mode",
    text: "Study hands-free with speech input and spoken responses for a more natural learning rhythm.",
  },
];

const testimonials = [
  {
    name: "Tariro M.",
    role: "A-Level Student",
    quote:
      "DzidzaAI feels like a focused study cockpit. I can revise, test myself, and plan my day without jumping between tools.",
  },
  {
    name: "Ms. Ncube",
    role: "Mathematics Tutor",
    quote:
      "The platform gives me curriculum-aware suggestions and clear analytics. It is practical enough for real classroom use.",
  },
  {
    name: "Kudzai R.",
    role: "University Student",
    quote:
      "The flashcards and analytics are the best part. Everything is calm, fast, and easy to revisit on mobile.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$0",
    description: "Best for trying the core study workflow.",
    items: ["Basic tutor chat", "Limited quizzes", "5 documents", "Flashcards"],
    featured: false,
  },
  {
    name: "Pro",
    price: "$12",
    description:
      "For students who study consistently and want the full toolkit.",
    items: [
      "Unlimited quizzes",
      "Exam simulator",
      "Study plans",
      "Analytics dashboard",
    ],
    featured: true,
  },
  {
    name: "Teams",
    price: "Custom",
    description: "For schools, tutors, and learning cohorts.",
    items: [
      "Group analytics",
      "Shared materials",
      "Admin controls",
      "Priority support",
    ],
    featured: false,
  },
];

const faq = [
  [
    "Is DzidzaAI only for Zimbabwean students?",
    "No. The system is localized for ZIMSEC and similar curricula, but the platform works for broader study use as well.",
  ],
  [
    "Can I upload past papers and notes?",
    "Yes. Documents can be uploaded for summarization, Q&A, and flashcard generation.",
  ],
  [
    "Does the platform work on mobile?",
    "Yes. The UI is built to adapt cleanly to phones, tablets, laptops, and larger screens.",
  ],
  [
    "Can schools use it?",
    "Yes. The architecture supports team-oriented deployment and admin workflows for institutions.",
  ],
];

const publicNav = [
  ["Features", "/features"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

function PublicShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-primary/15 selection:text-ink overflow-x-hidden">
      <div className="sticky top-0 z-40 border-b border-border2 bg-bg/85 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">DzidzaAI</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink3">
                Premium learning platform
              </p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {publicNav.map(([label, path]) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate({ to: path as any })}
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-ink3 hover:text-ink hover:bg-surface2 transition-colors"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-border2 bg-surface2 text-ink3 hover:text-ink hover:border-primary/30 transition-colors"
              title="Toggle dark mode"
            >
              {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
            </button>
            <Button variant="ghost" onClick={() => navigate({ to: "/login" })}>
              Sign in
            </Button>
            <Button onClick={() => navigate({ to: "/onboarding" })}>
              Get started
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="mb-6">
          <Badge variant="blue" className="px-3 py-1.5 gap-2">
            <ShieldCheck size={12} /> {eyebrow}
          </Badge>
          <h1 className="mt-5 max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.02] font-serif">
            {title}
          </h1>
          {intro && (
            <p className="mt-5 max-w-2xl text-base sm:text-lg text-ink3 leading-relaxed">
              {intro}
            </p>
          )}
        </div>

        {children}
      </main>

      <footer className="border-t border-border2 bg-surface/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <p className="font-bold">DzidzaAI</p>
            </div>
            <p className="text-sm text-ink3 leading-relaxed max-w-sm">
              A focused AI learning platform for tutoring, revision, and study
              planning.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-4">
              Product
            </p>
            <div className="space-y-3">
              {[
                ["Features", "/features"],
                ["Pricing", "/pricing"],
                ["Blog", "/blog"],
                ["Dashboard", "/dashboard"],
              ].map(([label, path]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate({ to: path as any })}
                  className="block text-sm text-ink2 hover:text-primary transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-4">
              Support
            </p>
            <div className="space-y-3">
              {[
                ["Contact", "/contact"],
                ["Help Center", "/contact"],
                ["Privacy", "/privacy"],
                ["Terms", "/terms"],
              ].map(([label, path]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate({ to: path as any })}
                  className="block text-sm text-ink2 hover:text-primary transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-4">
              Contact
            </p>
            <div className="space-y-3 text-sm text-ink2">
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-primary" /> support@dzidza.ai
              </p>
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-primary" /> +263 78 991 1535
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-primary" /> Harare, Zimbabwe
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FeatureBlock = ({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) => (
  <Card hoverable className="h-full">
    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
      <Icon size={22} />
    </div>
    <h3 className="text-xl font-bold font-serif text-ink mb-3">{title}</h3>
    <p className="text-sm leading-relaxed text-ink3">{text}</p>
  </Card>
);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PublicShell
      eyebrow="Premium AI learning workspace"
      title="A calm, intelligent platform for serious study."
      intro="DzidzaAI combines tutoring, quizzes, flashcards, document intelligence, focus sessions, and analytics in one premium workspace designed for student productivity."
    >
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-start">
        <div className="space-y-7">
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="px-6"
              onClick={() => navigate({ to: "/onboarding" })}
            >
              Start free <ChevronRight size={16} />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-6"
              onClick={() => navigate({ to: "/features" })}
            >
              Explore features
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {productStats.map((stat) => (
              <Card key={stat.label} className="p-4">
                <p className="text-2xl font-bold tracking-tight text-ink">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-ink3">
                  {stat.label}
                </p>
                <p className="mt-2 text-xs text-ink3 leading-relaxed">
                  {stat.detail}
                </p>
              </Card>
            ))}
          </div>

          <Card className="p-6 md:p-8 border-primary/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3">
                  Today&apos;s focus
                </p>
                <h2 className="text-2xl font-bold font-serif text-ink mt-1">
                  Study intelligence, not clutter.
                </h2>
              </div>
              <Badge variant="green">Live</Badge>
            </div>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Tutor", "Explain algebraic sequences"],
                  ["Quiz", "Generate a 10-question revision set"],
                  ["Plan", "Optimise tonight's study timetable"],
                ].map(([label, text]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-border2 bg-surface2 p-4"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3">
                      {label}
                    </p>
                    <p className="mt-2 text-sm text-ink2 leading-relaxed">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-border2 bg-surface p-4">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-ink3 mb-3">
                  <span>Mastery progress</span>
                  <span>78%</span>
                </div>
                <ProgressBar value={78} />
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 md:p-8 shadow-xl sticky top-28">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3">
                Product view
              </p>
              <h3 className="text-2xl font-bold font-serif text-ink mt-1">
                A focused command center
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Target size={20} />
            </div>
          </div>

          <div className="space-y-3">
            {[
              ["AI Tutor", "Subject-aware explanations and examples"],
              ["Flashcards", "Built from notes and documents automatically"],
              ["Analytics", "Performance, streaks, readiness, and weak topics"],
              ["Focus Mode", "Pomodoro sessions with reflection and insight"],
            ].map(([label, text]) => (
              <div
                key={label}
                className="rounded-2xl border border-border2 bg-surface p-4 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-surface2 flex items-center justify-center text-primary shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="font-semibold text-ink">{label}</p>
                  <p className="text-sm text-ink3 mt-1">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ["Tutor", "28 min"],
              ["Quiz", "94%"],
              ["Focus", "4 sessions"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-border2 bg-surface2 p-3 text-center"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink3">
                  {label}
                </p>
                <p className="mt-1 text-lg font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="py-20">
        <SectionHeader
          title="Why students stay focused here"
          subtitle="Everything is arranged around momentum, clarity, and measurable learning outcomes."
          icon={<Sparkles size={20} />}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature) => (
            <FeatureBlock
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              text={feature.text}
            />
          ))}
        </div>
      </section>

      <section className="py-20 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="p-7">
          <SectionHeader
            title="AI capabilities"
            subtitle="The platform adapts to tutoring, revision, document understanding, and exam practice without changing tools."
          />
          <div className="space-y-4">
            {[
              [
                "Tutor chat",
                "Ask follow-up questions, request examples, and get concise guidance.",
              ],
              [
                "Quiz generation",
                "Create subject-specific revision sets with difficulty control.",
              ],
              [
                "Document summaries",
                "Turn PDFs, notes, and past papers into digestible study material.",
              ],
              [
                "Voice study",
                "Use speech input for hands-free learning and accessibility.",
              ],
            ].map(([title, text], index) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl border border-border2 bg-surface p-4"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-ink">{title}</p>
                  <p className="text-sm text-ink3 mt-1">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-7">
          <SectionHeader
            title="How it works"
            subtitle="The workflow is designed to stay fast and clear from first login to daily review."
          />
          <div className="space-y-4">
            {[
              [
                "1",
                "Create an account and set your level, language, and subjects.",
              ],
              [
                "2",
                "Upload documents or generate a quiz, timetable, or learning path.",
              ],
              ["3", "Review analytics and AI feedback, then keep iterating."],
            ].map(([step, text]) => (
              <div
                key={step}
                className="rounded-2xl border border-border2 bg-surface2 p-4 flex gap-4 items-start"
              >
                <div className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center font-bold">
                  {step}
                </div>
                <p className="text-sm text-ink2 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-border2 bg-surface p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">
                Productivity score
              </p>
              <p className="text-xs text-ink3">
                Measured from study consistency and review activity
              </p>
            </div>
            <div className="text-2xl font-bold text-primary">91%</div>
          </div>
        </Card>
      </section>

      <section className="py-20">
        <SectionHeader
          title="What learners are saying"
          subtitle="The interface is designed to feel calm and productive in daily use."
          icon={<Star size={20} />}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.name} className="p-6 h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {item.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-ink">{item.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-ink3 font-black">
                    {item.role}
                  </p>
                </div>
              </div>
              <p className="text-sm text-ink3 leading-relaxed">{item.quote}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-20">
        <SectionHeader
          title="Simple pricing that scales with your studies"
          subtitle="Choose a plan that fits how often you study and how deep you want to go."
          icon={<Zap size={20} />}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.featured ? "p-7 border-primary/20 shadow-xl" : "p-7"
              }
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-2xl font-bold font-serif text-ink">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-ink3 mt-2 leading-relaxed">
                    {plan.description}
                  </p>
                </div>
                {plan.featured && <Badge variant="blue">Popular</Badge>}
              </div>
              <p className="text-4xl font-bold tracking-tight text-ink">
                {plan.price}
              </p>
              <p className="text-xs uppercase tracking-[0.2em] font-black text-ink3 mt-1">
                per month
              </p>
              <div className="mt-6 space-y-3">
                {plan.items.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm text-ink2"
                  >
                    <CheckCircle2 size={16} className="text-primary shrink-0" />{" "}
                    {item}
                  </div>
                ))}
              </div>
              <Button
                className="w-full mt-7"
                variant={plan.featured ? "primary" : "outline"}
                onClick={() => navigate({ to: "/onboarding" })}
              >
                {plan.featured ? "Start Pro" : "Choose plan"}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-20">
        <SectionHeader
          title="Frequently asked questions"
          subtitle="Short answers to the most important product questions."
          icon={<Search size={20} />}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {faq.map(([question, answer]) => (
            <details
              key={question}
              className="group rounded-2xl border border-border2 bg-surface p-5"
            >
              <summary className="cursor-pointer list-none font-semibold text-ink flex items-center justify-between gap-4">
                <span>{question}</span>
                <ChevronRight
                  size={16}
                  className="transition-transform group-open:rotate-90"
                />
              </summary>
              <p className="mt-3 text-sm text-ink3 leading-relaxed">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="py-20">
        <Card className="p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] items-center">
            <div>
              <Badge variant="green" className="mb-4">
                Ready when you are
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-ink leading-tight">
                Build a steadier study habit with a calmer interface.
              </h2>
              <p className="mt-4 text-ink3 leading-relaxed max-w-xl">
                DzidzaAI is built to help students spend less time switching
                between tools and more time actually learning.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button size="lg" onClick={() => navigate({ to: "/onboarding" })}>
                Create account
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate({ to: "/contact" })}
              >
                Talk to us
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </PublicShell>
  );
};

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PublicShell
      eyebrow="About DzidzaAI"
      title="Purpose-built for learning momentum."
      intro="DzidzaAI was designed to make tutoring, revision, planning, and performance tracking feel like one coherent product instead of a stack of separate tools."
    >
      <div className="grid gap-4 lg:grid-cols-3 mb-10">
        {[
          [
            "Student first",
            "The interface prioritizes clarity, speed, and learning confidence.",
          ],
          [
            "Curriculum aware",
            "Features are aligned to ZIMSEC-style academic workflows and study habits.",
          ],
          [
            "Production ready",
            "The platform is structured like a modern SaaS application with room to scale.",
          ],
        ].map(([title, text]) => (
          <Card key={title} className="p-6">
            <h3 className="text-xl font-bold font-serif text-ink mb-3">
              {title}
            </h3>
            <p className="text-sm text-ink3 leading-relaxed">{text}</p>
          </Card>
        ))}
      </div>
      <Card className="p-8">
        <SectionHeader
          title="Our product philosophy"
          subtitle="Calm surfaces, clear hierarchy, and useful intelligence always beat visual noise."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            [
              "Minimal complexity",
              "Students should understand the page in a glance.",
            ],
            [
              "Useful automation",
              "AI should save time, not create extra work.",
            ],
            [
              "Trust and safety",
              "Security, validation, and predictability matter.",
            ],
            [
              "High usability",
              "Mobile and desktop experiences should feel equally polished.",
            ],
          ].map(([title, text]) => (
            <div
              key={title}
              className="rounded-2xl border border-border2 bg-surface2 p-4"
            >
              <p className="font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm text-ink3 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => navigate({ to: "/features" })}>
            See features
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/pricing" })}
          >
            See pricing
          </Button>
        </div>
      </Card>
    </PublicShell>
  );
};

export const FeaturesPage: React.FC = () => {
  return (
    <PublicShell
      eyebrow="Platform features"
      title="Everything a focused student needs."
      intro="A complete, premium learning toolkit that keeps the user moving from tutoring to revision without breaking flow."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map((feature) => (
          <FeatureBlock
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            text={feature.text}
          />
        ))}
      </div>
      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <Card className="p-7">
          <h3 className="text-2xl font-bold font-serif text-ink mb-4">
            Study flow
          </h3>
          <div className="space-y-3 text-sm text-ink3 leading-relaxed">
            <p>1. Tutor asks and answers questions in context.</p>
            <p>2. Content is summarized into notes, flashcards, and quizzes.</p>
            <p>3. Analytics surface weak areas and study habits.</p>
            <p>4. Timetable and focus tools keep revision consistent.</p>
          </div>
        </Card>
        <Card className="p-7">
          <h3 className="text-2xl font-bold font-serif text-ink mb-4">
            Performance-friendly design
          </h3>
          <div className="space-y-3 text-sm text-ink3 leading-relaxed">
            <p>• Fast routes and lean components.</p>
            <p>• Mobile-friendly layouts and readable spacing.</p>
            <p>• Strong contrast and keyboard-friendly interactions.</p>
            <p>• Reusable design tokens for consistent UI at scale.</p>
          </div>
        </Card>
      </section>
    </PublicShell>
  );
};

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PublicShell
      eyebrow="Pricing"
      title="Simple pricing for students and teams."
      intro="Start free, upgrade when the platform becomes part of your daily study routine."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.featured ? "p-7 border-primary/20 shadow-xl" : "p-7"
            }
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-2xl font-bold font-serif text-ink">
                  {plan.name}
                </h3>
                <p className="text-sm text-ink3 mt-2 leading-relaxed">
                  {plan.description}
                </p>
              </div>
              {plan.featured && <Badge variant="blue">Popular</Badge>}
            </div>
            <p className="text-4xl font-bold tracking-tight text-ink">
              {plan.price}
            </p>
            <div className="mt-6 space-y-3">
              {plan.items.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-ink2"
                >
                  <CheckCircle2 size={16} className="text-primary shrink-0" />{" "}
                  {item}
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-7"
              variant={plan.featured ? "primary" : "outline"}
              onClick={() => navigate({ to: "/onboarding" })}
            >
              {plan.featured ? "Start Pro" : "Choose plan"}
            </Button>
          </Card>
        ))}
      </div>
    </PublicShell>
  );
};

export const ContactPage: React.FC = () => {
  return (
    <PublicShell
      eyebrow="Contact"
      title="Talk to the DzidzaAI team."
      intro="For schools, tutors, partnerships, or product questions, use the form below or reach out directly."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card className="p-7">
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <Input label="Full name" placeholder="Your name" />
            <Input label="Email" placeholder="you@example.com" type="email" />
          </div>
          <Input
            label="Subject"
            placeholder="How can we help?"
            className="mb-4"
          />
          <Input
            label="Message"
            as="textarea"
            placeholder="Tell us what you need"
          />
          <Button className="mt-5">Send message</Button>
        </Card>

        <Card className="p-7 space-y-4">
          <div className="rounded-2xl border border-border2 bg-surface p-4 flex items-center gap-3">
            <Mail size={16} className="text-primary" />
            <div>
              <p className="font-semibold text-ink">support@dzidza.ai</p>
              <p className="text-sm text-ink3">
                General support and partnership inquiries
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border2 bg-surface p-4 flex items-center gap-3">
            <Phone size={16} className="text-primary" />
            <div>
              <p className="font-semibold text-ink">+263 78 991 1535</p>
              <p className="text-sm text-ink3">
                Business hours and priority support
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border2 bg-surface p-4 flex items-center gap-3">
            <MapPin size={16} className="text-primary" />
            <div>
              <p className="font-semibold text-ink">Harare, Zimbabwe</p>
              <p className="text-sm text-ink3">
                Localized curriculum and operations
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PublicShell>
  );
};

export const BlogPage: React.FC = () => {
  return (
    <PublicShell
      eyebrow="Blog"
      title="Product notes and study ideas."
      intro="Short articles about learning design, exam preparation, and feature updates."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          [
            "Designing a calmer study UI",
            "A walkthrough of the spacing, typography, and hierarchy choices behind DzidzaAI.",
          ],
          [
            "How AI quizzes should feel",
            "Why structured practice beats noisy gamified screens for serious revision.",
          ],
          [
            "Using analytics to stay consistent",
            "How to turn progress metrics into a study routine that lasts.",
          ],
        ].map(([title, text]) => (
          <Card key={title} className="p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-3">
              Article
            </p>
            <h3 className="text-xl font-bold font-serif text-ink mb-3">
              {title}
            </h3>
            <p className="text-sm text-ink3 leading-relaxed">{text}</p>
            <Button variant="ghost" className="mt-5 px-0">
              Read more <ArrowRight size={14} />
            </Button>
          </Card>
        ))}
      </div>
    </PublicShell>
  );
};

export const PrivacyPage: React.FC = () => (
  <PublicShell
    eyebrow="Privacy"
    title="Privacy and data handling."
    intro="A concise overview of how student data should be treated in a learning platform."
  >
    <Card className="p-7 space-y-4 leading-relaxed text-ink3">
      <p>
        DzidzaAI is designed to keep study history, documents, and analytics
        isolated to the signed-in user.
      </p>
      <p>
        Upload processing, tutoring prompts, and learning records should be
        stored with least-privilege access and strict validation.
      </p>
      <p>
        Refresh tokens and other secrets must be handled securely, and any
        future exports or reports should be opt-in.
      </p>
    </Card>
  </PublicShell>
);

export const TermsPage: React.FC = () => (
  <PublicShell
    eyebrow="Terms"
    title="Platform terms."
    intro="A simple, readable terms page for the product surface."
  >
    <Card className="p-7 space-y-4 leading-relaxed text-ink3">
      <p>
        The platform is intended for educational support, revision, and
        productivity assistance.
      </p>
      <p>
        Users are responsible for how they use generated outputs and should
        verify important study material before relying on it.
      </p>
      <p>
        The service may change features, quotas, and supported integrations as
        the product evolves.
      </p>
    </Card>
  </PublicShell>
);
