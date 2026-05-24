import { useNavigate } from "@tanstack/react-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ProgressBar,
  Spinner,
  StatCard,
} from "../components/ui";
import {
  essayApi,
  examApi,
  focusApi,
  learningPathApi,
  voiceApi,
} from "../services/apiServices";
import { useAuthStore } from "../store/authStore";
import type {
  EssayGrade,
  ExamQuestion,
  ExamSession,
  FocusSession,
  LearningPath,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. AI EXAM SIMULATOR
// ═══════════════════════════════════════════════════════════════════════════════
export const ExamSimulatorPage: React.FC = () => {
  const { user } = useAuthStore();
  const [view, setView] = useState<"list" | "generate" | "taking" | "results">(
    "list",
  );
  const [exams, setExams] = useState<ExamSession[]>([]);
  const [activeExam, setActiveExam] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<any>(null);
  const timerRef = useRef<any>(null);
  const [genForm, setGenForm] = useState({
    subject: "",
    year: new Date().getFullYear().toString(),
    paper: "Paper 1",
    totalMarks: 100,
    questionTypes: ["mcq", "short_answer", "essay"] as string[],
  });

  useEffect(() => {
    examApi
      .getAll()
      .then((r) => setExams((r.data as any).data?.exams || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Timer
  useEffect(() => {
    if (view === "taking" && activeExam && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [view, activeExam]);

  const generateExam = async () => {
    if (!genForm.subject) {
      toast.error("Subject is required");
      return;
    }
    setGenerating(true);
    try {
      const r = await examApi.generate(genForm);
      const exam = (r.data as any).data?.exam;
      setExams((prev) => [exam, ...prev]);
      toast.success("Exam generated!");
      setView("list");
    } catch {
      toast.error("Generation failed — check your API key and try again");
    } finally {
      setGenerating(false);
    }
  };

  const startExam = async (exam: ExamSession) => {
    try {
      const r = await examApi.start(exam._id);
      const started = (r.data as any).data?.exam || exam;
      setActiveExam(started);
      setAnswers({});
      setQIndex(0);
      setTimeLeft((started.timeLimitMinutes || 180) * 60);
      setView("taking");
    } catch {
      toast.error("Could not start exam");
    }
  };

  const handleSubmit = async () => {
    if (!activeExam) return;
    clearInterval(timerRef.current);
    const answerList = activeExam.questions.map((q, i) => ({
      questionId: q._id,
      questionText: q.text,
      type: q.type,
      userAnswer: answers[q._id] || "",
      timeTaken: 0,
    }));
    try {
      const r = await examApi.submit(activeExam._id, answerList);
      setResults((r.data as any).data);
      setExams((prev) =>
        prev.map((e) =>
          e._id === activeExam._id
            ? {
                ...e,
                status: "graded",
                percentage: (r.data as any).data?.exam?.percentage,
              }
            : e,
        ),
      );
      setView("results");
    } catch {
      toast.error("Submission failed");
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const currentQ: ExamQuestion | undefined = activeExam?.questions[qIndex];
  const timePercent = activeExam
    ? (timeLeft / (activeExam.timeLimitMinutes * 60)) * 100
    : 100;
  const gradeColor: Record<string, string> = {
    A: "var(--accent3)",
    B: "var(--accent)",
    C: "var(--accent2)",
    D: "var(--warn)",
    E: "var(--warn)",
    U: "var(--danger)",
  };

  if (loading)
    return (
      <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
        <Spinner size={32} />
      </div>
    );

  return (
    <div style={{ padding: 24, maxWidth: 1000 }} className="animate-fade-in">
      {view !== "taking" && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "var(--ink3)" }}>
            Exam Simulator
          </div>
          <h2
            style={{
              fontFamily: "'Lora',serif",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            AI Exam Simulator
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 4 }}>
            Full timed exams in ZIMSEC format with AI grading for every answer
            type.
          </p>
        </div>
      )}

      {/* LIST */}
      {view === "list" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <Button onClick={() => setView("generate")}>Generate Exam</Button>
          </div>
          {exams.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No exams yet"
              description="Generate your first full-length AI exam"
              action={
                <Button onClick={() => setView("generate")}>
                  Generate Exam
                </Button>
              }
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
                gap: 14,
              }}
            >
              {exams.map((e) => (
                <Card key={e._id} hoverable>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--ink)",
                      }}
                    >
                      {e.title}
                    </h3>
                    <Badge
                      variant={
                        e.status === "graded"
                          ? "green"
                          : e.status === "in_progress"
                            ? "amber"
                            : "blue"
                      }
                    >
                      {e.status}
                    </Badge>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--ink3)",
                      marginBottom: 8,
                    }}
                  >
                    {e.subject} · {e.totalMarks} marks · {e.timeLimitMinutes}min
                  </p>
                  {e.status === "graded" && e.percentage !== undefined && (
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontSize: 12, color: "var(--ink3)" }}>
                          Score
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: gradeColor[e.grade || "U"],
                          }}
                        >
                          {e.grade} — {e.percentage}%
                        </span>
                      </div>
                      <ProgressBar value={e.percentage} />
                    </div>
                  )}
                  {e.status !== "graded" && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => startExam(e)}
                    >
                      {e.status === "in_progress"
                        ? "Continue Exam"
                        : "Start Exam"}
                    </Button>
                  )}
                  {e.status === "graded" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setActiveExam(e);
                        setResults({ exam: e });
                        setView("results");
                      }}
                    >
                      View Results
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* GENERATE */}
      {view === "generate" && (
        <Card style={{ maxWidth: 520 }}>
          <h3
            style={{
              fontFamily: "'Lora',serif",
              fontSize: 17,
              fontWeight: 600,
              color: "var(--ink)",
              marginBottom: 20,
            }}
          >
            Generate AI Exam
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                style={{
                  fontSize: 13,
                  color: "var(--ink2)",
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                Subject *
              </label>
              <input
                className="input"
                placeholder="e.g. Mathematics"
                value={genForm.subject}
                onChange={(e) =>
                  setGenForm((f) => ({ ...f, subject: e.target.value }))
                }
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 13,
                    color: "var(--ink2)",
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  Year
                </label>
                <input
                  className="input"
                  value={genForm.year}
                  onChange={(e) =>
                    setGenForm((f) => ({ ...f, year: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    color: "var(--ink2)",
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  Paper
                </label>
                <select
                  className="input"
                  value={genForm.paper}
                  onChange={(e) =>
                    setGenForm((f) => ({ ...f, paper: e.target.value }))
                  }
                >
                  <option>Paper 1</option>
                  <option>Paper 2</option>
                  <option>Paper 3</option>
                </select>
              </div>
            </div>
            <div>
              <label
                style={{
                  fontSize: 13,
                  color: "var(--ink2)",
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                Total Marks: {genForm.totalMarks}
              </label>
              <input
                type="range"
                min={40}
                max={200}
                step={10}
                value={genForm.totalMarks}
                onChange={(e) =>
                  setGenForm((f) => ({ ...f, totalMarks: +e.target.value }))
                }
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 13,
                  color: "var(--ink2)",
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                Question Types
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["mcq", "short_answer", "essay"].map((qt) => (
                  <button
                    key={qt}
                    onClick={() =>
                      setGenForm((f) => ({
                        ...f,
                        questionTypes: f.questionTypes.includes(qt)
                          ? f.questionTypes.filter((x) => x !== qt)
                          : [...f.questionTypes, qt],
                      }))
                    }
                    style={{
                      padding: "6px 14px",
                      borderRadius: 7,
                      border: genForm.questionTypes.includes(qt)
                        ? "1.5px solid var(--accent)"
                        : "1px solid var(--border2)",
                      background: genForm.questionTypes.includes(qt)
                        ? "rgba(79,70,229,0.08)"
                        : "var(--card-bg)",
                      color: genForm.questionTypes.includes(qt)
                        ? "var(--accent)"
                        : "var(--ink2)",
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    {qt === "mcq"
                      ? "Multiple Choice"
                      : qt === "short_answer"
                        ? "Short Answer"
                        : "Essay"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={generateExam} loading={generating}>
                Generate Exam
              </Button>
              <Button variant="outline" onClick={() => setView("list")}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* TAKING */}
      {view === "taking" && activeExam && currentQ && (
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {/* Header bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              padding: "12px 16px",
              background: "var(--card-bg)",
              borderRadius: 10,
              border: "1px solid var(--border2)",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
              {activeExam.title}
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--ink2)" }}>
                Q {qIndex + 1} / {activeExam.questions.length}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background:
                    timeLeft < 300 ? "rgba(220,38,38,0.1)" : "var(--surface2)",
                  padding: "5px 12px",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 16 }}>⏱</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: timeLeft < 300 ? "var(--danger)" : "var(--ink)",
                    fontFamily: "monospace",
                  }}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Button size="sm" variant="danger" onClick={handleSubmit}>
                Submit Exam
              </Button>
            </div>
          </div>
          {/* Timer bar */}
          <div
            style={{
              height: 4,
              background: "var(--surface2)",
              borderRadius: 2,
              marginBottom: 20,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${timePercent}%`,
                background: timeLeft < 300 ? "var(--danger)" : "var(--accent)",
                transition: "width 1s linear, background 0.5s",
              }}
            />
          </div>
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <Badge
                variant={
                  currentQ.type === "mcq"
                    ? "blue"
                    : currentQ.type === "short_answer"
                      ? "amber"
                      : "purple"
                }
              >
                {currentQ.type === "mcq"
                  ? "Multiple Choice"
                  : currentQ.type === "short_answer"
                    ? "Short Answer"
                    : "Essay"}
              </Badge>
              <span style={{ fontSize: 13, color: "var(--ink3)" }}>
                {currentQ.marks} mark{currentQ.marks !== 1 ? "s" : ""}
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Lora',serif",
                fontSize: 16,
                fontWeight: 500,
                color: "var(--ink)",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              {currentQ.text}
            </p>

            {currentQ.type === "mcq" &&
              currentQ.options?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setAnswers((a) => ({ ...a, [currentQ._id]: opt }))
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 16px",
                    marginBottom: 8,
                    borderRadius: 8,
                    border:
                      answers[currentQ._id] === opt
                        ? "1.5px solid var(--accent)"
                        : "1.5px solid var(--border2)",
                    background:
                      answers[currentQ._id] === opt
                        ? "rgba(79,70,229,0.08)"
                        : "var(--card-bg)",
                    color:
                      answers[currentQ._id] === opt
                        ? "var(--accent)"
                        : "var(--ink)",
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                    fontWeight: answers[currentQ._id] === opt ? 500 : 400,
                  }}
                >
                  {opt}
                </button>
              ))}
            {(currentQ.type === "short_answer" ||
              currentQ.type === "essay") && (
              <textarea
                className="input"
                rows={currentQ.type === "essay" ? 12 : 4}
                placeholder={
                  currentQ.type === "essay"
                    ? "Write your essay answer here..."
                    : "Write your short answer here..."
                }
                value={answers[currentQ._id] || ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [currentQ._id]: e.target.value }))
                }
                style={{ resize: "vertical", lineHeight: 1.6 }}
              />
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 16,
              }}
            >
              <Button
                variant="outline"
                disabled={qIndex === 0}
                onClick={() => setQIndex((i) => i - 1)}
              >
                ← Previous
              </Button>
              {qIndex < activeExam.questions.length - 1 ? (
                <Button onClick={() => setQIndex((i) => i + 1)}>Next →</Button>
              ) : (
                <Button onClick={handleSubmit}>Submit Exam</Button>
              )}
            </div>
          </Card>
          {/* Question nav dots */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 16,
              justifyContent: "center",
            }}
          >
            {activeExam.questions.map((q, i) => (
              <button
                key={i}
                onClick={() => setQIndex(i)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  background:
                    i === qIndex
                      ? "var(--accent)"
                      : answers[q._id]
                        ? "var(--accent3)"
                        : "var(--surface2)",
                  color:
                    i === qIndex || answers[q._id] ? "white" : "var(--ink3)",
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RESULTS */}
      {view === "results" && results?.exam && (
        <div
          style={{ maxWidth: 700, margin: "0 auto" }}
          className="animate-fade-in"
        >
          <Card style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {results.exam.percentage >= 75
                ? "🎓"
                : results.exam.percentage >= 50
                  ? "📚"
                  : "💪"}
            </div>
            <h2
              style={{
                fontFamily: "'Lora',serif",
                fontSize: 36,
                fontWeight: 700,
                color: gradeColor[results.exam.grade] || "var(--ink)",
              }}
            >
              {results.exam.grade}
            </h2>
            <p style={{ fontSize: 18, color: "var(--ink)", marginBottom: 4 }}>
              {results.exam.percentage}% — {results.exam.earnedMarks}/
              {results.exam.totalMarks} marks
            </p>
            {results.xpEarned && (
              <p style={{ fontSize: 13, color: "var(--accent3)" }}>
                +{results.xpEarned} XP earned
              </p>
            )}
          </Card>
          {results.exam.aiFeedback && (
            <Card
              style={{
                marginBottom: 16,
                borderLeft: "3px solid var(--accent)",
                background: "var(--surface2)",
              }}
            >
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.7,
                  color: "var(--ink)",
                  fontStyle: "italic",
                }}
              >
                {results.exam.aiFeedback}
              </p>
            </Card>
          )}
          {results.exam.weakTopics?.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 10,
                }}
              >
                Topics to revise
              </h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {results.exam.weakTopics.map((t: string) => (
                  <Badge key={t} variant="amber">
                    {t}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Button onClick={() => setView("list")}>Back to Exams</Button>
            <Button variant="outline" onClick={() => setView("generate")}>
              New Exam
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. LEARNING PATH GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════
export const LearningPathPage: React.FC = () => {
  const { user } = useAuthStore();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    targetExamDate: "",
    hoursPerDay: 2,
  });

  useEffect(() => {
    learningPathApi
      .getAll()
      .then((r) => setPaths((r.data as any).data?.paths || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generate = async () => {
    if (!form.subject) {
      toast.error("Subject is required");
      return;
    }
    setGenerating(true);
    try {
      const r = await learningPathApi.generate(form);
      const path = (r.data as any).data?.path;
      setPaths((prev) => [
        path,
        ...prev.filter((p) => p.subject !== form.subject),
      ]);
      setActivePath(path);
      setShowForm(false);
      toast.success("Learning path generated!");
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const completeMilestone = async (pathId: string, milestoneId: string) => {
    try {
      const r = await learningPathApi.completeMilestone(pathId, milestoneId);
      const updated = (r.data as any).data?.path;
      setPaths((prev) => prev.map((p) => (p._id === pathId ? updated : p)));
      if (activePath?._id === pathId) setActivePath(updated);
      toast.success("Milestone completed! +50 XP");
    } catch {
      toast.error("Failed to mark complete");
    }
  };

  if (loading)
    return (
      <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
        <Spinner size={32} />
      </div>
    );

  return (
    <div style={{ padding: 24, maxWidth: 1000 }} className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "var(--ink3)" }}>Learning Path</div>
        <h2
          style={{
            fontFamily: "'Lora',serif",
            fontSize: 22,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          AI Learning Path Generator
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 4 }}>
          A personalised, milestone-by-milestone roadmap to exam readiness.
        </p>
      </div>

      {showForm && (
        <Card style={{ maxWidth: 480, marginBottom: 20 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "var(--ink)",
              marginBottom: 16,
            }}
          >
            Generate Learning Path
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--ink2)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Subject *
              </label>
              <input
                className="input"
                placeholder="e.g. Chemistry"
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--ink2)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Target Exam Date
              </label>
              <input
                className="input"
                type="date"
                value={form.targetExamDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, targetExamDate: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--ink2)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Study hours per day: {form.hoursPerDay}h
              </label>
              <input
                type="range"
                min={1}
                max={8}
                value={form.hoursPerDay}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hoursPerDay: +e.target.value }))
                }
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={generate} loading={generating}>
                Generate Path
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: activePath ? "260px 1fr" : "1fr",
          gap: 16,
        }}
      >
        {/* Path list */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <Button className="w-full" onClick={() => setShowForm(true)}>
              + New Path
            </Button>
          </div>
          {paths.length === 0 ? (
            <EmptyState
              icon="🗺️"
              title="No paths yet"
              description="Generate your first personalised learning path"
            />
          ) : (
            paths.map((path) => (
              <Card
                key={path._id}
                hoverable
                onClick={() => setActivePath(path)}
                style={{
                  marginBottom: 10,
                  borderColor:
                    activePath?._id === path._id
                      ? "var(--accent)"
                      : "var(--border2)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--ink)",
                    marginBottom: 4,
                  }}
                >
                  {path.subject}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--ink3)",
                    marginBottom: 8,
                  }}
                >
                  {path.milestones.length} milestones ·{" "}
                  {path.totalEstimatedHours}h
                </div>
                <ProgressBar value={path.completionPercentage} showPercent />
              </Card>
            ))
          )}
        </div>

        {/* Active path milestones */}
        {activePath && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3
                style={{
                  fontFamily: "'Lora',serif",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--ink)",
                  marginBottom: 4,
                }}
              >
                {activePath.title}
              </h3>
              <p
                style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 10 }}
              >
                {activePath.description}
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <StatCard
                  label="Completion"
                  value={`${activePath.completionPercentage}%`}
                />
                <StatCard
                  label="Total hours"
                  value={`${activePath.totalEstimatedHours}h`}
                />
                <StatCard
                  label="Milestones"
                  value={`${activePath.milestones.filter((m) => m.isCompleted).length}/${activePath.milestones.length}`}
                />
              </div>
            </div>
            <div style={{ position: "relative" }}>
              {activePath.milestones.map((m, i) => (
                <div
                  key={m._id}
                  style={{
                    display: "flex",
                    gap: 16,
                    marginBottom: 16,
                    opacity: m.isCompleted ? 0.7 : 1,
                  }}
                >
                  {/* Timeline */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 600,
                        background: m.isCompleted
                          ? "var(--accent3)"
                          : i === activePath.currentMilestoneIndex
                            ? "var(--accent)"
                            : "var(--surface2)",
                        color:
                          m.isCompleted ||
                          i === activePath.currentMilestoneIndex
                            ? "white"
                            : "var(--ink3)",
                        flexShrink: 0,
                      }}
                    >
                      {m.isCompleted ? "✓" : m.order}
                    </div>
                    {i < activePath.milestones.length - 1 && (
                      <div
                        style={{
                          width: 2,
                          flex: 1,
                          minHeight: 20,
                          background: m.isCompleted
                            ? "var(--accent3)"
                            : "var(--border2)",
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>
                  <Card
                    style={{
                      flex: 1,
                      padding: 16,
                      borderColor:
                        i === activePath.currentMilestoneIndex && !m.isCompleted
                          ? "var(--accent)"
                          : "var(--border2)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 6,
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "var(--ink)",
                            marginBottom: 2,
                          }}
                        >
                          {m.title}
                        </h4>
                        <span style={{ fontSize: 11.5, color: "var(--ink3)" }}>
                          {m.estimatedHours}h estimated · {m.masteryRequired}%
                          mastery required
                        </span>
                      </div>
                      {!m.isCompleted &&
                        i === activePath.currentMilestoneIndex && (
                          <Button
                            size="sm"
                            onClick={() =>
                              completeMilestone(activePath._id, m._id)
                            }
                          >
                            Mark Complete
                          </Button>
                        )}
                      {m.isCompleted && <Badge variant="green">Done</Badge>}
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--ink2)",
                        lineHeight: 1.5,
                        marginBottom: m.resources?.length ? 8 : 0,
                      }}
                    >
                      {m.description}
                    </p>
                    {m.resources?.length > 0 && (
                      <div
                        style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                      >
                        {m.resources.map((r, ri) => (
                          <Badge key={ri} variant="blue">
                            {r.description}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. POMODORO FOCUS MODE
// ═══════════════════════════════════════════════════════════════════════════════
type FocusPhase = "idle" | "work" | "break" | "long_break" | "reflection";

export const FocusModePage: React.FC = () => {
  const { user } = useAuthStore();
  const [phase, setPhase] = useState<FocusPhase>("idle");
  const [session, setSession] = useState<FocusSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [pomodorosThisRound, setPomodorosThisRound] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [historyStats, setHistoryStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiFeedback, setAiFeedback] = useState("");
  const [reflection, setReflection] = useState({
    accomplishments: "",
    obstacles: "",
    rating: 5,
  });
  const timerRef = useRef<any>(null);
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    goal: "",
    workMinutes: 25,
    breakMinutes: 5,
  });

  useEffect(() => {
    focusApi
      .getHistory()
      .then((r) => {
        setHistory((r.data as any).data?.sessions || []);
        setHistoryStats((r.data as any).data?.stats || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tick = useCallback(() => {
    setTimeLeft((t) => {
      if (t <= 1) {
        clearInterval(timerRef.current);
        phaseComplete();
        return 0;
      }
      return t - 1;
    });
  }, [phase, session, pomodorosThisRound]);

  useEffect(() => {
    if (phase === "work" || phase === "break" || phase === "long_break") {
      timerRef.current = setInterval(tick, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, tick]);

  const phaseComplete = async () => {
    if (phase === "work" && session) {
      const newCount = pomodorosThisRound + 1;
      setPomodorosThisRound(newCount);
      await focusApi.pomodoroComplete(session._id, session.workMinutes);
      toast.success(`Pomodoro ${newCount} complete!`);
      const isLongBreak =
        newCount % ((session as any).longBreakAfter || 4) === 0;
      setTimeLeft(
        isLongBreak ? session.longBreakMinutes * 60 : session.breakMinutes * 60,
      );
      setPhase(isLongBreak ? "long_break" : "break");
    } else if (phase === "break" || phase === "long_break") {
      if (session) await focusApi.breakComplete(session._id);
      setTimeLeft(form.workMinutes * 60);
      setPhase("work");
    }
  };

  const startSession = async () => {
    try {
      const r = await focusApi.start(form);
      const s = (r.data as any).data?.session;
      setSession(s);
      setTimeLeft(form.workMinutes * 60);
      setPomodorosThisRound(0);
      setPhase("work");
    } catch {
      toast.error("Could not start session");
    }
  };

  const logDistraction = async () => {
    if (!session) return;
    await focusApi.logDistraction(session._id);
    toast("Distraction logged", { icon: "⚠️" });
  };

  const endSession = (abandoned = false) => {
    clearInterval(timerRef.current);
    setPhase("reflection");
    if (abandoned) toast("Session ended early", { icon: "⚠️" });
  };

  const submitReflection = async () => {
    if (!session) return;
    try {
      const r = await focusApi.complete(session._id, {
        ...reflection,
        abandoned: phase !== "reflection",
      });
      const { feedback, focusScore, xpEarned } = (r.data as any).data;
      setAiFeedback(feedback);
      toast.success(
        `Session complete! Focus score: ${focusScore}/100 · +${xpEarned} XP`,
      );
      setHistory((prev) => [(r.data as any).data.session, ...prev]);
      setSession(null);
      setPhase("idle");
      setPomodorosThisRound(0);
    } catch {
      toast.error("Failed to save session");
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const phaseColors = {
    work: "var(--accent)",
    break: "var(--accent3)",
    long_break: "var(--accent2)",
    idle: "var(--ink3)",
    reflection: "var(--warn)",
  };
  const phaseLabels = {
    work: "Focus Time",
    break: "Short Break",
    long_break: "Long Break",
    idle: "Ready",
    reflection: "Reflect",
  };
  const totalSeconds =
    phase === "work"
      ? form.workMinutes * 60
      : phase === "long_break"
        ? 15 * 60
        : form.breakMinutes * 60;
  const progress = totalSeconds
    ? ((totalSeconds - timeLeft) / totalSeconds) * 100
    : 0;

  return (
    <div style={{ padding: 24, maxWidth: 900 }} className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "var(--ink3)" }}>Focus Mode</div>
        <h2
          style={{
            fontFamily: "'Lora',serif",
            fontSize: 22,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          Pomodoro Focus Mode
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 4 }}>
          Deep work sessions with AI analysis of your focus patterns.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Timer area */}
        <div>
          {/* Big timer circle */}
          <Card style={{ textAlign: "center", padding: 40, marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <Badge
                variant={
                  phase === "work"
                    ? "blue"
                    : phase === "break" || phase === "long_break"
                      ? "green"
                      : "amber"
                }
              >
                {phaseLabels[phase]}
              </Badge>
            </div>
            {/* SVG circular progress */}
            <div
              style={{
                position: "relative",
                width: 200,
                height: 200,
                margin: "0 auto 20px",
              }}
            >
              <svg
                width="200"
                height="200"
                style={{ transform: "rotate(-90deg)" }}
              >
                <circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="none"
                  stroke="var(--surface2)"
                  strokeWidth="12"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="none"
                  stroke={phaseColors[phase]}
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 42,
                    fontWeight: 700,
                    color: phaseColors[phase],
                  }}
                >
                  {formatTime(timeLeft)}
                </div>
                {session && (
                  <div
                    style={{ fontSize: 12, color: "var(--ink3)", marginTop: 4 }}
                  >
                    🍅 {pomodorosThisRound} done
                  </div>
                )}
              </div>
            </div>

            {phase === "idle" && (
              <Button
                className="w-full"
                onClick={startSession}
                style={{ maxWidth: 200 }}
              >
                Start Session
              </Button>
            )}
            {(phase === "work" ||
              phase === "break" ||
              phase === "long_break") && (
              <div
                style={{ display: "flex", gap: 10, justifyContent: "center" }}
              >
                {phase === "work" && (
                  <Button variant="outline" onClick={logDistraction}>
                    Log Distraction ⚠️
                  </Button>
                )}
                <Button variant="danger" onClick={() => endSession(true)}>
                  End Session
                </Button>
              </div>
            )}
            {phase === "reflection" && (
              <div style={{ textAlign: "left" }}>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--ink)",
                    marginBottom: 12,
                  }}
                >
                  Session Reflection
                </h3>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="What did you accomplish?"
                    value={reflection.accomplishments}
                    onChange={(e) =>
                      setReflection((r) => ({
                        ...r,
                        accomplishments: e.target.value,
                      }))
                    }
                  />
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Any obstacles or distractions?"
                    value={reflection.obstacles}
                    onChange={(e) =>
                      setReflection((r) => ({
                        ...r,
                        obstacles: e.target.value,
                      }))
                    }
                  />
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        color: "var(--ink2)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Session rating: {reflection.rating}/5
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={reflection.rating}
                      onChange={(e) =>
                        setReflection((r) => ({
                          ...r,
                          rating: +e.target.value,
                        }))
                      }
                      style={{ width: "100%" }}
                    />
                  </div>
                  <Button className="w-full" onClick={submitReflection}>
                    Save & Analyse
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {aiFeedback && (
            <Card
              style={{
                borderLeft: "3px solid var(--accent)",
                background: "var(--surface2)",
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.7,
                  color: "var(--ink)",
                  fontStyle: "italic",
                }}
              >
                {aiFeedback}
              </p>
            </Card>
          )}
        </div>

        {/* Setup + history */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {phase === "idle" && (
            <Card>
              <h4
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 10,
                }}
              >
                Session Setup
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <input
                  className="input"
                  placeholder="Subject"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                />
                <input
                  className="input"
                  placeholder="Topic (optional)"
                  value={form.topic}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, topic: e.target.value }))
                  }
                />
                <textarea
                  className="input"
                  rows={2}
                  placeholder="What's your goal for this session?"
                  value={form.goal}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, goal: e.target.value }))
                  }
                />
                <div>
                  <label style={{ fontSize: 12, color: "var(--ink3)" }}>
                    Work: {form.workMinutes}min
                  </label>
                  <input
                    type="range"
                    min={15}
                    max={60}
                    step={5}
                    value={form.workMinutes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, workMinutes: +e.target.value }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--ink3)" }}>
                    Break: {form.breakMinutes}min
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={15}
                    step={1}
                    value={form.breakMinutes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, breakMinutes: +e.target.value }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </Card>
          )}
          {historyStats?.totalPomodoros > 0 && (
            <Card>
              <h4
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 10,
                }}
              >
                All-time Stats
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {[
                  ["🍅", "Pomodoros", historyStats.totalPomodoros],
                  [
                    "⏱",
                    "Hours",
                    Math.round((historyStats.totalMinutes / 60) * 10) / 10,
                  ],
                  [
                    "🎯",
                    "Focus score",
                    `${Math.round(historyStats.avgFocusScore || 0)}%`,
                  ],
                  ["📅", "Sessions", historyStats.totalSessions],
                ].map(([icon, label, val]) => (
                  <div
                    key={label as string}
                    style={{
                      background: "var(--surface2)",
                      borderRadius: 8,
                      padding: 10,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 18 }}>{icon}</div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {val}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink3)" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {history.slice(0, 5).map((s) => (
            <div
              key={s._id}
              style={{
                padding: "8px 12px",
                background: "var(--surface2)",
                borderRadius: 8,
                fontSize: 12.5,
              }}
            >
              <div style={{ fontWeight: 500, color: "var(--ink)" }}>
                {s.subject || "General"}
              </div>
              <div style={{ color: "var(--ink3)" }}>
                {s.pomodorosCompleted} 🍅 · {s.totalFocusMinutes}min · Focus:{" "}
                {s.focusScore}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. AI ESSAY GRADER
// ═══════════════════════════════════════════════════════════════════════════════
export const EssayGraderPage: React.FC = () => {
  const { user } = useAuthStore();
  const [view, setView] = useState<"form" | "grading" | "result" | "history">(
    "form",
  );
  const [grades, setGrades] = useState<EssayGrade[]>([]);
  const [activeGrade, setActiveGrade] = useState<EssayGrade | null>(null);
  const [form, setForm] = useState({
    question: "",
    answer: "",
    subject: "",
    maxMarks: 20,
  });
  const [submitting, setSubmitting] = useState(false);
  const gradeColors: Record<string, string> = {
    A: "var(--accent3)",
    B: "var(--accent)",
    C: "var(--accent2)",
    D: "var(--warn)",
    E: "var(--warn)",
    U: "var(--danger)",
  };

  useEffect(() => {
    essayApi
      .getAll()
      .then((r) => setGrades((r.data as any).data?.grades || []))
      .catch(() => {});
  }, []);

  const submitEssay = async () => {
    if (!form.question || !form.answer) {
      toast.error("Question and answer are required");
      return;
    }
    if (form.answer.trim().split(" ").length < 30) {
      toast.error("Answer must be at least 30 words");
      return;
    }
    setSubmitting(true);
    setView("grading");
    try {
      const r = await essayApi.grade(form);
      const grade = (r.data as any).data?.grade;
      setActiveGrade(grade);
      setGrades((prev) => [grade, ...prev]);
      setView("result");
    } catch {
      toast.error("Grading failed");
      setView("form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 900 }} className="animate-fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "var(--ink3)" }}>Essay Grader</div>
          <h2
            style={{
              fontFamily: "'Lora',serif",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            AI Essay Grader
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 4 }}>
            Get instant ZIMSEC-style marking with detailed criteria feedback.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant={view === "form" ? "primary" : "outline"}
            onClick={() => setView("form")}
          >
            Grade Essay
          </Button>
          <Button
            variant={view === "history" ? "primary" : "outline"}
            onClick={() => setView("history")}
          >
            History ({grades.length})
          </Button>
        </div>
      </div>

      {view === "form" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}
        >
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--ink2)",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Subject
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. History"
                    value={form.subject}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, subject: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--ink2)",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Max Marks
                  </label>
                  <select
                    className="input"
                    value={form.maxMarks}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, maxMarks: +e.target.value }))
                    }
                  >
                    {[10, 15, 20, 25, 30].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink2)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Essay Question *
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Paste the essay question here..."
                  value={form.question}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, question: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink2)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Your Answer * (
                  {form.answer.trim().split(" ").filter(Boolean).length} words)
                </label>
                <textarea
                  className="input"
                  rows={16}
                  placeholder="Write or paste your essay answer here..."
                  value={form.answer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, answer: e.target.value }))
                  }
                  style={{ lineHeight: 1.7, resize: "vertical" }}
                />
              </div>
              <Button
                className="w-full"
                onClick={submitEssay}
                loading={submitting}
                disabled={submitting}
              >
                Grade My Essay
              </Button>
            </div>
          </Card>
          <Card>
            <h4
              style={{
                fontSize: 13.5,
                fontWeight: 500,
                color: "var(--ink)",
                marginBottom: 12,
              }}
            >
              Grading Criteria
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                [
                  "Content & Knowledge",
                  "50%",
                  "Accuracy and depth of subject knowledge",
                ],
                [
                  "Structure & Organisation",
                  "25%",
                  "Introduction, body, conclusion, flow",
                ],
                [
                  "Language & Expression",
                  "25%",
                  "Vocabulary, grammar, clarity",
                ],
              ].map(([c, p, d]) => (
                <div
                  key={c}
                  style={{
                    padding: 10,
                    background: "var(--surface2)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ink)",
                      }}
                    >
                      {c}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--accent)" }}>
                      {p}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--ink3)" }}>{d}</p>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: "rgba(79,70,229,0.06)",
                borderRadius: 8,
                borderLeft: "3px solid var(--accent)",
              }}
            >
              <p style={{ fontSize: 12.5, color: "var(--ink2)" }}>
                AI marks against ZIMSEC standards for your education level:{" "}
                <strong>{user?.educationLevel}</strong>
              </p>
            </div>
          </Card>
        </div>
      )}

      {view === "grading" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 80,
            gap: 16,
          }}
        >
          <Spinner size={40} />
          <p style={{ fontSize: 15, color: "var(--ink2)" }}>
            AI examiner is marking your essay...
          </p>
          <p style={{ fontSize: 13, color: "var(--ink3)" }}>
            Checking content, structure, and language quality
          </p>
        </div>
      )}

      {view === "result" && activeGrade && (
        <div className="animate-fade-in">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <Card style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  color: gradeColors[activeGrade.grade] || "var(--ink)",
                }}
              >
                {activeGrade.grade}
              </div>
              <div style={{ fontSize: 13, color: "var(--ink3)" }}>Grade</div>
            </Card>
            <Card style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: 32, fontWeight: 600, color: "var(--ink)" }}
              >
                {activeGrade.earnedMarks}
                <span style={{ fontSize: 18, color: "var(--ink3)" }}>
                  /{activeGrade.maxMarks}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--ink3)" }}>Marks</div>
            </Card>
            <Card style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: 32, fontWeight: 600, color: "var(--ink)" }}
              >
                {activeGrade.wordCount}
              </div>
              <div style={{ fontSize: 13, color: "var(--ink3)" }}>Words</div>
            </Card>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Card>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--ink)",
                    marginBottom: 12,
                  }}
                >
                  Marks Breakdown
                </h3>
                {activeGrade.criteria.map((c) => (
                  <div key={c.name} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 13, color: "var(--ink)" }}>
                        {c.name}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--accent)",
                        }}
                      >
                        {c.earnedMarks}/{c.maxMarks}
                      </span>
                    </div>
                    <ProgressBar value={c.earnedMarks} max={c.maxMarks} />
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--ink3)",
                        marginTop: 4,
                        lineHeight: 1.5,
                      }}
                    >
                      {c.feedback}
                    </p>
                  </div>
                ))}
              </Card>
              <Card>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--ink)",
                    marginBottom: 10,
                  }}
                >
                  Overall Feedback
                </h3>
                <p
                  style={{
                    fontSize: 13.5,
                    color: "var(--ink2)",
                    lineHeight: 1.7,
                  }}
                >
                  {activeGrade.overallFeedback}
                </p>
              </Card>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Card>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--accent3)",
                    marginBottom: 8,
                  }}
                >
                  ✓ Strengths
                </h3>
                {activeGrade.strengths.map((s, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 13,
                      color: "var(--ink2)",
                      marginBottom: 6,
                      paddingLeft: 12,
                      borderLeft: "2px solid var(--accent3)",
                    }}
                  >
                    {s}
                  </p>
                ))}
              </Card>
              <Card>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--warn)",
                    marginBottom: 8,
                  }}
                >
                  ↗ Improvements
                </h3>
                {activeGrade.improvements.map((s, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 13,
                      color: "var(--ink2)",
                      marginBottom: 6,
                      paddingLeft: 12,
                      borderLeft: "2px solid var(--warn)",
                    }}
                  >
                    {s}
                  </p>
                ))}
              </Card>
              {activeGrade.modelAnswer && (
                <Card>
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--ink)",
                      marginBottom: 8,
                    }}
                  >
                    Model Answer
                  </h3>
                  <p
                    style={{
                      fontSize: 12.5,
                      color: "var(--ink2)",
                      lineHeight: 1.7,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {activeGrade.modelAnswer}
                  </p>
                </Card>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  className="w-full"
                  onClick={() => {
                    setForm({
                      question: "",
                      answer: "",
                      subject: "",
                      maxMarks: 20,
                    });
                    setView("form");
                  }}
                >
                  Grade Another
                </Button>
                <Button variant="outline" onClick={() => setView("history")}>
                  History
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "history" &&
        (grades.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No essays graded yet"
            action={
              <Button onClick={() => setView("form")}>Grade an Essay</Button>
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {grades.map((g) => (
              <Card
                key={g._id}
                hoverable
                onClick={() => {
                  setActiveGrade(g);
                  setView("result");
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      background: "var(--surface2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 700,
                      color: gradeColors[g.grade] || "var(--ink)",
                      flexShrink: 0,
                    }}
                  >
                    {g.grade}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: "var(--ink)",
                        marginBottom: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.question.slice(0, 80)}...
                    </p>
                    <p style={{ fontSize: 12, color: "var(--ink3)" }}>
                      {g.subject || "General"} · {g.earnedMarks}/{g.maxMarks}{" "}
                      marks · {g.wordCount} words
                    </p>
                  </div>
                  <Badge
                    variant={
                      g.percentage >= 60
                        ? "green"
                        : g.percentage >= 40
                          ? "amber"
                          : "red"
                    }
                  >
                    {g.percentage}%
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. VOICE CHAT WITH AI TUTOR
// ═══════════════════════════════════════════════════════════════════════════════
export const VoiceTutorPage: React.FC = () => {
  const { user } = useAuthStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [processing, setProcessing] = useState(false);
  const [conversation, setConversation] = useState<
    Array<{ type: "user" | "ai"; text: string }>
  >([]);
  const [subject, setSubject] = useState("");
  const [language, setLanguage] = useState(
    user?.preferredLanguage || "english",
  );
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setSupported(false);
      return;
    }
    synthRef.current = window.speechSynthesis;
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang =
      language === "english" ? "en-ZW" : language === "shona" ? "sn" : "nd";

    recognition.onresult = (e: any) => {
      const t = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(t);
    };
    recognition.onend = () => {
      setIsListening(false);
      if (transcript) sendToAI(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Microphone error — check permissions");
    };
    recognitionRef.current = recognition;
  }, [language]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const startListening = () => {
    if (!supported) return;
    setTranscript("");
    setIsListening(true);
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  const sendToAI = async (text: string) => {
    if (!text.trim()) return;
    setConversation((c) => [...c, { type: "user", text }]);
    setTranscript("");
    setProcessing(true);
    try {
      const r = await voiceApi.process({ transcript: text, subject, language });
      const aiText = (r.data as any).data?.response || "";
      setConversation((c) => [...c, { type: "ai", text: aiText }]);
      setResponse(aiText);
      // Speak the response
      if (synthRef.current && aiText) {
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(aiText);
        utterance.lang = language === "english" ? "en-ZW" : "en";
        utterance.rate = 0.9;
        synthRef.current.speak(utterance);
      }
    } catch {
      toast.error("AI response failed");
    } finally {
      setProcessing(false);
    }
  };

  const stopSpeaking = () => synthRef.current?.cancel();

  if (!supported)
    return (
      <div style={{ padding: 40 }}>
        <Card style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎤</div>
          <h3
            style={{
              fontFamily: "'Lora',serif",
              fontSize: 18,
              color: "var(--ink)",
              marginBottom: 8,
            }}
          >
            Voice not supported
          </h3>
          <p style={{ color: "var(--ink3)", fontSize: 14 }}>
            Your browser doesn't support the Web Speech API. Try Chrome or Edge.
          </p>
        </Card>
      </div>
    );

  return (
    <div style={{ padding: 24, maxWidth: 800 }} className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "var(--ink3)" }}>Voice Tutor</div>
        <h2
          style={{
            fontFamily: "'Lora',serif",
            fontSize: 22,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          Voice Chat with AI Tutor
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 4 }}>
          Speak naturally — your AI tutor listens and responds in your language.
        </p>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 16 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Conversation */}
          <Card
            style={{
              height: 400,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: 16,
            }}
          >
            {conversation.length === 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 40 }}>🎙️</div>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--ink3)",
                    textAlign: "center",
                  }}
                >
                  Press the microphone and start talking.
                  <br />
                  Ask anything about your subjects.
                </p>
              </div>
            )}
            {conversation.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignSelf: msg.type === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  flexDirection: msg.type === "user" ? "row-reverse" : "row",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background:
                      msg.type === "ai" ? "var(--accent)" : "var(--surface2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: msg.type === "ai" ? "white" : "var(--ink2)",
                    flexShrink: 0,
                  }}
                >
                  {msg.type === "ai" ? "Dz" : "🎤"}
                </div>
                <div
                  style={{
                    background:
                      msg.type === "user" ? "var(--accent)" : "var(--surface2)",
                    color: msg.type === "user" ? "white" : "var(--ink)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {processing && (
              <div
                style={{ display: "flex", gap: 10, alignSelf: "flex-start" }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: "white",
                  }}
                >
                  Dz
                </div>
                <div
                  style={{
                    background: "var(--surface2)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    display: "flex",
                    gap: 4,
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="animate-pulse-soft"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--ink3)",
                        display: "inline-block",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={conversationEndRef} />
          </Card>

          {/* Transcript preview */}
          {(isListening || transcript) && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--surface2)",
                borderRadius: 8,
                border: isListening
                  ? "1.5px solid var(--accent)"
                  : "1px solid var(--border2)",
                fontSize: 13.5,
                color: "var(--ink2)",
                minHeight: 44,
              }}
            >
              {isListening && !transcript && (
                <span
                  className="animate-pulse-soft"
                  style={{ color: "var(--danger)" }}
                >
                  ● Listening...
                </span>
              )}
              {transcript && <span>{transcript}</span>}
            </div>
          )}

          {/* Mic button */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={processing}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: "none",
                cursor: processing ? "not-allowed" : "pointer",
                background: isListening ? "var(--danger)" : "var(--accent)",
                color: "white",
                fontSize: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isListening
                  ? "0 0 0 8px rgba(220,38,38,0.2)"
                  : "0 4px 20px rgba(79,70,229,0.3)",
                transition: "all 0.2s",
              }}
            >
              {processing ? "⏳" : isListening ? "⏹" : "🎤"}
            </button>
            <button
              onClick={stopSpeaking}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--border2)",
                background: "var(--card-bg)",
                color: "var(--ink2)",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              Stop Speaking
            </button>
          </div>
          <p
            style={{ textAlign: "center", fontSize: 12, color: "var(--ink3)" }}
          >
            {isListening
              ? "Listening — click ⏹ when done"
              : "Click 🎤 to speak"}
          </p>

          {/* Text fallback */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Or type your question..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendToAI(transcript)}
            />
            <Button
              onClick={() => sendToAI(transcript)}
              disabled={!transcript.trim() || processing}
            >
              Send
            </Button>
          </div>
        </div>

        {/* Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <h4
              style={{
                fontSize: 13.5,
                fontWeight: 500,
                color: "var(--ink)",
                marginBottom: 10,
              }}
            >
              Settings
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--ink3)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Subject
                </label>
                <input
                  className="input"
                  style={{ fontSize: 13 }}
                  placeholder="e.g. Physics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--ink3)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Language
                </label>
                {(["english", "shona", "ndebele"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() =>
                      setLanguage(l as "english" | "shona" | "ndebele")
                    }
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "7px 10px",
                      marginBottom: 4,
                      borderRadius: 7,
                      border:
                        language === l
                          ? "1.5px solid var(--accent)"
                          : "1px solid var(--border2)",
                      background:
                        language === l
                          ? "rgba(79,70,229,0.08)"
                          : "var(--card-bg)",
                      color: language === l ? "var(--accent)" : "var(--ink2)",
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </Card>
          <Card>
            <h4
              style={{
                fontSize: 13.5,
                fontWeight: 500,
                color: "var(--ink)",
                marginBottom: 8,
              }}
            >
              Tips
            </h4>
            <div
              style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.7 }}
            >
              <p>• Speak clearly and at normal pace</p>
              <p>• Ask one question at a time</p>
              <p>• Say "explain" for detailed answers</p>
              <p>• Say "example" for worked examples</p>
              <p>• Works in English, Shona, Ndebele</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. PAST PAPER BANK (uploads + analysis)
// ═══════════════════════════════════════════════════════════════════════════════
export const PastPapersPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24, maxWidth: 900 }} className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "var(--ink3)" }}>Past Papers</div>
        <h2
          style={{
            fontFamily: "'Lora',serif",
            fontSize: 22,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          Past Paper Bank
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 4 }}>
          Upload past papers, extract questions, and practice with AI-graded
          responses.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          {
            icon: "📄",
            title: "Upload Past Paper",
            desc: "Upload any ZIMSEC past paper PDF and AI extracts all questions",
            action: () => navigate({ to: "/documents" }),
            label: "Upload Paper",
            color: "var(--accent)",
          },
          {
            icon: "📝",
            title: "Take Simulated Exam",
            desc: "AI generates a new exam in the style of ZIMSEC past papers",
            action: () => navigate({ to: "/exam-simulator" }),
            label: "Generate Exam",
            color: "var(--accent2)",
          },
          {
            icon: "✍️",
            title: "Grade Your Answers",
            desc: "Write answers to past paper questions and get AI marking",
            action: () => navigate({ to: "/essay-grader" }),
            label: "Grade Answer",
            color: "var(--accent3)",
          },
        ].map((item) => (
          <Card
            key={item.title}
            hoverable
            onClick={item.action}
            style={{ textAlign: "center", padding: 24, cursor: "pointer" }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--ink)",
                marginBottom: 8,
              }}
            >
              {item.title}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--ink3)",
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              {item.desc}
            </p>
            <Button size="sm" style={{ background: item.color }}>
              {item.label}
            </Button>
          </Card>
        ))}
      </div>
      <Card
        style={{
          background: "rgba(79,70,229,0.06)",
          borderColor: "var(--accent)",
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
            marginBottom: 8,
          }}
        >
          How the Past Paper workflow works
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 12,
          }}
        >
          {[
            ["1. Upload", "Upload your past paper PDF to Documents"],
            [
              "2. AI Extracts",
              "AI extracts questions, mark schemes, and topic tags",
            ],
            [
              "3. Practice",
              "Use questions in quizzes or write full essay answers",
            ],
            ["4. Get Graded", "AI marks your answers using the mark scheme"],
          ].map(([step, desc]) => (
            <div key={step} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--accent)",
                  marginBottom: 4,
                }}
              >
                {step}
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--ink2)",
                  lineHeight: 1.5,
                }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. CODE PRACTICE SANDBOX
// ═══════════════════════════════════════════════════════════════════════════════
export const CodeSandboxPage: React.FC = () => {
  const { user } = useAuthStore();
  const [code, setCode] = useState(
    '# Write your Python code here\nprint("Hello, DzidzaAI!")',
  );
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [aiReview, setAiReview] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [challenge, setChallenge] = useState<any>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);

  const LANGUAGES = [
    {
      id: "python",
      label: "Python",
      default: '# Write your Python code here\nprint("Hello, DzidzaAI!")',
    },
    {
      id: "javascript",
      label: "JavaScript",
      default:
        '// Write your JavaScript here\nconsole.log("Hello, DzidzaAI!");',
    },
    {
      id: "java",
      label: "Java",
      default:
        'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, DzidzaAI!");\n  }\n}',
    },
  ];

  // Run code using Judge0 CE (free public API)
  const runCode = async () => {
    setRunning(true);
    setOutput("Running...");
    try {
      const langIds: Record<string, number> = {
        python: 71,
        javascript: 63,
        java: 62,
      };
      const submitRes = await fetch(
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            "X-RapidAPI-Key": "SIGN_UP_FOR_KEY", // user needs their own key
          },
          body: JSON.stringify({
            source_code: code,
            language_id: langIds[language] || 71,
          }),
        },
      );
      const result = await submitRes.json();
      setOutput(
        result.stdout || result.stderr || result.compile_output || "No output",
      );
    } catch {
      setOutput(
        "⚠️ Code execution requires a Judge0 API key.\n\nTo enable:\n1. Sign up at rapidapi.com/judge0-official\n2. Add VITE_JUDGE0_KEY to your .env\n3. Replace the API key in CodeSandboxPage\n\nYou can still use AI Code Review below!",
      );
    } finally {
      setRunning(false);
    }
  };

  const getAIReview = async () => {
    setReviewing(true);
    try {
      const r = await voiceApi.process({
        transcript: `Please review this ${language} code and give constructive feedback:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nCheck for: correctness, efficiency, style, and best practices. Keep feedback brief and educational.`,
        subject: "Computer Science",
        language: "english",
      });
      setAiReview((r.data as any).data?.response || "");
    } catch {
      toast.error("AI review failed");
    } finally {
      setReviewing(false);
    }
  };

  const getChallenge = async () => {
    setLoadingChallenge(true);
    try {
      const r = await voiceApi.process({
        transcript: `Give me a ${user?.educationLevel || "O-Level"} Computer Science coding challenge in ${language}. Format: \n**Challenge:** [title]\n**Difficulty:** [Easy/Medium/Hard]\n**Description:** [problem statement]\n**Example Input:** [example]\n**Expected Output:** [example]\n\nKeep it achievable in 10-20 lines of code.`,
        subject: "Computer Science",
      });
      setChallenge((r.data as any).data?.response || "");
      setCode(LANGUAGES.find((l) => l.id === language)?.default || "");
    } catch {
      toast.error("Failed to get challenge");
    } finally {
      setLoadingChallenge(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100 }} className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "var(--ink3)" }}>Code Sandbox</div>
        <h2
          style={{
            fontFamily: "'Lora',serif",
            fontSize: 22,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          Code Practice Sandbox
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 4 }}>
          Write, run, and get AI feedback on your code. Perfect for Computer
          Science students.
        </p>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}
      >
        <div>
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLanguage(l.id as "english" | "shona" | "ndebele");
                  setCode(l.default);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  border:
                    language === l.id
                      ? "1.5px solid var(--accent)"
                      : "1px solid var(--border2)",
                  background:
                    language === l.id
                      ? "rgba(79,70,229,0.08)"
                      : "var(--card-bg)",
                  color: language === l.id ? "var(--accent)" : "var(--ink2)",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "monospace",
                  fontWeight: 500,
                }}
              >
                {l.label}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <Button
                size="sm"
                variant="outline"
                onClick={getChallenge}
                loading={loadingChallenge}
              >
                🎲 Get Challenge
              </Button>
              <Button size="sm" onClick={runCode} loading={running}>
                ▶ Run Code
              </Button>
            </div>
          </div>
          {/* Editor */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            style={{
              width: "100%",
              minHeight: 320,
              padding: "14px 16px",
              fontFamily: "'Courier New',Courier,monospace",
              fontSize: 14,
              lineHeight: 1.6,
              background: "#1e1e2e",
              color: "#cdd6f4",
              border: "1px solid var(--border2)",
              borderRadius: 10,
              outline: "none",
              resize: "vertical",
              tabSize: 4,
              whiteSpace: "pre",
            }}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                setCode(
                  code.substring(0, start) + "    " + code.substring(end),
                );
                setTimeout(() => {
                  e.currentTarget.selectionStart =
                    e.currentTarget.selectionEnd = start + 4;
                }, 0);
              }
            }}
          />
          {/* Output */}
          <div
            style={{
              marginTop: 10,
              background: "#1e1e2e",
              borderRadius: 8,
              padding: "12px 14px",
              minHeight: 80,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#6c7086",
                marginBottom: 6,
                fontFamily: "monospace",
              }}
            >
              OUTPUT
            </div>
            <pre
              style={{
                fontFamily: "monospace",
                fontSize: 13,
                color: output.startsWith("⚠️") ? "#f38ba8" : "#a6e3a1",
                margin: 0,
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}
            >
              {output || "No output yet — click Run Code"}
            </pre>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {challenge && (
            <Card
              style={{
                background: "rgba(79,70,229,0.06)",
                borderColor: "var(--accent)",
              }}
            >
              <h4
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "var(--accent)",
                  marginBottom: 8,
                }}
              >
                Current Challenge
              </h4>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--ink2)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {challenge}
              </p>
            </Card>
          )}
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <h4
                style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}
              >
                AI Code Review
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={getAIReview}
                loading={reviewing}
              >
                Review
              </Button>
            </div>
            {aiReview ? (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--ink2)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {aiReview}
              </p>
            ) : (
              <p style={{ fontSize: 13, color: "var(--ink3)" }}>
                Write some code and click Review for AI feedback on correctness,
                style, and efficiency.
              </p>
            )}
          </Card>
          <Card>
            <h4
              style={{
                fontSize: 13.5,
                fontWeight: 500,
                color: "var(--ink)",
                marginBottom: 8,
              }}
            >
              Quick Reference
            </h4>
            <div
              style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.8 }}
            >
              <p>
                <kbd
                  style={{
                    background: "var(--surface2)",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  Tab
                </kbd>{" "}
                Indent code
              </p>
              <p>
                <kbd
                  style={{
                    background: "var(--surface2)",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  ▶ Run
                </kbd>{" "}
                Execute code
              </p>
              <p>
                <kbd
                  style={{
                    background: "var(--surface2)",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  🎲
                </kbd>{" "}
                New challenge
              </p>
              <p>
                <kbd
                  style={{
                    background: "var(--surface2)",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  Review
                </kbd>{" "}
                AI feedback
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 8. COLLABORATIVE WHITEBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export const WhiteboardPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser" | "line" | "rect" | "text">(
    "pen",
  );
  const [color, setColor] = useState("#4f46e5");
  const [size, setSize] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);

  const COLORS = [
    "#1e1e2e",
    "#4f46e5",
    "#7c3aed",
    "#059669",
    "#d97706",
    "#dc2626",
    "#0ea5e9",
    "#ec4899",
    "#ffffff",
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, []);

  const getPos = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    setHistoryIndex((i) => {
      const newIdx = i - 1;
      ctx.putImageData(history[newIdx], 0, 0);
      return newIdx;
    });
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    setHistoryIndex((i) => {
      const newIdx = i + 1;
      ctx.putImageData(history[newIdx], 0, 0);
      return newIdx;
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "text") {
      const pos = getPos(e);
      setTextPos(pos);
      return;
    }
    setIsDrawing(true);
    const pos = getPos(e);
    lastPos.current = pos;
    startPos.current = pos;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);

    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "pen") {
      ctx.strokeStyle = color;
      ctx.globalCompositeOperation = "source-over";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
    } else if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = size * 4;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
    }
  };

  const endDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);

    if ((tool === "line" || tool === "rect") && startPos.current) {
      ctx.putImageData(history[historyIndex], 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.globalCompositeOperation = "source-over";
      if (tool === "line") {
        ctx.moveTo(startPos.current.x, startPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else {
        ctx.strokeRect(
          startPos.current.x,
          startPos.current.y,
          pos.x - startPos.current.x,
          pos.y - startPos.current.y,
        );
      }
    }
    setIsDrawing(false);
    saveState();
  };

  const addText = () => {
    if (!textPos || !textInput || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.font = `${size * 6}px 'DM Sans', sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textInput, textPos.x, textPos.y);
    setTextInput("");
    setTextPos(null);
    saveState();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current!;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "dzidzaai-whiteboard.png";
    a.click();
  };

  const TOOLS = [
    { id: "pen", icon: "✏️", label: "Pen" },
    { id: "eraser", icon: "⬜", label: "Eraser" },
    { id: "line", icon: "╱", label: "Line" },
    { id: "rect", icon: "□", label: "Rectangle" },
    { id: "text", icon: "T", label: "Text" },
  ] as const;

  return (
    <div style={{ padding: 24, maxWidth: 1200 }} className="animate-fade-in">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "var(--ink3)" }}>Whiteboard</div>
        <h2
          style={{
            fontFamily: "'Lora',serif",
            fontSize: 22,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          Collaborative Whiteboard
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 4 }}>
          Draw diagrams, work through problems, and share your thinking
          visually.
        </p>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 10,
          alignItems: "center",
          flexWrap: "wrap",
          padding: "10px 14px",
          background: "var(--card-bg)",
          borderRadius: 10,
          border: "1px solid var(--border2)",
        }}
      >
        {/* Tools */}
        <div style={{ display: "flex", gap: 4 }}>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id as any)}
              title={t.label}
              style={{
                width: 34,
                height: 34,
                borderRadius: 7,
                border:
                  tool === t.id
                    ? "1.5px solid var(--accent)"
                    : "1px solid var(--border2)",
                background:
                  tool === t.id ? "rgba(79,70,229,0.1)" : "var(--card-bg)",
                cursor: "pointer",
                fontSize: t.id === "text" ? 13 : 16,
                fontWeight: t.id === "text" ? 700 : 400,
                color: tool === t.id ? "var(--accent)" : "var(--ink2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {t.icon}
            </button>
          ))}
        </div>
        {/* Separator */}
        <div style={{ width: 1, height: 30, background: "var(--border2)" }} />
        {/* Colors */}
        <div style={{ display: "flex", gap: 4 }}>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: c,
                border:
                  color === c
                    ? "2.5px solid var(--accent)"
                    : "1.5px solid var(--border2)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
        {/* Size */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--ink3)" }}>Size</span>
          <input
            type="range"
            min={1}
            max={20}
            value={size}
            onChange={(e) => setSize(+e.target.value)}
            style={{ width: 80 }}
          />
          <span style={{ fontSize: 12, color: "var(--ink3)", width: 20 }}>
            {size}
          </span>
        </div>
        {/* Actions */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            onClick={undo}
            style={{
              padding: "6px 12px",
              borderRadius: 7,
              border: "1px solid var(--border2)",
              background: "var(--card-bg)",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--ink2)",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            ↩ Undo
          </button>
          <button
            onClick={redo}
            style={{
              padding: "6px 12px",
              borderRadius: 7,
              border: "1px solid var(--border2)",
              background: "var(--card-bg)",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--ink2)",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            ↪ Redo
          </button>
          <button
            onClick={clearCanvas}
            style={{
              padding: "6px 12px",
              borderRadius: 7,
              border: "1px solid var(--border2)",
              background: "var(--card-bg)",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--danger)",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Clear
          </button>
          <Button size="sm" onClick={downloadCanvas}>
            ↓ Save
          </Button>
        </div>
      </div>

      {/* Text input overlay */}
      {textPos && (
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            className="input"
            placeholder="Type text and press Add..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addText()}
            autoFocus
            style={{ flex: 1, maxWidth: 300 }}
          />
          <Button size="sm" onClick={addText}>
            Add Text
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTextPos(null)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Canvas */}
      <div
        style={{
          border: "1px solid var(--border2)",
          borderRadius: 10,
          overflow: "hidden",
          background: "white",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: 560,
            display: "block",
            cursor:
              tool === "eraser"
                ? "cell"
                : tool === "text"
                  ? "text"
                  : "crosshair",
            touchAction: "none",
          }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={() => {
            if (isDrawing) endDraw({ clientX: 0, clientY: 0 } as any);
          }}
        />
      </div>
      <p
        style={{
          fontSize: 12,
          color: "var(--ink3)",
          marginTop: 8,
          textAlign: "center",
        }}
      >
        Click Text tool then click on canvas to place text · Download saves as
        PNG
      </p>
    </div>
  );
};
