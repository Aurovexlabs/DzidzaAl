import { clsx } from "clsx";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Info,
  Plus,
  SmilePlus,
  Sparkles,
  Target,
  Timer,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  ProgressBar,
  SectionHeader,
  Skeleton,
} from "../components/ui";
import { quizApi } from "../services/apiServices";
import { useAuthStore } from "../store/authStore";
import type { Question, Quiz } from "../types";

type View = "list" | "generate" | "taking" | "results";

export const QuizPage: React.FC = () => {
  const { user } = useAuthStore();
  const [view, setView] = useState<View>("list");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({
    subject: "",
    topic: "",
    difficulty: "medium",
    count: 10,
  });

  // Taking state
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [qStartTime, setQStartTime] = useState(Date.now());

  useEffect(() => {
    quizApi
      .getAll()
      .then((r) => {
        setQuizzes((r.data as any).data?.quizzes || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generateQuiz = async () => {
    if (!genForm.subject) {
      toast.error("Domain specification required");
      return;
    }
    setGenerating(true);
    try {
      const res = await quizApi.generate({ ...genForm });
      const quiz = (res.data as any).data?.quiz;
      setQuizzes((prev) => [quiz, ...prev]);
      await startQuiz(quiz);
      toast.success("AI Assessment synthesized.");
    } catch {
      toast.error("Generation sequence failure");
    } finally {
      setGenerating(false);
    }
  };

  const startQuiz = async (quiz: Quiz) => {
    try {
      const res = await quizApi.start(quiz._id);
      const started = (res.data as any).data?.quiz || quiz;
      setActiveQuiz(started);
      setQIndex(0);
      setAnswers({});
      setRevealed(false);
      setQStartTime(Date.now());
      setView("taking");
    } catch {
      toast.error("Protocol initialization failed");
    }
  };

  const selectAnswer = (questionId: string, answer: string) => {
    if (revealed) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const checkAnswer = () => setRevealed(true);

  const nextQuestion = () => {
    if (!activeQuiz) return;
    if (qIndex < activeQuiz.questions.length - 1) {
      setQIndex((i) => i + 1);
      setRevealed(false);
      setQStartTime(Date.now());
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    const answerList = activeQuiz.questions.map((q) => ({
      questionId: q._id,
      selectedAnswer: answers[q._id] || "",
      timeTaken: Math.round((Date.now() - qStartTime) / 1000),
    }));
    try {
      const res = await quizApi.submit(activeQuiz._id, answerList);
      setResults((res.data as any).data);
      setView("results");
      setQuizzes((prev) =>
        prev.map((q) =>
          q._id === activeQuiz._id
            ? {
                ...q,
                status: "completed",
                score: (res.data as any).data?.score,
              }
            : q,
        ),
      );
    } catch {
      toast.error("Telemetry upload failure");
    }
  };

  const currentQ: Question | undefined = activeQuiz?.questions[qIndex];
  const selectedAnswer = currentQ ? answers[currentQ._id] : undefined;
  const isCorrect =
    currentQ && revealed ? selectedAnswer === currentQ.correctAnswer : null;
  const progress = activeQuiz
    ? ((qIndex + 1) / activeQuiz.questions.length) * 100
    : 0;

  if (loading)
    return (
      <div className="space-y-8 animate-fade-in pb-12 p-6">
        <div className="flex justify-between items-end">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-12 w-48 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-12 relative px-6">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header - Not shown when taking a quiz */}
      {view !== "taking" && view !== "results" && (
        <SectionHeader
          title="Quiz workspace"
          subtitle="Create focused assessments, review results, and track progress across every subject area."
          icon={<BrainCircuit size={24} />}
          action={
            <Button
              onClick={() => setView("generate")}
              className="h-12 px-8 gap-3 shadow-2xl shadow-primary/20 rounded-2xl"
            >
              <Plus size={20} /> Create quiz
            </Button>
          }
        />
      )}

      <Card className="p-6 border-border2 bg-surface shadow-xl mb-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <BrainCircuit size={18} />,
              title: "Generate targeted sets",
              text: "Choose a subject, topic, and difficulty to create an assessment that matches the area you want to strengthen.",
            },
            {
              icon: <Target size={18} />,
              title: "Answer in phases",
              text: "Each question is shown one at a time so you can answer deliberately and review the reasoning afterward.",
            },
            {
              icon: <CheckCircle2 size={18} />,
              title: "Learn from feedback",
              text: "Results, explanations, and progress data are captured together so the quiz informs your study plan.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border2 bg-bg px-5 py-4 shadow-soft"
            >
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-ink3">
                <span className="text-primary">{item.icon}</span>
                {item.title}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink2">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* VIEW: LIST */}
      {view === "list" && (
        <>
          {quizzes.length === 0 ? (
            <EmptyState
              icon={<BrainCircuit size={48} />}
              title="No quizzes yet"
              description="Create your first assessment to focus on a subject, topic, and difficulty level that matches your current goals."
              action={
                <Button
                  onClick={() => setView("generate")}
                  size="lg"
                  className="h-14 px-10 rounded-2xl shadow-2xl shadow-primary/20"
                >
                  Create first quiz
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((q) => (
                <Card
                  key={q._id}
                  hoverable
                  className="group flex flex-col h-full border-border2 shadow-xl hover:border-primary/20"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-bg border border-border2 text-primary flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                      <BookOpenText size={24} />
                    </div>
                    <Badge
                      variant={
                        q.status === "completed"
                          ? "green"
                          : q.status === "in_progress"
                            ? "amber"
                            : "blue"
                      }
                      className="font-black px-3 py-1 rounded-lg border-current/10"
                    >
                      {q.status.toUpperCase().replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-black text-ink tracking-tight group-hover:text-primary transition-colors leading-tight">
                      {q.title || q.subject}
                    </h3>
                    <div className="flex items-center gap-4 text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] pt-2">
                      <span className="flex items-center gap-1.5">
                        <Timer size={12} /> {q.totalQuestions} PHASES
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Activity size={12} />{" "}
                        {q.currentDifficulty.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border2">
                      {q.status === "completed" ? (
                        <div className="space-y-3 p-5 bg-bg/50 rounded-2xl border border-border2 shadow-inner">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-1">
                            <span className="text-text-secondary">
                              Mastery Quotient
                            </span>
                            <span
                              className={clsx(
                                q.score >= 80
                                  ? "text-secondary"
                                  : q.score >= 50
                                    ? "text-primary"
                                    : "text-red-500",
                              )}
                            >
                              {q.score}%
                            </span>
                          </div>
                          <ProgressBar
                            value={q.score}
                            className="gap-0!"
                            color={
                              q.score >= 80
                                ? "var(--color-secondary)"
                                : q.score >= 50
                                  ? "var(--color-primary)"
                                  : "var(--danger)"
                            }
                          />
                        </div>
                      ) : (
                        <div className="h-16 flex items-center justify-center border-2 border-dashed border-border2 rounded-2xl bg-bg/30 group-hover:border-primary/20 transition-colors">
                          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] opacity-40">
                            Awaiting Assessment
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant={
                      q.status === "in_progress" ? "secondary" : "outline"
                    }
                    className="w-full h-12 mt-8 rounded-xl font-black uppercase tracking-widest text-[10px] group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-md group-hover:shadow-2xl shadow-primary/10"
                    onClick={() => startQuiz(q)}
                  >
                    {q.status === "in_progress"
                      ? "Resume Sequence"
                      : "Review & Launch"}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* VIEW: GENERATE */}
      {view === "generate" && (
        <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
          <Card className="relative overflow-hidden border-border2 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] p-10">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group">
              <Sparkles
                size={160}
                className="group-hover:rotate-12 transition-transform duration-1000"
              />
            </div>

            <div className="relative z-10 space-y-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3">
                  <BrainCircuit size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black font-serif text-ink tracking-tight leading-none">
                    Quiz configuration
                  </h3>
                  <p className="text-xs text-primary font-bold uppercase tracking-[0.2em] mt-2">
                    Assessment settings
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] px-1">
                    Syllabus Domain
                  </label>
                  <Input
                    placeholder="e.g. Mechanical Engineering / Biology"
                    value={genForm.subject}
                    className="h-14 text-lg! font-bold!"
                    onChange={(e: any) =>
                      setGenForm((f) => ({ ...f, subject: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] px-1">
                    Target Topic (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Thermodynamics / Genetics"
                    value={genForm.topic}
                    className="h-14 text-base! font-bold!"
                    onChange={(e: any) =>
                      setGenForm((f) => ({ ...f, topic: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] px-1">
                      Baseline Difficulty
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {["easy", "medium", "hard"].map((d) => (
                        <button
                          key={d}
                          onClick={() =>
                            setGenForm({ ...genForm, difficulty: d as any })
                          }
                          className={clsx(
                            "p-3.5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between group/diff",
                            genForm.difficulty === d
                              ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20"
                              : "bg-bg border-border2 text-text-secondary hover:border-primary/40",
                          )}
                        >
                          {d}
                          {genForm.difficulty === d && (
                            <CheckCircle2 size={12} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] px-1">
                          Uplink Volume
                        </label>
                        <Badge
                          variant="blue"
                          className="px-3 font-black tabular-nums"
                        >
                          {genForm.count} PHASES
                        </Badge>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={20}
                        step={5}
                        className="w-full h-2 bg-surface2 rounded-lg appearance-none cursor-pointer accent-primary"
                        value={genForm.count}
                        onChange={(e) =>
                          setGenForm((f) => ({ ...f, count: +e.target.value }))
                        }
                      />
                      <div className="flex justify-between mt-3 px-1 text-[9px] font-black text-text-secondary opacity-30 uppercase tracking-widest">
                        <span>Foundation (5)</span>
                        <span>Full (20)</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-bg-light/50 dark:bg-bg-dark/50 border border-border2 border-dashed flex gap-4 items-start">
                      <Info size={16} className="text-primary shrink-0 mt-1" />
                      <p className="text-[10px] font-bold text-text-secondary leading-relaxed uppercase tracking-widest">
                        AI will dynamically adapt difficulty based on response
                        speed and accuracy patterns.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-10 flex flex-col sm:flex-row gap-4 border-t border-border2">
                  <Button
                    size="lg"
                    className="flex-1 h-16 gap-3 shadow-2xl shadow-primary/30 text-base rounded-2xl"
                    onClick={generateQuiz}
                    loading={generating}
                  >
                    {!generating && <Zap size={20} className="fill-current" />}{" "}
                    Start quiz
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-16 px-10 rounded-2xl"
                    onClick={() => setView("list")}
                  >
                    Abort
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* VIEW: TAKING */}
      {view === "taking" && activeQuiz && currentQ && (
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
          {/* Global Quiz Progress HUD */}
          <Card className="p-6 sticky top-20 z-40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border-white/10 glass rounded-4xl">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20 rotate-3">
                    <Target size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">
                      Phase {qIndex + 1} / {activeQuiz.questions.length}
                    </p>
                    <h4 className="text-sm font-black text-ink uppercase tracking-tighter truncate max-w-50">
                      {activeQuiz.subject}
                    </h4>
                  </div>
                </div>
                <div className="h-10 w-px bg-border2 hidden sm:block" />
                <div className="hidden sm:flex flex-col">
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1">
                    Difficulty
                  </p>
                  <Badge
                    variant={
                      currentQ.difficulty === "easy"
                        ? "green"
                        : currentQ.difficulty === "medium"
                          ? "amber"
                          : "red"
                    }
                    className="font-black px-3 py-1 shadow-sm border-current/10"
                  >
                    {currentQ.difficulty.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1">
                    Elapsed time
                  </p>
                  <p className="text-lg font-black font-mono tracking-tighter text-ink tabular-nums">
                    00:00
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  className="h-10 px-6 rounded-xl font-black text-[10px] tracking-widest shadow-lg shadow-red-500/20"
                  onClick={() => {
                    if (window.confirm("Terminate assessment?"))
                      setView("list");
                  }}
                >
                  Abort
                </Button>
              </div>
            </div>
            <ProgressBar
              value={progress}
              className="gap-1! h-2"
              color="var(--color-primary)"
            />
          </Card>

          <Card
            className="p-12 shadow-2xl relative overflow-hidden border-border2 group rounded-[2.5rem]"
            hoverable={false}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/3 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] pointer-events-none group-hover:bg-primary/6 transition-colors duration-1000" />

            <p className="text-2xl font-black font-serif text-ink mb-12 leading-relaxed relative z-10 tracking-tight">
              {currentQ.text}
            </p>

            <div className="grid grid-cols-1 gap-4 relative z-10">
              {currentQ.options.map((opt, i) => {
                const isSelected = selectedAnswer === opt;
                const isRight = revealed && opt === currentQ.correctAnswer;
                const isWrong =
                  revealed && isSelected && opt !== currentQ.correctAnswer;

                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(currentQ._id, opt)}
                    className={clsx(
                      "group flex items-center justify-between p-6 px-8 rounded-3xl border-2 transition-all duration-500 text-left relative overflow-hidden active:scale-[0.98]",
                      isRight
                        ? "bg-secondary/10 border-secondary text-secondary shadow-[0_0_40px_rgba(20,184,166,0.15)] ring-4 ring-secondary/5"
                        : isWrong
                          ? "bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.15)] ring-4 ring-red-500/5"
                          : isSelected
                            ? "bg-primary/10 border-primary text-primary shadow-[0_0_40px_rgba(37,99,235,0.15)] ring-4 ring-primary/5"
                            : "bg-surface border-border2 text-ink2 hover:border-primary/40 hover:bg-surface2 hover:shadow-xl",
                    )}
                    disabled={revealed}
                  >
                    <span className="text-base font-bold flex-1 leading-tight">
                      {opt}
                    </span>
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all duration-500 shadow-soft",
                        isRight
                          ? "bg-secondary border-secondary text-white rotate-360 scale-110 shadow-secondary/40"
                          : isWrong
                            ? "bg-red-500 border-red-500 text-white scale-110 shadow-red-500/40"
                            : isSelected
                              ? "bg-primary border-primary text-white scale-110 shadow-primary/40"
                              : "border-border2 bg-bg",
                      )}
                    >
                      {isRight && <CheckCircle2 size={18} />}
                      {isWrong && <XCircle size={18} />}
                      {isSelected && !revealed && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {revealed && currentQ.explanation && (
              <div
                className={clsx(
                  "mt-12 p-8 rounded-4xl border-l-8 animate-in fade-in slide-in-from-top-6 duration-700 shadow-soft relative overflow-hidden",
                  isCorrect
                    ? "bg-secondary/3 border-secondary text-secondary"
                    : "bg-red-500/3 border-red-500 text-red-500",
                )}
              >
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  {isCorrect ? (
                    <Trophy size={24} className="animate-bounce" />
                  ) : (
                    <AlertTriangle size={24} className="animate-pulse" />
                  )}
                  <h4 className="text-sm font-black uppercase tracking-[0.2em]">
                    {isCorrect ? "SYNTHESIS SUCCESS" : "CORRECTIVE LOGIC"}
                  </h4>
                </div>
                <p className="text-base font-medium leading-loose text-ink italic relative z-10 pl-1">
                  "{currentQ.explanation}"
                </p>
                <div
                  className={clsx(
                    "absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none",
                    isCorrect ? "bg-secondary" : "bg-red-500",
                  )}
                />
              </div>
            )}

            <div className="mt-12 pt-10 border-t border-border2 flex justify-end relative z-10">
              {!revealed ? (
                <Button
                  size="lg"
                  onClick={checkAnswer}
                  disabled={!selectedAnswer}
                  className="h-16 px-12 rounded-2xl shadow-2xl shadow-primary/30 text-base font-black uppercase tracking-widest gap-3"
                >
                  Verify Logical Response <ChevronRight size={20} />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={nextQuestion}
                  className={clsx(
                    "h-16 px-12 rounded-2xl shadow-2xl text-base font-black uppercase tracking-widest gap-3 transition-all duration-500 hover:scale-105",
                    isCorrect
                      ? "bg-secondary hover:bg-secondary-light shadow-secondary/30"
                      : "bg-primary hover:bg-primary-dark shadow-primary/30",
                  )}
                >
                  {qIndex < activeQuiz.questions.length - 1
                    ? "Next question"
                    : "Finish quiz"}
                  <ArrowRight size={20} />
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* VIEW: RESULTS */}
      {view === "results" && results && (
        <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-700 py-12 pb-32">
          <Card
            className="text-center p-16 shadow-[0_64px_128px_-24px_rgba(0,0,0,0.2)] relative overflow-hidden border-border2 rounded-[3rem]"
            hoverable={false}
          >
            <div className="absolute inset-0 bg-surface pointer-events-none opacity-0" />

            <div className="relative z-10 space-y-12">
              <div className="w-32 h-32 rounded-[3rem] bg-surface border-2 border-border2 mx-auto flex items-center justify-center text-primary shadow-2xl relative group">
                <div className="absolute inset-0 rounded-[3rem] bg-primary/5 group-hover:animate-ping opacity-20 transition-all" />
                {results.score >= 80 ? (
                  <Trophy
                    size={64}
                    className="text-accent relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform"
                  />
                ) : results.score >= 50 ? (
                  <Target
                    size={64}
                    className="text-secondary relative z-10 group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <SmilePlus
                    size={64}
                    className="text-primary relative z-10 group-hover:scale-110 transition-transform"
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/20 bg-secondary/5 text-secondary text-[10px] font-black uppercase tracking-[0.3em]">
                  Assessment Complete
                </div>
                <h2 className="text-8xl font-black font-serif text-ink tracking-tighter leading-none text-gradient">
                  {results.score}%
                </h2>
                <p className="text-xs font-black text-text-secondary uppercase tracking-[0.4em] opacity-40">
                  Performance summary
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  {
                    label: "XP earned",
                    val: `+${results.xpEarned}`,
                    icon: <Zap size={14} />,
                    color: "text-primary",
                  },
                  {
                    label: "Accuracy",
                    val: `${results.correctAnswers} / ${results.totalQuestions}`,
                    icon: <Target size={14} />,
                    color: "text-secondary",
                  },
                  {
                    label: "Current level",
                    val: `${user?.level || 1}`,
                    icon: <Activity size={14} />,
                    color: "text-accent",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-6 rounded-4xl bg-bg border border-border2 shadow-soft group hover:border-primary/20 transition-all"
                  >
                    <div
                      className={clsx(
                        "w-10 h-10 rounded-2xl bg-surface border border-border2 flex items-center justify-center mx-auto mb-4 shadow-inner group-hover:rotate-6 transition-transform",
                        stat.color,
                      )}
                    >
                      {stat.icon}
                    </div>
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-2">
                      {stat.label}
                    </p>
                    <p
                      className={clsx(
                        "text-2xl font-black tracking-tighter",
                        stat.color,
                      )}
                    >
                      {stat.val}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8 border-t border-border2">
                <Button
                  size="lg"
                  className="h-16 px-12 rounded-2xl shadow-2xl shadow-primary/30 text-base font-black uppercase tracking-widest"
                  onClick={() => setView("list")}
                >
                  Back to quizzes
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 px-12 rounded-2xl border-2 text-base font-black uppercase tracking-widest"
                  onClick={() => setView("generate")}
                >
                  Create another quiz
                </Button>
              </div>
            </div>

            {/* Celebratory particles simulated */}
            {results.score >= 80 && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-accent/20 animate-float"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.5}s`,
                      animationDuration: `${3 + Math.random() * 5}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
