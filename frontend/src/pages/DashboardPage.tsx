import { useNavigate } from "@tanstack/react-router";
import { clsx } from "clsx";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CircleHelp,
  ClipboardList,
  Clock,
  Flame,
  History,
  MessageSquareText,
  PenTool,
  Search,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  ProgressBar,
  SectionHeader,
  Skeleton,
  StatCard,
} from "../components/ui";
import { analyticsApi } from "../services/apiServices";
import { useAuthStore } from "../store/authStore";
import type { AnalyticsOverview } from "../types";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [coachMsg, setCoachMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, coachRes] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getCoachMessage(),
        ]);
        setOverview((overviewRes.data as any).data);
        setCoachMsg((coachRes.data as any).data?.message || "");
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading)
    return (
      <div className="space-y-8 animate-fade-in pb-12 p-6">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-12 w-48 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );

  const xpToNextLevel = (user?.level || 1) * (user?.level || 1) * 100;
  const xpProgress = Math.min(
    100,
    Math.round(((user?.xp || 0) / xpToNextLevel) * 100),
  );

  return (
    <div className="space-y-10 animate-fade-in pb-16 relative">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <SectionHeader
            title={`${greeting}, ${user?.name?.split(" ")[0]}`}
            subtitle={
              overview?.flashcardsDue
                ? `You have ${overview.flashcardsDue} flashcards due for review. Let's get started!`
                : "You're all caught up on your studies for now. Great work!"
            }
          />
          <div className="flex items-center gap-3">
            <Badge
              variant="blue"
              className="bg-primary/10 text-primary border border-primary/20 ring-4 ring-primary/5"
            >
              Level {user?.level || 1}
            </Badge>
            <div className="w-px h-4 bg-border2" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-widest">
              <Activity size={14} className="text-secondary" />
              Active today
            </div>
            <div className="w-px h-4 bg-border2" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-widest">
              <Flame size={14} className="text-accent" />
              {overview?.streak.current || 0} Day Streak
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-sm w-full group">
          <Card className="p-5 border-primary/10 bg-surface group-hover:border-primary/30 group-hover:shadow-2xl transition-all duration-500">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-3">
              <span className="text-text-secondary">Study progress</span>
              <span className="text-primary">{xpProgress}%</span>
            </div>
            <ProgressBar
              value={xpProgress}
              className="gap-0!"
              color="var(--accent)"
            />
            <div className="flex justify-between mt-3">
              <span className="text-[9px] font-bold text-text-secondary opacity-50 uppercase tracking-widest">
                {user?.xp} XP
              </span>
              <span className="text-[9px] font-bold text-text-secondary opacity-50 uppercase tracking-widest">
                {xpToNextLevel} XP Target
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* Stats Overview Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Study streak"
          value={overview?.streak.current || 0}
          icon={<Flame size={20} />}
          sub={
            overview?.streak.current === overview?.streak.longest
              ? "PERSONAL BEST"
              : `RECORD: ${overview?.streak.longest || 0}d`
          }
          subColor="up"
          trend={12}
        />
        <StatCard
          label="Study time"
          value={`${overview?.totalHoursThisMonth || 0}h`}
          icon={<Clock size={20} />}
          sub={
            overview?.weekVsPrevWeek.change !== undefined
              ? `${overview.weekVsPrevWeek.change}% FROM LAST WEEK`
              : "STEADY PACE"
          }
          subColor={
            overview?.weekVsPrevWeek.change &&
            overview.weekVsPrevWeek.change >= 0
              ? "up"
              : "down"
          }
          trend={overview?.weekVsPrevWeek.change}
        />
        <StatCard
          label="Mastery Index"
          value={`${overview?.avgQuizScore || 0}%`}
          icon={<Target size={20} />}
          sub="CURRICULUM ACCURACY"
          subColor="neutral"
        />
        <StatCard
          label="Study sessions"
          value={overview?.sessionCount || 0}
          icon={<History size={20} />}
          sub="TOTAL SESSIONS"
          subColor="neutral"
        />
      </section>

      {/* Main Bento Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Mastery - Takes 2 columns */}
        <Card
          className="lg:col-span-2 overflow-hidden group hover:border-secondary/30 transition-all duration-500 shadow-xl"
          hoverable
        >
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black font-serif text-ink tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                  <Sparkles size={18} />
                </div>
                Subject mastery
              </h3>
              <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] mt-1 ml-11">
                Real-time subject performance overview
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/analytics" })}
              className="text-primary font-black uppercase tracking-widest text-[10px] group/btn"
            >
              Analytics hub
              <ArrowRight
                size={14}
                className="ml-2 group-hover/btn:translate-x-1 transition-transform"
              />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {(user?.subjects || []).length > 0 ? (
              user?.subjects.slice(0, 6).map((s) => (
                <div key={s.name} className="space-y-3 group/item">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-sm font-black text-ink uppercase tracking-tight group-hover/item:text-primary transition-colors">
                      {s.name}
                    </span>
                    <span className="text-xs font-black text-secondary tabular-nums">
                      {s.masteryScore}%
                    </span>
                  </div>
                  <ProgressBar
                    value={s.masteryScore}
                    className="gap-0!"
                    color={
                      s.masteryScore > 80
                        ? "var(--color-secondary)"
                        : "var(--color-primary)"
                    }
                  />
                </div>
              ))
            ) : (
              <div className="col-span-2 py-16 flex flex-col items-center justify-center bg-bg/50 rounded-3xl border-2 border-dashed border-border2">
                <p className="text-text-secondary text-sm font-bold uppercase tracking-widest opacity-40">
                  No syllabus data found
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6 shadow-soft"
                  onClick={() => navigate({ to: "/settings" })}
                >
                  Configure Profile
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* AI Coach Message - Takes 1 column */}
        <Card
          className="flex flex-col relative overflow-hidden bg-surface border-primary/20 shadow-2xl group"
          hoverable
        >
          <div className="z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform">
                <BrainCircuit size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black font-serif text-ink tracking-tight">
                  Coach Alpha
                </h3>
                <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em]">
                  Coach insight
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center py-6">
              {coachMsg ? (
                <div className="relative">
                  <span className="absolute -top-10 -left-4 text-8xl text-primary/10 font-serif font-black select-none pointer-events-none">
                    “
                  </span>
                  <p className="text-xl font-serif italic text-ink leading-relaxed z-10 relative pl-4 border-l-4 border-primary/20">
                    {coachMsg}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[90%]" />
                  <Skeleton className="h-4 w-[95%]" />
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary border border-secondary/20 shadow-inner group-hover:scale-110 transition-transform">
                  <Sparkles size={16} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-ink uppercase tracking-widest">
                    Active System
                  </p>
                  <p className="text-[8px] font-bold text-text-secondary uppercase opacity-50">
                    Ready and learning
                  </p>
                </div>
              </div>
              <Badge variant="teal" className="animate-pulse">
                Live
              </Badge>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
        </Card>

        {/* Weekly Activity Chart */}
        <Card className="flex flex-col group" hoverable>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black font-serif text-ink tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <TrendingUp size={18} />
              </div>
              Study Velocity
            </h3>
            <Badge variant="blue" className="px-3">
              {overview?.weekVsPrevWeek.thisWeek || 0}H WEEKLY
            </Badge>
          </div>

          <div className="flex-1 flex items-end justify-between gap-3 min-h-40 pt-6 px-2">
            {(overview?.weeklyHours || []).map((d) => {
              const maxH = Math.max(
                ...(overview?.weeklyHours || []).map((x) => x.hours),
                1,
              );
              const h = Math.max(8, Math.round((d.hours / maxH) * 120));
              const isToday =
                d.day ===
                new Date().toLocaleDateString("en-US", { weekday: "short" });

              return (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center gap-4 group/bar"
                >
                  <div className="relative w-full flex flex-col items-center">
                    <div
                      className={clsx(
                        "w-full max-w-7 rounded-t-xl transition-all duration-700 group/bar:brightness-110",
                        isToday
                          ? "bg-primary shadow-[0_0_20px_rgba(47,111,237,0.18)]"
                          : "bg-primary/10 border border-primary/5",
                      )}
                      style={{ height: `${h}px` }}
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-ink text-white text-[10px] font-black py-1.5 px-2.5 rounded-lg pointer-events-none shadow-2xl z-20 scale-90 group-hover/bar:scale-100">
                      {d.hours}h
                    </div>
                  </div>
                  <span
                    className={clsx(
                      "text-[9px] font-black uppercase tracking-[0.2em] transition-colors",
                      isToday
                        ? "text-primary scale-110"
                        : "text-text-secondary opacity-40",
                    )}
                  >
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Quick Actions & Recent */}
        <Card className="lg:col-span-2 group" hoverable>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black font-serif text-ink tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/10 text-accent">
                <Zap size={18} />
              </div>
              Quick actions
            </h3>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40">
              Study tools
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              {
                label: "AI Tutor",
                icon: MessageSquareText,
                path: "/tutor",
                color: "text-primary",
                bg: "bg-primary/5",
              },
              {
                label: "Practice",
                icon: CircleHelp,
                path: "/quiz",
                color: "text-secondary",
                bg: "bg-secondary/5",
              },
              {
                label: "Exam Sim",
                icon: ClipboardList,
                path: "/exam-simulator",
                color: "text-accent",
                bg: "bg-accent/5",
              },
              {
                label: "Diagnostics",
                icon: Search,
                path: "/knowledge-gaps",
                color: "text-red-500",
                bg: "bg-red-500/5",
              },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate({ to: action.path as any })}
                className="flex flex-col items-center gap-4 p-6 rounded-3xl border-2 border-border2 bg-surface hover:border-primary/40 hover:shadow-2xl transition-all duration-500 group/btn shadow-soft"
              >
                <div
                  className={clsx(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover/btn:scale-110 group-hover/btn:shadow-2xl",
                    action.bg,
                    action.color,
                  )}
                >
                  <action.icon size={24} />
                </div>
                <span className="text-[10px] font-black text-ink uppercase tracking-[0.2em]">
                  {action.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-10 pt-10 border-t border-border2 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex items-center gap-5 p-5 rounded-3xl bg-bg border border-border2 group/util hover:border-accent/40 transition-all duration-500">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0 shadow-inner group-hover/util:scale-110 transition-transform">
                <TimerReset size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-ink uppercase tracking-widest mb-1 truncate">
                  Focus mode
                </p>
                <p className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em] opacity-40">
                  Sustained concentration
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate({ to: "/focus" })}
                className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100"
              >
                Launch
              </Button>
            </div>
            <div className="flex items-center gap-5 p-5 rounded-3xl bg-bg border border-border2 group/util hover:border-primary/40 transition-all duration-500">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner group-hover/util:scale-110 transition-transform">
                <PenTool size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-ink uppercase tracking-widest mb-1 truncate">
                  Essay review
                </p>
                <p className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em] opacity-40">
                  Guided feedback
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate({ to: "/essay-grader" })}
                className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100"
              >
                Access
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};
