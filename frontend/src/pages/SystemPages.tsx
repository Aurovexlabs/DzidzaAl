import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  LayoutDashboard,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  SectionHeader,
  Spinner,
  StatCard,
} from "../components/ui";
import {
  analyticsApi,
  authApi,
  notificationApi,
  userApi,
} from "../services/apiServices";
import { useAuthStore } from "../store/authStore";

const adminMetrics = [
  ["Active students", "1,248"],
  ["Unread alerts", "36"],
  ["Generated sessions", "8,940"],
  ["Storage usage", "62%"],
] as const;

const searchItems = [
  ["Dashboard", "/dashboard", "Go to your learning overview"],
  ["AI Tutor", "/tutor", "Start a tutoring session"],
  ["Quizzes", "/quiz", "Generate or review practice"],
  ["Flashcards", "/flashcards", "Review your spaced repetition cards"],
  ["Timetable", "/timetable", "Manage your study plan"],
  ["Analytics", "/analytics", "Check your learning progress"],
  ["Documents", "/documents", "Upload notes and past papers"],
  ["Settings", "/settings", "Edit profile and security settings"],
] as const;

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchItems;
    return searchItems.filter(
      (item) =>
        item[0].toLowerCase().includes(q) || item[2].toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <SectionHeader
        title="Search"
        subtitle="Quickly find the learning surface you need."
        icon={<Search size={20} />}
      />
      <Card className="p-6">
        <Input
          label="Search routes, tools, and pages"
          placeholder="Search for tutor, quiz, timetable..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map(([title, path, desc]) => (
          <Card
            key={path}
            hoverable
            className="p-6 flex items-start justify-between gap-4"
          >
            <div>
              <p className="font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm text-ink3">{desc}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: path as any })}
            >
              Open
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const NotificationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getAll();
      const data = (res.data as any).data || {};
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={40} className="text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <SectionHeader
        title="Notifications"
        subtitle="Keep track of study reminders, coach messages, and product updates."
        icon={<Bell size={20} />}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Unread"
          value={unreadCount}
          icon={<Bell size={18} />}
        />
        <StatCard
          label="Visible"
          value={notifications.length}
          icon={<Sparkles size={18} />}
        />
        <StatCard
          label="State"
          value={unreadCount > 0 ? "Needs attention" : "All clear"}
          icon={<ShieldCheck size={18} />}
        />
      </div>
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={36} />}
          title="No notifications yet"
          description="Your study reminders and updates will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card
              key={notif._id}
              className="p-5 flex items-start justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={notif.isRead ? "neutral" : "blue"}>
                    {notif.type}
                  </Badge>
                  {!notif.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
                <h3 className="font-semibold text-ink">{notif.title}</h3>
                <p className="mt-1 text-sm text-ink3 leading-relaxed">
                  {notif.message}
                </p>
              </div>
              <div className="text-xs text-ink3 whitespace-nowrap">
                {new Date(notif.createdAt).toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminPanelPage: React.FC = () => {
  const navigate = useNavigate();
  const [loadingEducation, setLoadingEducation] = useState(true);
  const [educationData, setEducationData] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    analyticsApi
      .getEducation()
      .then((res) => {
        if (!alive) return;
        setEducationData((res.data as any).data || null);
      })
      .catch(() => {
        if (!alive) return;
        setEducationData(null);
      })
      .finally(() => {
        if (alive) setLoadingEducation(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const topEducationLevels = educationData?.educationLevels || [];
  const completionNote = educationData
    ? `${topEducationLevels.reduce(
        (sum: number, item: any) => sum + (item.count || 0),
        0,
      )} profile segments tracked`
    : "No onboarding metrics yet";

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <SectionHeader
        title="Admin panel"
        subtitle="A clean control surface for platform oversight, usage, and moderation."
        icon={<Workflow size={20} />}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminMetrics.map(([label, value]) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            icon={<Users size={18} />}
          />
        ))}
      </div>
      <Card className="p-7 border-primary/10 bg-linear-to-br from-surface via-surface to-primary/5">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-2xl font-bold font-serif text-ink">
              Onboarding analytics
            </h3>
            <p className="mt-1 text-sm text-ink3">
              Monitor education-level distribution and personalization coverage.
            </p>
          </div>
          <Badge variant="blue">{loadingEducation ? "Loading" : "Live"}</Badge>
        </div>
        {loadingEducation ? (
          <div className="py-10 flex items-center justify-center">
            <Spinner size={32} className="text-primary" />
          </div>
        ) : educationData ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border2 bg-surface2 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2">
                Education levels
              </p>
              <div className="space-y-2">
                {topEducationLevels.slice(0, 5).map((item: any) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-ink2">
                      {item._id || "Unspecified"}
                    </span>
                    <span className="font-bold text-ink">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border2 bg-surface2 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2">
                Top subjects
              </p>
              <div className="space-y-2">
                {(educationData.subjectCounts || [])
                  .slice(0, 5)
                  .map((item: any) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-ink2">
                        {item._id || "Unspecified"}
                      </span>
                      <span className="font-bold text-ink">{item.count}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border2 bg-surface2 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2">
                Curriculum systems
              </p>
              <div className="space-y-2">
                {(educationData.curriculumCounts || [])
                  .slice(0, 5)
                  .map((item: any) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-ink2">
                        {item._id || "Unspecified"}
                      </span>
                      <span className="font-bold text-ink">{item.count}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border2 bg-surface2 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3 mb-2">
                Programs
              </p>
              <div className="space-y-2">
                {(educationData.programCounts || [])
                  .slice(0, 5)
                  .map((item: any) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-ink2">
                        {item._id || "Unspecified"}
                      </span>
                      <span className="font-bold text-ink">{item.count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border2 bg-surface2 p-4 text-sm text-ink3">
            {completionNote}
          </div>
        )}
      </Card>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <Card className="p-7">
          <h3 className="text-2xl font-bold font-serif text-ink mb-4">
            Operations
          </h3>
          <div className="space-y-3">
            {[
              "Review access and account flags",
              "Monitor queue and job health",
              "Inspect AI usage and costs",
              "Coordinate product updates and support",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-border2 bg-surface2 p-4"
              >
                <ShieldCheck size={16} className="text-primary shrink-0" />
                <span className="text-sm text-ink2">{item}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-7">
          <h3 className="text-2xl font-bold font-serif text-ink mb-4">
            Shortcuts
          </h3>
          <div className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate({ to: "/dashboard" })}
            >
              <LayoutDashboard size={16} /> Open dashboard
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate({ to: "/analytics" })}
            >
              <Sparkles size={16} /> View analytics
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate({ to: "/settings" })}
            >
              <LockKeyhole size={16} /> User settings
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (_) {}
    clearAuth();
    navigate({ to: "/login" });
  };

  const handleDelete = async () => {
    setShowDeleteModal(true);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deletePassword) {
      toast.error("Enter your current password to confirm");
      return;
    }
    setDeleting(true);
    try {
      await userApi.deleteAccount(deletePassword);
      try {
        await authApi.logout();
      } catch (_) {}
      clearAuth();
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeletePassword("");
    }
  };

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [savingPw, setSavingPw] = useState(false);

  const handleChangePassword = async () => {
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <SectionHeader
        title="Profile"
        subtitle="A quick overview of your account and learning preferences."
        icon={<Users size={20} />}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Name"
          value={user?.name || "Student"}
          icon={<Users size={18} />}
        />
        <StatCard
          label="Level"
          value={user?.level || 1}
          icon={<Sparkles size={18} />}
        />
        <StatCard
          label="Subjects"
          value={user?.subjects?.length || 0}
          icon={<BookOpen size={18} />}
        />
      </div>
      <Card className="p-7">
        <h3 className="text-2xl font-bold font-serif text-ink mb-4">
          Profile snapshot
        </h3>
        <div className="flex gap-3 mb-6">
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            Log Out
          </Button>
          <Button variant="danger" onClick={handleDelete} className="gap-2">
            Delete Account
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border2 bg-surface2 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3">
              Preferred language
            </p>
            <p className="mt-2 text-sm font-semibold text-ink">
              {user?.preferredLanguage || "english"}
            </p>
          </div>
          <div className="rounded-2xl border border-border2 bg-surface2 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3">
              Timezone
            </p>
            <p className="mt-2 text-sm font-semibold text-ink">
              {(user as any)?.timezone || "Africa/Harare"}
            </p>
          </div>
        </div>
      </Card>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          />
          <Card className="z-60 p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Confirm Account Deletion</h3>
            <p className="text-sm text-ink3 mb-4">
              Enter your current password to permanently delete your account.
            </p>
            <Input
              type="password"
              placeholder="Current password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                loading={deleting}
              >
                Delete Account
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-7">
        <h3 className="text-2xl font-bold font-serif text-ink mb-4">
          Change Password
        </h3>
        <div className="space-y-4 max-w-md">
          <input
            type="password"
            placeholder="Current password"
            value={pwForm.currentPassword}
            onChange={(e) =>
              setPwForm((p) => ({ ...p, currentPassword: e.target.value }))
            }
            className="w-full bg-bg border border-border2 rounded-xl py-3.5 px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner"
          />
          <input
            type="password"
            placeholder="New password"
            value={pwForm.newPassword}
            onChange={(e) =>
              setPwForm((p) => ({ ...p, newPassword: e.target.value }))
            }
            className="w-full bg-bg border border-border2 rounded-xl py-3.5 px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={pwForm.confirm}
            onChange={(e) =>
              setPwForm((p) => ({ ...p, confirm: e.target.value }))
            }
            className="w-full bg-bg border border-border2 rounded-xl py-3.5 px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner"
          />
          <div className="pt-2">
            <Button
              size="lg"
              className="w-full"
              onClick={handleChangePassword}
              loading={savingPw}
            >
              Change Password
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
