import { useNavigate } from "@tanstack/react-router";
import { clsx } from "clsx";
import {
  Activity,
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  Calendar,
  Clock,
  FileText,
  Flame,
  LogOut,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  ProgressBar,
  Spinner,
  StatCard,
} from "../components/ui";
import {
  analyticsApi,
  authApi,
  documentApi,
  flashcardApi,
  partnerApi,
  timetableApi,
  userApi,
} from "../services/apiServices";
import { useAuthStore } from "../store/authStore";

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const AnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [educationStats, setEducationStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .getOverview()
      .then((r) => setOverview((r.data as any).data))
      .catch(() => {})
      .finally(() => setLoading(false));

    // load education-level analytics for admins
    analyticsApi
      .getEducation()
      .then((r) => setEducationStats((r.data as any).data))
      .catch(() => {});
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size={40} className="text-primary" />
      </div>
    );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-serif text-ink mb-2">
            Learning Analytics
          </h2>
          <p className="text-sm text-ink3 font-medium">
            Deep insights into your academic performance
          </p>
        </div>
        <Badge variant="teal" className="gap-1.5">
          <Activity size={12} /> Live Updates
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Study Time"
          value={`${overview?.totalHoursThisMonth || 0}h`}
          icon={<Clock size={20} />}
          sub={`${overview?.sessionCount || 0} sessions this month`}
          subColor="neutral"
        />
        <StatCard
          label="Knowledge Index"
          value={`${overview?.avgQuizScore || 0}%`}
          icon={<Target size={20} />}
          sub="Average quiz performance"
          subColor="neutral"
        />
        <StatCard
          label="Flashcards Due"
          value={overview?.flashcardsDue || 0}
          icon={<BookOpenText size={20} />}
          sub={
            overview?.flashcardsDue > 0
              ? "Review session required"
              : "Curriculum mastered"
          }
          subColor={overview?.flashcardsDue > 5 ? "down" : "up"}
        />
        <StatCard
          label="Current Streak"
          value={`${overview?.streak?.current || 0}d`}
          icon={<Flame size={20} />}
          sub={`Best: ${overview?.streak?.longest || 0} days`}
          subColor="up"
        />
      </div>

      {educationStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-bold mb-3">Education Levels</h3>
            <ul className="space-y-2 text-sm text-ink2">
              {(educationStats.educationLevels || []).map((row: any) => (
                <li key={row._id} className="flex justify-between">
                  <span>{row._id || "Unknown"}</span>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="text-lg font-bold mb-3">Top Subjects</h3>
            <ul className="space-y-2 text-sm text-ink2">
              {(educationStats.subjectCounts || []).map((row: any) => (
                <li key={row._id} className="flex justify-between">
                  <span>{row._id}</span>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card className="flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold font-serif text-ink flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Weekly Commitment
            </h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink3">
                <div className="w-2 h-2 rounded-full bg-primary" /> Current
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink3">
                <div className="w-2 h-2 rounded-full bg-primary/20" /> Average
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between gap-2 min-h-40 px-2">
            {(overview?.weeklyHours || []).map((d: any) => {
              const maxH = Math.max(
                ...(overview?.weeklyHours || []).map((x: any) => x.hours),
                1,
              );
              const h = Math.max(8, Math.round((d.hours / maxH) * 120));
              const isToday =
                d.day ===
                new Date().toLocaleDateString("en-US", { weekday: "short" });

              return (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center gap-3 group"
                >
                  <div className="relative w-full flex flex-col items-center">
                    <div
                      className={clsx(
                        "w-full max-w-8 rounded-t-xl transition-all duration-500",
                        isToday
                          ? "bg-primary shadow-lg"
                          : "bg-primary/10 group-hover:bg-primary/30",
                      )}
                      style={{ height: `${h}px` }}
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-ink text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg pointer-events-none shadow-xl">
                      {d.hours}h
                    </div>
                  </div>
                  <span
                    className={clsx(
                      "text-xs font-bold tracking-tight",
                      isToday ? "text-primary" : "text-ink3",
                    )}
                  >
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Readiness per subject */}
        <Card>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold font-serif text-ink flex items-center gap-2">
              <Trophy size={18} className="text-secondary" />
              Syllabus Readiness
            </h3>
            <Badge variant="purple">Exam Prep</Badge>
          </div>

          <div className="space-y-6">
            {(overview?.examReadiness || []).map((s: any) => (
              <div key={s.subject} className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-bold text-ink">
                    {s.subject}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                        s.status === "on_track"
                          ? "bg-secondary/10 text-secondary"
                          : s.status === "needs_work"
                            ? "bg-primary/10 text-primary"
                            : "bg-warn/10 text-warn",
                      )}
                    >
                      {s.status.replace("_", " ")}
                    </span>
                    <span className="text-xs font-black text-ink">
                      {s.readiness}%
                    </span>
                  </div>
                </div>
                <ProgressBar
                  value={s.readiness}
                  className="gap-0!"
                  color={
                    s.status === "on_track"
                      ? "var(--color-secondary)"
                      : s.status === "needs_work"
                        ? "var(--color-primary)"
                        : "var(--color-accent)"
                  }
                />
              </div>
            ))}
            {(!overview?.examReadiness ||
              overview.examReadiness.length === 0) && (
              <EmptyState
                icon={<Search size={24} />}
                title="No Exam Data"
                description="Complete more quizzes to allow AI to project your exam readiness."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FLASHCARDS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const FlashcardsPage: React.FC = () => {
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [dueCards, setDueCards] = useState<any[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCard, setNewCard] = useState({ front: "", back: "", subject: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [allRes, dueRes] = await Promise.all([
        flashcardApi.getAll(),
        flashcardApi.getDue(),
      ]);
      setFlashcards((allRes.data as any).data?.flashcards || []);
      setDueCards((dueRes.data as any).data?.flashcards || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReview = async (quality: number) => {
    const card = dueCards[reviewIndex];
    try {
      await flashcardApi.review(card._id, quality);
      setFlipped(false);
      if (reviewIndex < dueCards.length - 1) {
        setReviewIndex((i) => i + 1);
      } else {
        setReviewing(false);
        setReviewIndex(0);
        toast.success("Review session complete!");
        load();
      }
    } catch {
      toast.error("Failed to save review");
    }
  };

  const createCard = async () => {
    if (!newCard.front || !newCard.back) {
      toast.error("Front and back are required");
      return;
    }
    try {
      await flashcardApi.create(newCard);
      toast.success("Flashcard created");
      setNewCard({ front: "", back: "", subject: "" });
      setCreating(false);
      load();
    } catch {
      toast.error("Failed to create");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size={40} className="text-primary" />
      </div>
    );

  const currentCard = dueCards[reviewIndex];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-serif text-ink mb-2">
            Spaced Repetition
          </h2>
          <p className="text-sm text-ink3 font-medium">
            Science-backed memorization for long-term mastery
          </p>
        </div>
        <div className="flex gap-3">
          {dueCards.length > 0 && !reviewing && (
            <Button
              onClick={() => setReviewing(true)}
              className="gap-2 shadow-lg"
            >
              <BrainCircuit size={18} /> Review {dueCards.length} Due
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setCreating(true)}
            className="gap-2"
          >
            <Plus size={18} /> New Card
          </Button>
        </div>
      </div>

      {/* Review mode */}
      {reviewing && currentCard ? (
        <div className="max-w-xl mx-auto animate-in zoom-in-95 duration-500">
          <ProgressBar
            value={((reviewIndex + 1) / dueCards.length) * 100}
            className="mb-6"
            label={`Reviewing ${reviewIndex + 1} of ${dueCards.length}`}
          />

          <div
            onClick={() => setFlipped(!flipped)}
            className={clsx(
              "group relative min-h-80 rounded-3xl border-2 border-border2 bg-surface cursor-pointer p-10 flex flex-col items-center justify-center text-center transition-all duration-500 shadow-2xl overflow-hidden",
              flipped
                ? "border-secondary/30 ring-4 ring-secondary/5"
                : "hover:border-primary/50",
            )}
          >
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Badge variant={flipped ? "teal" : "blue"}>
                {flipped ? "Solution" : "Term"}
              </Badge>
            </div>

            <div className="space-y-6 relative z-10">
              <p className="text-[10px] font-black text-ink3 uppercase tracking-[0.2em] mb-4">
                {flipped ? "Adaptive Reveal" : "Active Recall"}
              </p>
              <h3 className="text-2xl font-bold font-serif text-ink leading-relaxed">
                {flipped ? currentCard.back : currentCard.front}
              </h3>
              {!flipped && (
                <div className="pt-8 animate-pulse text-primary font-bold text-xs uppercase tracking-widest">
                  Tap to flip
                </div>
              )}
            </div>

            {/* Background design */}
            <div
              className={clsx(
                "absolute inset-0 bg-surface opacity-[0.03] pointer-events-none transition-all duration-500",
                flipped ? "opacity-[0.04]" : "opacity-[0.03]",
              )}
            />
          </div>

          {flipped && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
              {[
                {
                  q: 0,
                  label: "Forgot",
                  color: "bg-red-500",
                  text: "text-red-500",
                },
                { q: 2, label: "Hard", color: "bg-warn", text: "text-warn" },
                {
                  q: 4,
                  label: "Good",
                  color: "bg-primary",
                  text: "text-primary",
                },
                {
                  q: 5,
                  label: "Easy",
                  color: "bg-secondary",
                  text: "text-secondary",
                },
              ].map(({ q, label, color, text }) => (
                <button
                  key={q}
                  onClick={() => handleReview(q)}
                  className={clsx(
                    "p-4 rounded-2xl border-2 border-border2 bg-surface hover:shadow-xl transition-all font-bold text-xs uppercase tracking-widest",
                    text,
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              onClick={() => setReviewing(false)}
              className="text-ink3 hover:text-ink font-bold text-[10px] uppercase tracking-widest"
            >
              Exit Review Session
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Create card */}
          {creating && (
            <Card className="max-w-xl mx-auto shadow-2xl animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-bold font-serif text-ink mb-6">
                New Adaptive Flashcard
              </h3>
              <div className="space-y-4">
                <textarea
                  className="input min-h-25 resize-none"
                  placeholder="Front Side (Question, Term, or Concept)"
                  value={newCard.front}
                  onChange={(e) =>
                    setNewCard((f) => ({ ...f, front: e.target.value }))
                  }
                />
                <textarea
                  className="input min-h-25 resize-none"
                  placeholder="Back Side (Answer, Definition, or Explanation)"
                  value={newCard.back}
                  onChange={(e) =>
                    setNewCard((f) => ({ ...f, back: e.target.value }))
                  }
                />
                <Input
                  placeholder="Subject Tag (e.g. History)"
                  value={newCard.subject}
                  onChange={(e) =>
                    setNewCard((f) => ({ ...f, subject: e.target.value }))
                  }
                />
                <div className="pt-4 flex gap-3">
                  <Button className="flex-1" onClick={createCard}>
                    Save Card
                  </Button>
                  <Button variant="ghost" onClick={() => setCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Card list */}
          {flashcards.length === 0 ? (
            <EmptyState
              icon={<BookOpenText size={40} />}
              title="No knowledge cards found"
              description="Upload documents to auto-generate cards or create them manually."
              action={
                <Button onClick={() => setCreating(true)} size="lg">
                  Create First Card
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashcards.map((card) => (
                <Card
                  key={card._id}
                  className="group hover:border-primary/30 transition-all flex flex-col justify-between h-full"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      {card.subject ? (
                        <Badge variant="blue">{card.subject}</Badge>
                      ) : (
                        <div />
                      )}
                      {card.aiGenerated && (
                        <Badge variant="purple" className="gap-1.5">
                          <Sparkles size={10} /> AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-bold text-ink leading-relaxed line-clamp-3">
                      {card.front}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border2 flex justify-between items-center">
                    <p className="text-[10px] font-black text-ink3 uppercase tracking-widest">
                      Recall:{" "}
                      {new Date(card.nextReviewDate).toLocaleDateString()}
                    </p>
                    <button className="text-ink3 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENTS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [askDoc, setAskDoc] = useState<any>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    documentApi
      .getAll()
      .then((r) => setDocuments((r.data as any).data?.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const uploadWithSignedUrl = async (file: File, title: string) => {
    const fileType = file.name.split(".").pop()?.toLowerCase() || "txt";
    const initRes = await documentApi.initUpload({
      title,
      originalName: file.name,
      fileType,
      fileSize: file.size,
      contentType: file.type || "application/octet-stream",
    });

    const { uploadUrl, document } = (initRes.data as any).data;
    if (!uploadUrl || !document?._id) {
      throw new Error("Signed upload is unavailable");
    }

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!putRes.ok) {
      throw new Error("Object storage upload failed");
    }

    await documentApi.completeUpload({ documentId: document._id });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", file.name.replace(/\.[^/.]+$/, ""));
    setUploading(true);
    try {
      try {
        await uploadWithSignedUrl(file, file.name.replace(/\.[^/.]+$/, ""));
      } catch {
        await documentApi.upload(fd);
      }
      toast.success("File uploaded! AI is analyzing content...");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAsk = async () => {
    if (!question || !askDoc) return;
    setAsking(true);
    try {
      const res = await documentApi.ask(askDoc._id, question);
      setAnswer((res.data as any).data?.answer || "");
    } catch {
      toast.error("Failed to get answer");
    } finally {
      setAsking(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size={40} className="text-primary" />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-serif text-ink mb-2">
            Knowledge Vault
          </h2>
          <p className="text-sm text-ink3 font-medium">
            Upload study materials for AI-powered insights
          </p>
        </div>
        <Button
          onClick={() => fileRef.current?.click()}
          loading={uploading}
          className="gap-2 shadow-lg"
        >
          <Paperclip size={18} /> Upload Document
        </Button>
      </div>

      {/* Upload Dropzone */}
      <Card
        className="group border-2 border-dashed border-border2 bg-surface/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer p-12 text-center"
        onClick={() => fileRef.current?.click()}
      >
        <div className="w-16 h-16 rounded-3xl bg-surface2 text-primary mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
          <FileText size={32} />
        </div>
        <h3 className="text-lg font-bold text-ink mb-2">
          Interactive Study Materials
        </h3>
        <p className="text-sm text-ink3 max-w-sm mx-auto mb-8 leading-relaxed">
          Upload PDF or TXT textbooks, past papers, or personal notes. Our AI
          will index them for instant Q&A and card generation.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="blue">PDF</Badge>
          <Badge variant="teal">TXT</Badge>
          <Badge variant="purple">DOCX</Badge>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.docx"
          onChange={handleUpload}
          className="hidden"
        />
      </Card>

      {/* Document Grid */}
      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} />}
          title="No documents yet"
          description="Build your knowledge base by uploading your first document."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc._id}
              className={clsx(
                "p-0 overflow-hidden border-border2 transition-all",
                askDoc?._id === doc._id && "ring-2 ring-primary border-primary",
              )}
            >
              <div className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                <div
                  className={clsx(
                    "w-14 h-16 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-soft",
                    doc.fileType === "pdf"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  <FileText size={24} />
                  <span className="text-[9px] font-black uppercase mt-1">
                    {doc.fileType || "DOC"}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-ink truncate mb-1">
                    {doc.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <p className="text-[10px] font-black text-ink3 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={10} />{" "}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                    {doc.flashcardsGenerated > 0 && (
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles size={10} /> {doc.flashcardsGenerated} Cards
                        Generated
                      </p>
                    )}
                    <p className="text-[10px] font-black text-ink3 uppercase tracking-widest">
                      {(doc.fileSize / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      doc.status === "ready"
                        ? "green"
                        : doc.status === "processing"
                          ? "amber"
                          : doc.status === "error"
                            ? "red"
                            : "blue"
                    }
                    className="font-bold"
                  >
                    {doc.status}
                  </Badge>
                  {doc.downloadUrl && (
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink3 hover:text-primary transition-colors p-2 rounded-lg border border-border2"
                      title="Open document"
                    >
                      <ArrowRight size={14} />
                    </a>
                  )}
                  {doc.status === "ready" && (
                    <Button
                      variant={askDoc?._id === doc._id ? "primary" : "outline"}
                      size="sm"
                      onClick={() => {
                        setAskDoc(askDoc?._id === doc._id ? null : doc);
                        setAnswer("");
                        setQuestion("");
                      }}
                      className="gap-2"
                    >
                      <MessageCircle size={14} /> Ask AI
                    </Button>
                  )}
                </div>
              </div>

              {askDoc?._id === doc._id && (
                <div className="p-6 bg-surface2/50 border-t border-border2 animate-in slide-in-from-top-4 duration-300">
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="relative group">
                      <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-ink3 group-focus-within:text-primary transition-colors"
                        size={18}
                      />
                      <input
                        className="w-full bg-surface border border-border2 rounded-2xl py-4 pl-12 pr-20 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                        placeholder="Inquire about this document..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                      />
                      <Button
                        size="sm"
                        onClick={handleAsk}
                        loading={asking}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        Ask
                      </Button>
                    </div>

                    {answer && (
                      <div className="p-6 rounded-2xl bg-surface border border-border2 shadow-soft animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 rounded-lg bg-secondary/10 text-secondary">
                            <Sparkles size={16} />
                          </div>
                          <p className="text-[10px] font-black text-ink uppercase tracking-widest">
                            AI Extraction Result
                          </p>
                        </div>
                        <p className="text-sm font-medium text-ink2 leading-relaxed whitespace-pre-wrap italic">
                          "{answer}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STUDY PARTNERS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const PartnersPage: React.FC = () => {
  type PartnerTab =
    | "suggestions"
    | "requests"
    | "partners"
    | "groups"
    | "discover";
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PartnerTab>("suggestions");
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      partnerApi.getSuggestions(),
      partnerApi.getRequests(),
      partnerApi.getPartners(),
      partnerApi.getGroups(),
      partnerApi.discoverGroups(),
    ])
      .then(([s, r, p, g, d]) => {
        setSuggestions((s.data as any).data?.suggestions || []);
        setRequests((r.data as any).data?.requests || []);
        setPartners((p.data as any).data?.partners || []);
        setGroups((g.data as any).data?.groups || []);
        setDiscoverGroups((d.data as any).data?.groups || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const connect = async (userId: string) => {
    setSending(userId);
    try {
      await partnerApi.sendRequest(userId);
      toast.success("Connection request sent!");
      setSuggestions((s) => s.filter((x) => x.user._id !== userId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setSending(null);
    }
  };

  const respondToRequest = async (
    id: string,
    action: "accepted" | "declined",
  ) => {
    setSending(id);
    try {
      await partnerApi.respond(id, action);
      setRequests((prev) => prev.filter((request) => request._id !== id));
      if (action === "accepted") {
        const matched = requests.find((request) => request._id === id);
        if (matched) {
          setPartners((prev) => [
            {
              _id: matched._id,
              requester: matched.requester,
              recipient: matched.recipient,
              sharedSubjects: matched.sharedSubjects,
            },
            ...prev,
          ]);
        }
      }
      toast.success(
        action === "accepted" ? "Request accepted" : "Request declined",
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to respond");
    } finally {
      setSending(null);
    }
  };

  const joinGroup = async (id: string) => {
    setSending(id);
    try {
      await partnerApi.joinGroup(id);
      setDiscoverGroups((prev) => prev.filter((group) => group._id !== id));
      const refreshed = await partnerApi.getGroups();
      setGroups((refreshed.data as any).data?.groups || []);
      toast.success("Joined group");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to join group");
    } finally {
      setSending(null);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size={40} className="text-primary" />
      </div>
    );

  const TABS: Array<{ id: PartnerTab; label: string }> = [
    { id: "suggestions", label: "Matched Suggestions" },
    {
      id: "requests",
      label: `Requests${requests.length ? ` (${requests.length})` : ""}`,
    },
    { id: "partners", label: "Active Partners" },
    { id: "groups", label: "Study Guilds" },
    { id: "discover", label: "Discover" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-serif text-ink mb-2">
            Connect & Collaborate
          </h2>
          <p className="text-sm text-ink3 font-medium">
            AI-driven matching based on your academic profile
          </p>
        </div>
        <Badge variant="blue" className="gap-1.5">
          <ShieldCheck size={12} /> Privacy Guaranteed
        </Badge>
      </div>

      <div className="flex gap-2 p-1.5 bg-surface2 rounded-2xl w-fit border border-border2 shadow-inner">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300",
              tab === t.id
                ? "bg-surface text-primary shadow-lg border border-border2"
                : "text-ink3 hover:text-ink hover:bg-surface/50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "suggestions" &&
        (suggestions.length === 0 ? (
          <EmptyState
            icon={<UsersRound size={40} />}
            title="No matches found"
            description="Deepen your learning profile by adding more subjects to find suitable study partners."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map(({ user: u, score, sharedSubjects }: any) => (
              <Card
                key={u._id}
                className="group hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center text-xl font-bold border border-primary/10 shadow-soft group-hover:scale-110 transition-transform">
                    {u.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-lg font-bold text-ink truncate">
                        {u.name}
                      </h4>
                      <span className="text-[10px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded-md uppercase tracking-widest">
                        {score}% Match
                      </span>
                    </div>
                    <p className="text-xs font-bold text-ink3 uppercase tracking-tighter mb-4">
                      {u.educationLevel}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {sharedSubjects.slice(0, 3).map((s: string) => (
                        <Badge key={s} variant="blue" className="text-[9px]">
                          {s}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => connect(u._id)}
                      loading={sending === u._id}
                      className="w-full gap-2"
                    >
                      <Plus size={14} /> Send Connection Request
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}

      {tab === "requests" &&
        (requests.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={40} />}
            title="No pending requests"
            description="Incoming study partner requests will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((request: any) => (
              <Card
                key={request._id}
                className="group hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center text-xl font-bold border border-primary/10 shadow-soft group-hover:scale-110 transition-transform">
                    {request.requester?.name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-lg font-bold text-ink truncate">
                        {request.requester?.name || "Study partner"}
                      </h4>
                      <span className="text-[10px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded-md uppercase tracking-widest">
                        {request.matchScore || 0}% Match
                      </span>
                    </div>
                    <p className="text-xs font-bold text-ink3 uppercase tracking-tighter mb-4">
                      {request.requester?.educationLevel || "Student"}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {(request.sharedSubjects || [])
                        .slice(0, 3)
                        .map((subject: string) => (
                          <Badge
                            key={subject}
                            variant="blue"
                            className="text-[9px]"
                          >
                            {subject}
                          </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          respondToRequest(request._id, "accepted")
                        }
                        loading={sending === request._id}
                        className="flex-1 gap-2"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          respondToRequest(request._id, "declined")
                        }
                        loading={sending === request._id}
                        className="flex-1 gap-2"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}

      {tab === "partners" &&
        (partners.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            title="No active partners"
            description="Your connections will appear here once requests are accepted."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.map((p: any) => {
              const pUser =
                p.requester._id !== useAuthStore.getState().user?._id
                  ? p.requester
                  : p.recipient;
              return (
                <Card
                  key={p._id}
                  className="flex items-center gap-5 hover:border-secondary/30 transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xl font-bold border border-secondary/10">
                    {pUser.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-ink">{pUser.name}</h4>
                    <p className="text-xs font-medium text-ink3 truncate">
                      {p.sharedSubjects?.join(", ") || "General Learning"}
                    </p>
                  </div>
                  <Badge variant="teal">Connected</Badge>
                </Card>
              );
            })}
          </div>
        ))}

      {tab === "groups" &&
        (groups.length === 0 ? (
          <EmptyState
            icon={<BookOpenText size={40} />}
            title="No study guilds"
            description="Collaborate with multiple students by forming or joining a guild."
            action={
              <Button
                size="lg"
                onClick={async () => {
                  const name = prompt("Enter Guild Name:");
                  if (name) {
                    await partnerApi.createGroup({ name });
                    const g = await partnerApi.getGroups();
                    setGroups((g.data as any).data?.groups || []);
                  }
                }}
              >
                Establish Study Guild
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g: any) => (
              <Card key={g._id} hoverable className="group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                    <UsersRound size={24} />
                  </div>
                  <Badge variant="purple">
                    {g.members?.length || 0} Members
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-ink mb-1">{g.name}</h3>
                {g.subject && <Badge variant="blue">{g.subject}</Badge>}
              </Card>
            ))}
          </div>
        ))}

      {tab === "discover" &&
        (discoverGroups.length === 0 ? (
          <EmptyState
            icon={<UsersRound size={40} />}
            title="No open groups"
            description="Create a group or wait for others to open theirs to discovery."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoverGroups.map((group: any) => (
              <Card key={group._id} hoverable className="group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                    <UsersRound size={24} />
                  </div>
                  <Badge variant="purple">
                    {group.members?.length || 0} Members
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-ink mb-1">
                  {group.name}
                </h3>
                <p className="text-xs text-ink3 mb-3">
                  {group.description || "Open study guild"}
                </p>
                {group.subject && <Badge variant="blue">{group.subject}</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => joinGroup(group._id)}
                  loading={sending === group._id}
                  className="w-full mt-6 border-t border-border2 rounded-none pt-4 text-primary font-bold"
                >
                  Join Guild <ArrowRight size={14} className="ml-1" />
                </Button>
              </Card>
            ))}
          </div>
        ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIMETABLE PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const TimetablePage: React.FC = () => {
  const [timetable, setTimetable] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  const load = () => {
    timetableApi
      .get()
      .then((r) => setTimetable((r.data as any).data?.timetable))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const optimize = async () => {
    if (!timetable) return;
    setOptimizing(true);
    try {
      const res = await timetableApi.optimize(timetable._id);
      setTimetable((res.data as any).data?.timetable);
      toast.success("Schedule optimized by AI!");
    } catch {
      toast.error("Optimization failed");
    } finally {
      setOptimizing(false);
    }
  };

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const TIMES = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
  ];

  const slotStyles: Record<string, { bg: string; text: string }> = {
    study: { bg: "bg-primary/10", text: "text-primary" },
    school: { bg: "bg-secondary/10", text: "text-secondary" },
    revision: { bg: "bg-purple-500/10", text: "text-purple-500" },
    rest: { bg: "bg-surface2", text: "text-ink3" },
    spaced_repetition: { bg: "bg-warn/10", text: "text-warn" },
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Spinner size={40} className="text-primary" />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-serif text-ink mb-2">
            AI Study Planner
          </h2>
          <p className="text-sm text-ink3 font-medium">
            Dynamically optimized schedule for peak performance
          </p>
        </div>
        {timetable && (
          <Button
            onClick={optimize}
            loading={optimizing}
            className="gap-2 shadow-lg bg-primary text-white"
          >
            <Sparkles size={18} /> AI Optimization
          </Button>
        )}
      </div>

      {!timetable ? (
        <EmptyState
          icon={<Calendar size={40} />}
          title="No schedule created"
          description="Initialize your study timetable and allow AI to distribute your workload intelligently."
          action={
            <Button
              size="lg"
              onClick={async () => {
                const res = await timetableApi.create({
                  name: "Primary Schedule",
                });
                setTimetable((res.data as any).data?.timetable);
              }}
            >
              Initialize Schedule
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Weekly grid */}
          <Card className="p-0 overflow-hidden border-border2 shadow-2xl">
            <div className="overflow-x-auto scrollbar-hidden">
              <div className="min-w-200">
                {/* Header Row */}
                <div className="grid grid-cols-[80px_repeat(5,1fr)] bg-surface border-b border-border2">
                  <div className="p-4" />
                  {DAYS.map((d) => (
                    <div
                      key={d}
                      className="p-4 text-center text-xs font-black text-ink3 uppercase tracking-widest border-l border-border2"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Time Rows */}
                {TIMES.map((time) => (
                  <div
                    key={time}
                    className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-border2 last:border-b-0 hover:bg-surface/30 transition-colors"
                  >
                    <div className="p-4 flex items-center justify-center text-[10px] font-black text-ink3 tracking-widest border-r border-border2">
                      {time}
                    </div>
                    {DAYS.map((day) => {
                      const slot = (timetable.slots || []).find(
                        (s: any) => s.day === day && s.startTime === time,
                      );
                      const style = slot
                        ? slotStyles[slot.type] || slotStyles.study
                        : null;

                      return (
                        <div
                          key={day}
                          className="p-2 border-l border-border2 min-h-17.5 flex items-stretch"
                        >
                          {slot && (
                            <div
                              className={clsx(
                                "w-full rounded-xl p-3 shadow-sm transition-all hover:scale-[1.02] cursor-pointer",
                                style?.bg,
                                style?.text,
                                slot.isCompleted &&
                                  "opacity-40 grayscale scale-95 shadow-none",
                              )}
                            >
                              <div className="flex flex-col h-full justify-between">
                                <p className="text-[11px] font-black leading-tight uppercase tracking-tight mb-1">
                                  {slot.subject}
                                </p>
                                <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">
                                  {slot.type.replace("_", " ")}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* AI Insights Section */}
          {timetable.aiInsights?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timetable.aiInsights.map((insight: any, i: number) => (
                <Card
                  key={i}
                  className="bg-primary/5 border-primary/10 flex gap-4 items-start p-5"
                >
                  <div className="p-2 rounded-xl bg-primary text-white shrink-0 shadow-lg">
                    <BrainCircuit size={16} />
                  </div>
                  <p className="text-xs font-semibold text-ink2 leading-relaxed">
                    {insight.message}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, clearAuth } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || "",
    educationLevel: user?.educationLevel || "O-Level",
    preferredLanguage: user?.preferredLanguage || "english",
  });
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await userApi.updateProfile(form);
      setUser((res.data as any).data?.user);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPw(true);
    try {
      await authApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Password changed. Please log in again.");
      clearAuth();
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = () => {
    authApi
      .logout()
      .catch(() => {})
      .finally(() => {
        clearAuth();
        toast.success("Logged out");
        navigate({ to: "/login" });
      });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-serif text-ink mb-2">
            Account Control
          </h2>
          <p className="text-sm text-ink3 font-medium">
            Manage your learning profile and security
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut size={16} /> Secure Log Out
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-primary/5 text-primary">
              <Settings size={20} />
            </div>
            <h3 className="text-lg font-bold font-serif text-ink">
              Personal Profile
            </h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-ink3 uppercase tracking-[0.2em] mb-2 block">
                Full Legal Name
              </label>
              <input
                className="w-full bg-bg border border-border2 rounded-xl py-3.5 px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-ink3 uppercase tracking-[0.2em] mb-2 block">
                  Academic Level
                </label>
                <select
                  className="w-full bg-bg border border-border2 rounded-xl py-3.5 px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner appearance-none cursor-pointer"
                  value={form.educationLevel}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      educationLevel: e.target.value as any,
                    }))
                  }
                >
                  {["ZJC", "O-Level", "A-Level", "University"].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-ink3 uppercase tracking-[0.2em] mb-2 block">
                  Language Preference
                </label>
                <select
                  className="w-full bg-bg border border-border2 rounded-xl py-3.5 px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner appearance-none cursor-pointer"
                  value={form.preferredLanguage}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      preferredLanguage: e.target.value as any,
                    }))
                  }
                >
                  <option value="english">English (Primary)</option>
                  <option value="shona">Shona (Zimbabwe)</option>
                  <option value="ndebele">Ndebele (Zimbabwe)</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                className="w-full shadow-lg"
                onClick={saveProfile}
                loading={saving}
              >
                Update Personal Profile
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-accent/5 text-accent">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-lg font-bold font-serif text-ink">
              Security Credentials
            </h3>
          </div>

          <div className="space-y-4">
            <input
              className="w-full bg-bg border border-border2 rounded-xl py-3.5 px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner"
              type="password"
              placeholder="Current verification password"
              value={pwForm.currentPassword}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, currentPassword: e.target.value }))
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="w-full bg-bg border border-border2 rounded-xl py-3.5 px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner"
                type="password"
                placeholder="New security key"
                value={pwForm.newPassword}
                onChange={(e) =>
                  setPwForm((f) => ({ ...f, newPassword: e.target.value }))
                }
              />
              <input
                className="w-full bg-bg border border-border2 rounded-xl py-3.5 px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner"
                type="password"
                placeholder="Confirm security key"
                value={pwForm.confirm}
                onChange={(e) =>
                  setPwForm((f) => ({ ...f, confirm: e.target.value }))
                }
              />
            </div>
            <div className="pt-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={changePassword}
                loading={savingPw}
              >
                Change Password
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
