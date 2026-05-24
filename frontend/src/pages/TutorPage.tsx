import { clsx } from "clsx";
import {
  ArrowRight,
  BookOpen,
  Bot,
  GraduationCap,
  Info,
  Languages,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Badge,
  Button,
  Card,
  Input,
  SectionHeader,
  Skeleton,
  Spinner,
  TypingIndicator,
} from "../components/ui";
import { chatApi } from "../services/apiServices";
import { useAuthStore } from "../store/authStore";
import type { ChatMessage, ChatSession } from "../types";

const QUICK_TOPICS = [
  "Explain the chain rule",
  "What is integration by parts?",
  "Newton's second law",
  "Organic functional groups",
  "How does osmosis work?",
  "Photosynthesis explained",
];

const LANGUAGES = [
  { id: "english", label: "English" },
  { id: "shona", label: "Shona" },
  { id: "ndebele", label: "Ndebele" },
];

export const TutorPage: React.FC = () => {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState(
    user?.preferredLanguage || "english",
  );
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatApi
      .getSessions()
      .then((r) => setSessions((r.data as any).data?.sessions || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const startNewSession = async (subjectOverride?: string) => {
    setLoadingSession(true);
    try {
      const s = subjectOverride || subject;
      const res = await chatApi.createSession({ subject: s, language });
      const newSession = (res.data as any).data?.session;
      setActiveSession(newSession);
      setMessages([
        {
          role: "assistant",
          content: `Mhoro ${user?.name?.split(" ")[0]}! I'm your DzidzaAI tutor. ${s ? `I see you want to study ${s}.` : "What are we studying today?"} Ask me anything — I'll explain at your ${user?.educationLevel} level.`,
          createdAt: new Date().toISOString(),
        },
      ]);
      setSessions((prev) => [newSession, ...prev]);
    } catch {
      toast.error("Failed to start session");
    } finally {
      setLoadingSession(false);
    }
  };

  const loadSession = async (session: ChatSession) => {
    if (activeSession?._id === session._id) return;
    setLoadingSession(true);
    try {
      const res = await chatApi.getSession(session._id);
      const full = (res.data as any).data?.session;
      setActiveSession(full);
      setMessages(full.messages || []);
    } catch {
      toast.error("Failed to load session");
    } finally {
      setLoadingSession(false);
    }
  };

  const sendMessage = async (content?: string) => {
    const text = content || input.trim();
    if (!text || sending) return;
    if (!activeSession) {
      await startNewSession();
      return;
    }

    setInput("");
    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await chatApi.sendMessage(activeSession._id, text, language);
      const aiMsg = (res.data as any).data?.message;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiMsg.content,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Purge this session from memory?")) return;
    try {
      await chatApi.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      if (activeSession?._id === id) {
        setActiveSession(null);
        setMessages([]);
      }
      toast.success("Session purged");
    } catch {
      toast.error("Deletion failed");
    }
  };

  return (
    <div className="max-w-400 mx-auto space-y-8 animate-fade-in min-h-[calc(100vh-72px)] flex flex-col pb-12">
      {/* Page Header */}
      <SectionHeader
        title="AI tutor"
        subtitle={`Aligned with ${user?.educationLevel} standards and ready for focused study support.`}
        icon={<Bot size={24} />}
        action={
          <div className="flex gap-2">
            <Badge
              variant="teal"
              className="gap-2 ring-4 ring-secondary/5 border-secondary/20"
            >
              <Sparkles size={12} /> Ready
            </Badge>
            <Badge variant="blue" className="px-4 border-primary/20">
              {language.toUpperCase()}
            </Badge>
          </div>
        }
      />

      <Card className="p-6 border-border2 bg-surface shadow-xl">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <Languages size={16} />,
              label: "Language mode",
              value: language.toUpperCase(),
              desc: "Tutor responses follow your selected linguistic matrix.",
            },
            {
              icon: <MessageCircle size={16} />,
              label: "Session focus",
              value: subject || "Open study",
              desc: "Set a subject to anchor the next tutoring sequence.",
            },
            {
              icon: <Sparkles size={16} />,
              label: "Conversation style",
              value: "Guided, concise, responsive",
              desc: "The assistant adapts to your current level and pace.",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border2 bg-bg px-5 py-4 shadow-soft"
            >
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-ink3">
                <span className="text-primary">{item.icon}</span>
                {item.label}
              </div>
              <p className="mt-3 text-base font-semibold text-ink">
                {item.value}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink2">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex-1 flex gap-6 overflow-hidden min-h-[70vh]">
        {/* Chat Main Area */}
        <Card className="flex-[1.45] flex flex-col overflow-hidden p-0 border-border2 relative shadow-2xl bg-surface group ring-1 ring-border2/50 min-w-0">
          {/* Header */}
          <div className="p-5 px-8 border-b border-border2 flex items-center justify-between bg-surface sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg group-hover:rotate-3 transition-transform">
                <Bot size={24} />
              </div>
              <div />
            </div>
            {activeSession?.subject && (
              <Badge
                variant="purple"
                className="font-black px-4 py-1.5 shadow-sm border-purple-500/20"
              >
                {activeSession.subject}
              </Badge>
            )}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth scrollbar-hidden bg-linear-to-b from-surface via-bg to-surface">
            {!activeSession && !loadingSession && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-8 bg-surface/60 border border-border2 rounded-4xl p-10 shadow-inner">
                <div className="w-24 h-24 rounded-[2.5rem] bg-bg border border-border2 text-primary flex items-center justify-center shadow-lg relative">
                  <div className="absolute inset-0 rounded-[2.5rem] bg-primary/5 animate-ping opacity-20" />
                  <GraduationCap size={48} className="relative z-10" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black font-serif text-ink tracking-tight">
                    Start a tutoring session
                  </h3>
                  <p className="text-sm font-medium text-text-secondary leading-loose italic px-4">
                    Start by choosing a subject or selecting one of the quick
                    prompts on the right. The tutor will adapt to your level and
                    session context.
                  </p>
                </div>
                <Button
                  onClick={() => startNewSession()}
                  className="w-full h-14 rounded-2xl shadow-2xl gap-3 text-base"
                >
                  <Plus size={20} /> Start new session
                </Button>
              </div>
            )}

            {loadingSession && (
              <div className="h-full flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <Spinner size={48} className="text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bot size={20} className="text-primary animate-pulse" />
                  </div>
                </div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.4em] animate-pulse">
                  Loading session...
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={clsx(
                  "flex gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg border-2",
                    msg.role === "user"
                      ? "bg-bg border-border2 text-ink"
                      : "bg-primary border-primary text-white",
                  )}
                >
                  {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div
                  className={clsx(
                    "max-w-[82%] p-6 rounded-3xl text-[15px] leading-loose shadow-soft relative transition-all duration-300",
                    msg.role === "user"
                      ? "bg-primary text-white rounded-tr-none font-medium border-primary shadow-primary/20"
                      : "bg-bg border border-border2 text-ink rounded-tl-none font-medium shadow-lg",
                  )}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <p
                    className={clsx(
                      "text-[8px] font-black uppercase tracking-[0.2em] mt-4 opacity-30",
                      msg.role === "user" ? "text-right" : "text-left",
                    )}
                  >
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "NOW"}
                  </p>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-5 animate-in fade-in duration-300">
                <div className="w-10 h-10 rounded-xl bg-primary border-2 border-primary text-white flex items-center justify-center shadow-lg">
                  <Bot size={18} />
                </div>
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Area */}
          <div className="p-6 px-8 border-t border-border2 bg-surface/95 backdrop-blur-xl shadow-2xl">
            <div className="relative group max-w-4xl mx-auto">
              <textarea
                className="w-full bg-bg border-2 border-border2 rounded-4xl py-5 pl-8 pr-16 text-sm font-bold text-ink placeholder:text-ink3 focus:ring-8 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner min-h-16 max-h-50 resize-none leading-relaxed"
                placeholder="Inquire about any academic concept..."
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), sendMessage())
                }
                disabled={sending}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || sending}
                className="absolute right-3 bottom-3 p-3.5 rounded-2xl bg-primary text-white hover:bg-primary-dark disabled:opacity-20 disabled:hover:bg-primary transition-all shadow-xl active:scale-90 group-hover:rotate-6"
              >
                {sending ? <Spinner size={20} /> : <Send size={20} />}
              </button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 opacity-40">
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-text-secondary">
                <kbd className="px-1.5 py-0.5 rounded bg-surface2 border border-border2">
                  ENTER
                </kbd>{" "}
                TO SEND
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-text-secondary">
                <Info size={10} /> AI ANALYSIS ENABLED
              </div>
            </div>
          </div>
        </Card>

        {/* Sidebar Controls */}
        <aside className="w-72 shrink-0 space-y-6 overflow-y-auto scrollbar-hidden">
          {/* Quick Topics */}
          <Card className="p-8 border-border2 shadow-xl group/card">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border2">
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary transition-transform group-hover/card:-rotate-6">
                <BookOpen size={18} />
              </div>
              <h4 className="text-[10px] font-black text-ink uppercase tracking-[0.3em]">
                Suggested prompts
              </h4>
            </div>
            <div className="space-y-3">
              {QUICK_TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    !activeSession
                      ? startNewSession().then(() => sendMessage(t))
                      : sendMessage(t)
                  }
                  className="w-full text-left p-4 rounded-2xl border-2 border-border2 hover:border-secondary/40 hover:bg-secondary/3 text-xs font-bold text-ink2 transition-all duration-300 group/btn"
                >
                  <span className="group-hover/btn:text-ink flex items-center justify-between">
                    {t}
                    <ArrowRight
                      size={12}
                      className="opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-2 group-hover/btn:translate-x-0"
                    />
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Config */}
          <Card className="p-8 border-border2 shadow-xl group/config">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border2">
              <div className="p-2 rounded-xl bg-accent/10 text-accent transition-transform group-hover/config:scale-110">
                <Languages size={18} />
              </div>
              <h4 className="text-[10px] font-black text-ink uppercase tracking-[0.3em]">
                Session settings
              </h4>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] mb-3 ml-1">
                  Language
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLanguage(l.id as any)}
                      className={clsx(
                        "p-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between group/lang",
                        language === l.id
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                          : "bg-surface border-border2 text-ink2 hover:border-primary/20",
                      )}
                    >
                      {l.label}
                      {language === l.id && (
                        <Zap size={10} className="fill-current" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border2">
                <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] mb-3 ml-1">
                  Syllabus Focus
                </p>
                <div className="space-y-3">
                  <Input
                    className="py-2.5! text-xs! font-bold!"
                    placeholder="e.g. Mechanical Physics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="w-full text-[9px] h-10 tracking-[0.2em] font-black"
                    onClick={() => startNewSession(subject)}
                    loading={loadingSession}
                  >
                    Save and start
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent History */}
          <div className="space-y-4 pt-4">
            <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] px-2 mb-4">
              Recent sessions
            </h4>
            {loadingHistory ? (
              <div className="space-y-3">
                <Skeleton className="h-14 rounded-2xl w-full" />
                <Skeleton className="h-14 rounded-2xl w-full" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-10 opacity-30 italic text-[10px] font-bold uppercase tracking-widest">
                No previous sessions
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 5).map((s) => (
                  <div
                    key={s._id}
                    onClick={() => loadSession(s)}
                    className={clsx(
                      "group w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex items-center gap-4",
                      activeSession?._id === s._id
                        ? "bg-surface border-primary/40 shadow-xl"
                        : "bg-bg/50 border-border2 hover:border-primary/20 hover:bg-surface",
                    )}
                  >
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-soft",
                        activeSession?._id === s._id
                          ? "bg-primary text-white"
                          : "bg-surface border border-border2 text-text-secondary",
                      )}
                    >
                      <MessageCircle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={clsx(
                          "text-xs font-black truncate tracking-tight uppercase transition-colors",
                          activeSession?._id === s._id
                            ? "text-primary"
                            : "text-ink2",
                        )}
                      >
                        {s.title || "Untitled Sequence"}
                      </p>
                      <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest opacity-50 mt-0.5">
                        {s.subject || "GENERAL"} ·{" "}
                        {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteSession(s._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
