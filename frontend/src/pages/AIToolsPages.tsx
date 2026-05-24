import { useNavigate } from "@tanstack/react-router";
import { clsx } from "clsx";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Copy,
  Info,
  MousePointer2,
  Pencil,
  Search,
  Settings,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Spinner,
} from "../components/ui";
import { aiApi } from "../services/apiServices";
import { useAuthStore } from "../store/authStore";

type Tool = "explain" | "practice" | "notes";
// ═══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE GAPS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const KnowledgeGapsPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const subjects = user?.subjects?.map((s) => s.name) || [];

  const analyse = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const r = await aiApi.knowledgeGaps(subject || undefined);
      setAnalysis((r.data as any).data?.analysis);
    } catch {
      toast.error("Analysis failed — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-serif text-ink mb-2">
            Knowledge Gap Analysis
          </h2>
          <p className="text-sm text-ink3 font-medium">
            AI-driven diagnostics of your academic performance
          </p>
        </div>
      </div>

      {/* Diagnostic Control */}
      <Card className="p-8 shadow-2xl border-primary/10 bg-surface">
        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Search size={18} className="text-primary" />
              <label className="text-xs font-black text-ink3 uppercase tracking-widest">
                Select Subject Domain
              </label>
            </div>
            <select
              className="input text-sm font-bold bg-bg"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">Full Academic Portfolio Analysis</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <Button
            size="lg"
            onClick={analyse}
            loading={loading}
            className="px-10 gap-2 shadow-xl shrink-0"
          >
            <BrainCircuit size={20} /> Run Analysis
          </Button>
        </div>
      </Card>

      {loading && (
        <div className="py-20 flex flex-col items-center gap-6">
          <div className="relative">
            <Spinner size={48} className="text-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot size={20} className="text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold font-serif text-ink">
              Analyzing Learning Patterns
            </h3>
            <p className="text-xs font-bold text-ink3 uppercase tracking-[0.2em] animate-pulse">
              Cross-referencing quiz performance · projecting exam readiness
            </p>
          </div>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">
          {/* Strategy Highlight */}
          <Card className="bg-primary text-white p-10 border-none shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Target size={40} className="text-white" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                  Personalized Intervention Strategy
                </p>
                <h3 className="text-xl font-bold font-serif italic leading-relaxed">
                  "{analysis.studyStrategy}"
                </h3>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-secondary opacity-30 rounded-full blur-[100px] pointer-events-none" />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Critical Hub */}
            <Card className="border-t-4 border-t-red-500 h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                  <AlertTriangle size={16} /> Critical Gaps
                </h3>
                <Badge variant="red" className="rounded-lg">
                  {analysis.criticalGaps?.length || 0}
                </Badge>
              </div>
              <div className="space-y-2">
                {analysis.criticalGaps?.length > 0 ? (
                  analysis.criticalGaps.map((t: string) => (
                    <div
                      key={t}
                      className="p-3 rounded-xl bg-red-500/3 border border-red-500/5 flex items-center justify-between group hover:border-red-500/20 transition-all cursor-pointer"
                    >
                      <span className="text-xs font-bold text-ink2">{t}</span>
                      <ChevronRight
                        size={12}
                        className="text-red-300 group-hover:text-red-500"
                      />
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={<CheckCircle2 size={24} />}
                    title="All Clear"
                    description="No critical gaps identified in this domain."
                  />
                )}
              </div>
            </Card>

            {/* Moderate Hub */}
            <Card className="border-t-4 border-t-warn h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-warn flex items-center gap-2">
                  <Info size={16} /> Moderate Gaps
                </h3>
                <Badge variant="amber" className="rounded-lg">
                  {analysis.moderateGaps?.length || 0}
                </Badge>
              </div>
              <div className="space-y-2">
                {analysis.moderateGaps?.map((t: string) => (
                  <div
                    key={t}
                    className="p-3 rounded-xl bg-warn/[0.03] border border-warn/5 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-ink2">{t}</span>
                    <ChevronRight size={12} className="text-warn/30" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Strength Hub */}
            <Card className="border-t-4 border-t-secondary h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                  <Trophy size={16} /> Proficiencies
                </h3>
                <Badge variant="teal" className="rounded-lg">
                  {analysis.strongAreas?.length || 0}
                </Badge>
              </div>
              <div className="space-y-2">
                {analysis.strongAreas?.map((t: string) => (
                  <div
                    key={t}
                    className="p-3 rounded-xl bg-secondary/3 border border-secondary/5 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-ink2">{t}</span>
                    <CheckCircle2 size={12} className="text-secondary" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI TOOLS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const AIToolsPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<Tool>("explain");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [practiceProblems, setPracticeProblems] = useState<any[]>([]);
  const [revealedSolutions, setRevealedSolutions] = useState<Set<number>>(
    new Set(),
  );
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [concept, setConcept] = useState("");
  const [explainStyle, setExplainStyle] = useState<
    "standard" | "eli5" | "exam" | "visual"
  >("standard");
  const [problemCount, setProblemCount] = useState(5);
  const [includesSolutions, setIncludesSolutions] = useState(true);

  const subjects = user?.subjects?.map((s) => s.name) || [];

  const runTool = async () => {
    setLoading(true);
    setResult("");
    setPracticeProblems([]);
    setRevealedSolutions(new Set());
    setRevealedHints(new Set());

    try {
      if (activeTool === "explain") {
        if (!concept) {
          toast.error("Specify a concept");
          setLoading(false);
          return;
        }
        const r = await aiApi.explain({
          concept,
          subject,
          style: explainStyle,
          language: user?.preferredLanguage,
        });
        setResult((r.data as any).data?.explanation || "");
      } else if (activeTool === "practice") {
        if (!topic || !subject) {
          toast.error("Domain parameters missing");
          setLoading(false);
          return;
        }
        const r = await aiApi.practiceProblems({
          topic,
          subject,
          count: problemCount,
          includeWorkedSolution: includesSolutions,
        });
        setPracticeProblems((r.data as any).data?.problems || []);
      } else if (activeTool === "notes") {
        if (!topic || !subject) {
          toast.error("Domain parameters missing");
          setLoading(false);
          return;
        }
        const r = await aiApi.studyNotes({
          topic,
          subject,
          language: user?.preferredLanguage,
        });
        setResult((r.data as any).data?.notes || "");
      }
    } catch {
      toast.error("Generation sequence failed");
    } finally {
      setLoading(false);
    }
  };

  const TOOLS: any[] = [
    {
      id: "explain",
      icon: <BrainCircuit size={24} />,
      label: "Concept Explainer",
      desc: "Clear, curriculum-aligned explanations",
    },
    {
      id: "practice",
      icon: <Pencil size={24} />,
      label: "Active Recall",
      desc: "Generate practice problems with hints and worked solutions",
    },
    {
      id: "notes",
      icon: <BookOpen size={24} />,
      label: "Intelligent Notes",
      desc: "Concise, structured study notes",
    },
  ];

  const EXPLAIN_STYLES = [
    { id: "standard", label: "Standard", desc: "Curriculum aligned" },
    { id: "eli5", label: "Foundational", desc: "Simplified logic" },
    { id: "exam", label: "Exam Ready", desc: "ZIMSEC scoring focus" },
    { id: "visual", label: "Visual Hub", desc: "Structured blueprints" },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-serif text-ink mb-2">
            Intelligent Learning Labs
          </h2>
          <p className="text-sm text-ink3 font-medium">
            Use AI to create explanations, practice problems, and structured
            notes
          </p>
        </div>
      </div>

      <Card className="p-6 border-border2 bg-surface shadow-xl">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <BrainCircuit size={18} />,
              title: "Explain complex ideas",
              text: "Turn any concept into a structured explanation with a preferred tone, subject context, and language.",
            },
            {
              icon: <Pencil size={18} />,
              title: "Practice with purpose",
              text: "Generate guided problems with hints and worked solutions that can be archived to your lab journal.",
            },
            {
              icon: <BookOpen size={18} />,
              title: "Capture better notes",
              text: "Create concise study notes that keep the same structure and terminology across different topics.",
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTool(t.id);
              setResult("");
              setPracticeProblems([]);
            }}
            className={clsx(
              "p-6 rounded-3xl text-left transition-all duration-300 border-2 group",
              activeTool === t.id
                ? "bg-primary text-white border-primary shadow-2xl scale-[1.03]"
                : "bg-surface border-border2 hover:border-primary/30",
            )}
          >
            <div
              className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg",
                activeTool === t.id
                  ? "bg-white/20"
                  : "bg-primary/10 text-primary",
              )}
            >
              {t.icon}
            </div>
            <h4 className="text-lg font-bold mb-1">{t.label}</h4>
            <p
              className={clsx(
                "text-xs font-medium",
                activeTool === t.id ? "text-white/70" : "text-ink3",
              )}
            >
              {t.desc}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8 items-start">
        <Card className="sticky top-24">
          <h3 className="text-lg font-bold font-serif text-ink mb-6 flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            Lab Configuration
          </h3>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-ink3 uppercase tracking-widest px-1">
                Academic Domain
              </label>
              <select
                className="input text-xs font-bold"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {activeTool === "explain" ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-ink3 uppercase tracking-widest px-1">
                  Specific Concept
                </label>
                <Input
                  placeholder="e.g. Quantum tunneling"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                />

                <div className="pt-4 space-y-3">
                  <label className="text-[10px] font-black text-ink3 uppercase tracking-widest px-1">
                    Synthesis Logic
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {EXPLAIN_STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setExplainStyle(s.id)}
                        className={clsx(
                          "p-3 rounded-xl border text-[10px] font-black uppercase text-left transition-all",
                          explainStyle === s.id
                            ? "bg-secondary text-white border-secondary"
                            : "bg-bg border-border2 text-ink2 hover:bg-surface2",
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-ink3 uppercase tracking-widest px-1">
                  Target Topic
                </label>
                <Input
                  placeholder="e.g. Colonial History"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            )}

            <Button
              size="lg"
              className="w-full gap-2 shadow-lg mt-4"
              onClick={runTool}
              loading={loading}
            >
              <Zap size={16} /> Execute Synthesis
            </Button>
          </div>
        </Card>

        <div className="min-h-100">
          {loading ? (
            <Card className="h-full flex flex-col items-center justify-center py-32 border-dashed">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Bot
                  size={24}
                  className="absolute inset-0 m-auto text-primary"
                />
              </div>
              <p className="text-sm font-bold text-ink uppercase tracking-widest animate-pulse">
                Consulting AI Knowledge Base...
              </p>
            </Card>
          ) : result ? (
            <Card className="prose dark:prose-invert max-w-none shadow-2xl animate-in fade-in duration-500 relative">
              <div className="absolute top-6 right-6 flex gap-2 no-prose">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                    toast.success("Content copied");
                  }}
                >
                  <Copy size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/whiteboard" })}
                >
                  <MousePointer2 size={14} />
                </Button>
              </div>

              <div className="text-ink leading-loose text-sm font-medium space-y-6">
                {result.split("\n").map((line, i) => {
                  if (line.startsWith("# "))
                    return (
                      <h1
                        key={i}
                        className="text-3xl font-black font-serif border-b-2 border-primary/10 pb-4 mb-8"
                      >
                        {line.slice(2)}
                      </h1>
                    );
                  if (line.startsWith("## "))
                    return (
                      <h2
                        key={i}
                        className="text-xl font-bold font-serif text-primary mt-10 mb-4"
                      >
                        {line.slice(3)}
                      </h2>
                    );
                  if (line.startsWith("### "))
                    return (
                      <h3
                        key={i}
                        className="text-lg font-bold text-secondary mt-8 mb-2 uppercase tracking-widest"
                      >
                        {line.slice(4)}
                      </h3>
                    );
                  if (line.startsWith("- ") || line.startsWith("• "))
                    return (
                      <div key={i} className="flex gap-3 pl-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2.5 shrink-0" />
                        <p className="m-0">{line.slice(2)}</p>
                      </div>
                    );
                  if (line === "") return <div key={i} className="h-4" />;
                  return (
                    <p key={i} className="m-0">
                      {line}
                    </p>
                  );
                })}
              </div>
            </Card>
          ) : practiceProblems.length > 0 ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              {practiceProblems.map((prob, i) => (
                <Card
                  key={i}
                  className="group hover:border-primary/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xs">
                        {i + 1}
                      </div>
                      <Badge
                        variant={
                          prob.difficulty === "hard"
                            ? "red"
                            : prob.difficulty === "easy"
                              ? "green"
                              : "amber"
                        }
                      >
                        {prob.difficulty}
                      </Badge>
                    </div>
                    <span className="text-[10px] font-black text-ink3 uppercase tracking-widest">
                      {prob.marks || 5} Points
                    </span>
                  </div>
                  <p className="text-lg font-bold text-ink font-serif leading-relaxed mb-8">
                    {prob.question}
                  </p>

                  <div className="space-y-3">
                    {prob.hints?.length > 0 && (
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <button
                          onClick={() =>
                            setRevealedHints((prev) => new Set(prev).add(i))
                          }
                          className={clsx(
                            "text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2",
                            revealedHints.has(i) && "mb-3 pointer-events-none",
                          )}
                        >
                          <Sparkles size={14} />{" "}
                          {revealedHints.has(i)
                            ? "Strategy Hints"
                            : "Acquire Hint"}
                        </button>
                        {revealedHints.has(i) &&
                          prob.hints.map((h: string, hi: number) => (
                            <p
                              key={hi}
                              className="text-xs font-medium text-ink2 leading-relaxed ml-6 list-item"
                            >
                              {h}
                            </p>
                          ))}
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10">
                      <button
                        onClick={() =>
                          setRevealedSolutions((prev) => new Set(prev).add(i))
                        }
                        className={clsx(
                          "text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-2",
                          revealedSolutions.has(i) &&
                            "mb-3 pointer-events-none",
                        )}
                      >
                        <CheckCircle2 size={14} />{" "}
                        {revealedSolutions.has(i)
                          ? "System Solution"
                          : "Verify with AI"}
                      </button>
                      {revealedSolutions.has(i) && (
                        <p className="text-sm font-semibold text-ink leading-relaxed ml-6 border-l-2 border-secondary/30 pl-4 italic">
                          "{prob.solution}"
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] group"
                onClick={() => toast.success("Workspace saved")}
              >
                <Copy size={18} className="mr-3 group-hover:text-primary" />{" "}
                Archive to Lab Journal
              </Button>
            </div>
          ) : (
            <EmptyState
              icon={<Bot size={48} />}
              title="Ready to Start"
              description="Provide a subject and topic, then choose a tool to generate explanations, practice problems, or notes."
            />
          )}
        </div>
      </div>
    </div>
  );
};
