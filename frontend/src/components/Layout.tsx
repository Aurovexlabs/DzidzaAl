import { Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { clsx } from "clsx";
import {
  Bell,
  BookMarked,
  BookOpenText,
  BrainCircuit,
  CalendarDays,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Code,
  LayoutDashboard,
  Map,
  Menu,
  MessageSquareText,
  MicVocal,
  MoonStar,
  PenTool,
  Search,
  SunMedium,
  TimerReset,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { notificationApi } from "../services/apiServices";
import { connectSocket } from "../services/socket";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import type { Notification } from "../types";

// ─── Navigation structure ─────────────────────────────────────────────────────
const NAV = [
  {
    section: "Learn",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/tutor", label: "AI Tutor", icon: MessageSquareText },
      { path: "/voice-tutor", label: "Voice Tutor", icon: MicVocal },
      { path: "/quiz", label: "Quizzes", icon: CircleHelp },
      { path: "/partners", label: "Study Partners", icon: Users },
      { path: "/flashcards", label: "Flashcards", icon: BookOpenText },
    ],
  },
  {
    section: "AI Tools",
    items: [
      { path: "/ai-tools", label: "AI Tools", icon: BrainCircuit },
      { path: "/knowledge-gaps", label: "Knowledge Gaps", icon: Search },
    ],
  },
  {
    section: "Practice",
    items: [
      { path: "/exam-simulator", label: "Exam Simulator", icon: ClipboardList },
      { path: "/essay-grader", label: "Essay Grader", icon: PenTool },
      { path: "/code-sandbox", label: "Code Sandbox", icon: Code },
      { path: "/past-papers", label: "Past Papers", icon: BookMarked },
    ],
  },
  {
    section: "Plan",
    items: [
      { path: "/learning-path", label: "Learning Path", icon: Map },
      { path: "/timetable", label: "Timetable", icon: CalendarDays },
      { path: "/focus", label: "Focus Mode", icon: TimerReset },
    ],
  },
  {
    section: "Insights",
    items: [{ path: "/analytics", label: "Analytics", icon: ChartColumn }],
  },
];

// ─── AppLayout ────────────────────────────────────────────────────────────────
export const AppLayout: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const router = useRouter();
  const { location } = useRouterState();
  const currentPath = location.pathname;
  const isDark = theme === "dark";

  const [unreadCount, setUnreadCount] = useState(0);
  const [liveNotif, setLiveNotif] = useState<Notification | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    notificationApi
      .getAll({ unreadOnly: true })
      .then((r) => setUnreadCount((r.data as any)?.data?.unreadCount || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const socket = connectSocket(accessToken);
    socket?.on("notification", (notif: Notification) => {
      setUnreadCount((c) => c + 1);
      setLiveNotif(notif);
      setTimeout(() => setLiveNotif(null), 5000);
    });
    return () => {
      socket?.off("notification");
    };
  }, [accessToken]);

  const initials =
    user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const isActive = (path: string) =>
    currentPath === path ||
    (path !== "/dashboard" && currentPath.startsWith(path));
  const SidebarContent: React.FC = () => (
    <div
      className={clsx(
        "flex flex-col h-full bg-surface border-r border-border2",
        collapsed ? "w-18" : "w-64",
      )}
    >
      <div
        className="p-4 flex items-center gap-3 border-b"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
          Dz
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-1 rounded-md hover:bg-surface2 transition-colors"
            title="Toggle appearance"
          >
            {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
          </button>
        </div>
        {!collapsed && (
          <div className="animate-in fade-in duration-300">
            <h1 className="font-serif font-bold text-lg leading-tight tracking-tight">
              DzidzaAI
            </h1>
            <p
              className="text-[10px] uppercase tracking-widest font-semibold"
              style={{ color: "var(--sidebar-text-muted)" }}
            >
              Intelligent Learning
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-hidden">
        {NAV.map((section) => (
          <div key={section.section} className="mb-6 last:mb-0">
            {!collapsed && (
              <p
                className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ color: "var(--sidebar-text-muted)", opacity: 0.8 }}
              >
                {section.section}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      router.navigate({ to: item.path });
                      setMobileOpen(false);
                    }}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                      active
                        ? "bg-secondary/10 text-secondary"
                        : "hover:bg-black/5 dark:hover:bg-white/5",
                      !active && "text-sidebar-text-muted",
                      collapsed && "justify-center px-0",
                    )}
                    style={{
                      color: active ? "var(--accent2)" : "var(--sidebar-text)",
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon
                      size={18}
                      className={clsx(
                        "shrink-0",
                        active
                          ? "text-secondary"
                          : "opacity-70 group-hover:opacity-100",
                      )}
                    />
                    {!collapsed && (
                      <span className="text-sm font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.label}
                      </span>
                    )}
                    {active && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-secondary rounded-r-full shadow-[0_0_12px_rgba(20,184,166,0.6)]" />
                    )}
                    {item.path === "/quiz" && unreadCount > 0 && (
                      <div
                        className={clsx(
                          "bg-accent text-white font-bold flex items-center justify-center",
                          collapsed
                            ? "absolute top-1 right-1 w-2 h-2 rounded-full"
                            : "ml-auto px-1.5 py-0.5 rounded-md text-[9px]",
                        )}
                      >
                        {!collapsed && unreadCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="p-4 border-t space-y-2"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <button
          onClick={toggleTheme}
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
            "hover:bg-black/5 dark:hover:bg-white/5",
            collapsed && "justify-center px-0",
          )}
          style={{ color: "var(--sidebar-text)" }}
        >
          {isDark ? <SunMedium size={18} /> : <MoonStar size={18} />}
          {!collapsed && (
            <span className="text-sm font-medium">Appearance</span>
          )}
        </button>

        <div
          className={clsx(
            "flex items-center gap-3 p-2 rounded-2xl border",
            collapsed && "justify-center p-1.5",
          )}
          style={{
            backgroundColor: "var(--surface2)",
            borderColor: "var(--sidebar-border)",
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-bold truncate leading-none mb-0.5"
                style={{ color: "var(--sidebar-text)" }}
              >
                {user?.name}
              </p>
              <p
                className="text-[10px] font-medium truncate uppercase tracking-wider"
                style={{ color: "var(--sidebar-text-muted)" }}
              >
                Level {user?.level || 1}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-bg overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          "hidden md:flex flex-col transition-all duration-300 ease-in-out z-30 shadow-2xl",
          collapsed ? "w-18" : "w-64",
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 w-64 z-50 md:hidden transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header / Navbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-surface border-b border-border2 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 md:hidden text-ink2 hover:bg-surface2 rounded-lg transition-all"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hidden md:flex text-ink2 hover:bg-surface2 rounded-lg transition-all"
            >
              {collapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
            <h2 className="text-sm font-bold text-ink uppercase tracking-widest hidden sm:block opacity-40">
              {currentPath.split("/").pop()?.replace("-", " ")}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-border2 bg-surface hover:border-primary/20 hover:bg-surface2 transition-all"
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
              <span className="text-xs font-medium text-ink3">
                {isDark ? "Light mode" : "Dark mode"}
              </span>
            </button>

            <button
              onClick={() => router.navigate({ to: "/search" })}
              className="relative group mr-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-border2 bg-surface hover:border-primary/20 hover:bg-surface2 transition-all"
            >
              <Search
                className="text-ink3 group-hover:text-primary transition-colors"
                size={16}
              />
              <span className="hidden sm:inline text-xs font-medium text-ink3 group-hover:text-ink">
                Search
              </span>
            </button>

            <button
              className="p-2 text-ink2 hover:bg-surface2 rounded-xl transition-all relative"
              onClick={() => router.navigate({ to: "/notifications" })}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-surface" />
              )}
            </button>

            <div className="w-px h-6 bg-border2 mx-2" />

            <button
              onClick={() => router.navigate({ to: "/profile" })}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-surface2 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-surface2 border border-border2 flex items-center justify-center text-xs font-bold text-ink group-hover:border-primary/30 transition-all overflow-hidden">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-bg p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>

        {/* Live notification */}
        {liveNotif && (
          <div className="fixed bottom-6 right-6 z-100 max-w-sm w-full animate-in slide-in-from-right duration-300">
            <div className="bg-surface border border-border2 rounded-2xl p-4 shadow-2xl flex gap-4 items-start relative group">
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink mb-1">
                  {liveNotif.title}
                </p>
                <p className="text-xs text-ink3 leading-relaxed">
                  {liveNotif.message}
                </p>
              </div>
              <button
                onClick={() => setLiveNotif(null)}
                className="text-ink3 hover:text-ink transition-colors p-1"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-0 left-0 h-1 bg-secondary rounded-full animate-progress-shrink" />
            </div>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes progress-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-progress-shrink {
          animation: progress-shrink 5000ms linear forwards;
        }
      `,
        }}
      />
    </div>
  );
};
