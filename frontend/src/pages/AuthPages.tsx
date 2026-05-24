import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  GraduationCap as Cap,
  Lock,
  Mail,
  MoonStar,
  ShieldCheck,
  Sparkles,
  SunMedium,
  User,
} from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { Button, Card, Input } from "../components/ui";
import { authApi } from "../services/apiServices";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

const isStrongPassword = (value: string) =>
  value.length >= 8 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /[0-9]/.test(value) &&
  /[^A-Za-z0-9]/.test(value);

// ─── SIGNUP ──────────────────────────────────────────────────────────────────
export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    educationLevel: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2)
      e.name = "Full name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email format";
    if (!form.educationLevel) e.educationLevel = "Select your education level";
    if (!isStrongPassword(form.password)) {
      e.password = "Use 8+ chars with uppercase, lowercase, number, and symbol";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // include draftId if onboarding was completed anonymously
      try {
        const metaRaw = window.localStorage.getItem(
          "dzidzaai:onboarding:draftMeta",
        );
        if (metaRaw) {
          const parsed = JSON.parse(metaRaw);
          if (parsed?.draftId && parsed?.completed) {
            await authApi.signup({ ...form, draftId: parsed.draftId });
          } else {
            await authApi.signup(form);
          }
        } else {
          await authApi.signup(form);
        }
      } catch (e) {
        await authApi.signup(form);
      }
      toast.success("Registration initiated. Verify your identity.");
      navigate({ to: "/verify-email", search: { email: form.email } });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      sub="Create your account to access tutoring, revision, and analytics in one workspace"
    >
      <div className="space-y-4">
        <Input
          label="Full Legal Name"
          placeholder="e.g. Takudzwa Moyo"
          icon={<User size={18} />}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={errors.name}
        />
        <Input
          label="Email address"
          type="email"
          placeholder="student@dzidza.ai"
          icon={<Mail size={18} />}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          error={errors.email}
        />
        <Input
          label="Security Key"
          type="password"
          placeholder="8+ chars, upper, lower, number, symbol"
          icon={<Lock size={18} />}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          error={errors.password}
        />

        <div className="space-y-1.5 px-1">
          <label className="text-[10px] font-black text-ink3 uppercase tracking-[0.2em]">
            Academic Tier
          </label>
          <select
            className="input text-sm font-bold bg-bg"
            value={form.educationLevel}
            onChange={(e) =>
              setForm((f) => ({ ...f, educationLevel: e.target.value }))
            }
          >
            <option value="">Select level</option>
            {[
              "Primary School",
              "Secondary School",
              "O-Level",
              "A-Level",
              "College",
              "University",
              "Professional Certification",
              "Other",
            ].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          {errors.educationLevel && (
            <p className="mt-2 text-xs font-bold text-red-500">
              {errors.educationLevel}
            </p>
          )}
        </div>

        <Button
          className="w-full h-12 shadow-xl mt-4 gap-2"
          onClick={handleSubmit}
          loading={loading}
        >
          Register Student <Sparkles size={16} />
        </Button>

        <div className="pt-6 border-t border-border2 text-center">
          <p className="text-xs font-bold text-ink3 uppercase tracking-widest">
            Already have an account?{" "}
            <button
              onClick={() => navigate({ to: "/login" })}
              className="text-primary hover:underline transition-all"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const search = useSearch({ from: "/login" }) as { redirect?: string };
  const redirectTo = (search as any).redirect;
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError("Credentials required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authApi.login(form);
      const { user, accessToken, refreshToken } = (res.data as any).data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Access granted. Hello, ${user.name.split(" ")[0]}.`);
      navigate({
        to: user.onboardingCompleted
          ? redirectTo || "/dashboard"
          : "/onboarding",
      });
    } catch (err: any) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.message || "Authentication failed";
      if (code === "EMAIL_UNVERIFIED") {
        toast.error("Verification incomplete. Please verify your email.");
        navigate({ to: "/verify-email", search: { email: form.email } });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign in" sub="Authorize to continue your session">
      <div className="space-y-4">
        <Input
          label="Identification"
          type="email"
          placeholder="your@email.com"
          icon={<User size={18} />}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Input
          label="Security Key"
          type="password"
          placeholder="8+ chars, upper, lower, number, symbol"
          icon={<Lock size={18} />}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertTriangle size={16} className="text-red-500" />
            <p className="text-xs font-bold text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={() => navigate({ to: "/forgot-password" })}
          className="text-[10px] font-black uppercase tracking-widest text-right w-full text-ink3 hover:text-primary transition-colors"
        >
          Recover account?
        </button>

        <Button
          className="w-full h-12 shadow-xl mt-2 gap-2"
          onClick={handleSubmit}
          loading={loading}
        >
          Sign in <ShieldCheck size={18} />
        </Button>

        <div className="pt-6 border-t border-border2 text-center">
          <p className="text-xs font-bold text-ink3 uppercase tracking-widest">
            New here?{" "}
            <button
              onClick={() => navigate({ to: "/onboarding" })}
              className="text-secondary hover:underline transition-all"
            >
              Create account
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const search = useSearch({ from: "/verify-email" }) as any;
  const email = search.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("6-digit vector required");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.verifyEmail({ email, otp });
      const { user, accessToken, refreshToken } = (res.data as any).data;
      setAuth(user, accessToken, refreshToken);
      toast.success("Verification confirmed. Welcome aboard.");
      navigate({ to: user.onboardingCompleted ? "/dashboard" : "/onboarding" });
    } catch (err: any) {
      toast.error("Checksum mismatch: Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authApi.resendOTP(email);
      toast.success("Verification code sent");
    } catch {
      toast.error("Could not send code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout title="Verify email" sub={`Verification code sent to ${email}`}>
      <div className="space-y-6">
        <div className="space-y-1.5 px-1">
          <label className="text-[10px] font-black text-ink3 uppercase tracking-[0.2em] mb-2 block">
            Checksum Vector (6-Digits)
          </label>
          <input
            className="w-full bg-bg border border-border2 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.5em] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-inner"
            placeholder="000000"
            value={otp}
            maxLength={6}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
        </div>

        <Button
          className="w-full h-12 shadow-xl"
          onClick={handleVerify}
          loading={loading}
        >
          Confirm Verification
        </Button>

        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-[10px] font-black uppercase tracking-widest text-secondary hover:underline disabled:opacity-50"
          >
            {resendLoading ? "Sending..." : "Didn't receive a code? Send again"}
          </button>
        </div>

        <button
          onClick={() => navigate({ to: "/login" })}
          className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-ink3 hover:text-ink w-full pt-4 border-t border-border2"
        >
          <ArrowLeft size={12} /> Return to login
        </button>
      </div>
    </AuthLayout>
  );
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ otp: "", newPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast.success("Recovery sequence initiated");
      setStep("reset");
    } catch {
      toast.error("Operation failure");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!form.otp || !form.newPassword) return;
    setLoading(true);
    try {
      await authApi.resetPassword({
        email,
        otp: form.otp,
        newPassword: form.newPassword,
      });
      toast.success("Security keys re-initialized. Log in.");
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === "email" ? "Account recovery" : "Reset password"}
      sub={
        step === "email"
          ? "Enter your email to receive a reset code"
          : `Reset code sent to ${email}`
      }
    >
      <div className="space-y-6">
        {step === "email" ? (
          <>
            <Input
              label="Identification"
              type="email"
              placeholder="operator@email.com"
              icon={<User size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button
              className="w-full h-12 shadow-xl gap-2"
              onClick={handleSend}
              loading={loading}
            >
              Send recovery code <Activity size={16} />
            </Button>
          </>
        ) : (
          <>
            <Input
              label="Recovery code"
              placeholder="000000"
              maxLength={6}
              value={form.otp}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  otp: e.target.value.replace(/\D/g, ""),
                }))
              }
            />
            <Input
              label="New password"
              type="password"
              placeholder="8+ chars, upper, lower, number, symbol"
              icon={<Lock size={18} />}
              value={form.newPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, newPassword: e.target.value }))
              }
            />
            <Button
              className="w-full h-12 shadow-xl"
              onClick={handleReset}
              loading={loading}
            >
              Update password
            </Button>
          </>
        )}
        <button
          onClick={() => navigate({ to: "/login" })}
          className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-ink3 hover:text-ink w-full pt-4 border-t border-border2"
        >
          <ArrowLeft size={12} /> Back to login
        </button>
      </div>
    </AuthLayout>
  );
};

// ─── AUTH LAYOUT ──────────────────────────────────────────────────────────────
const AuthLayout: React.FC<{
  title: string;
  sub: string;
  children: React.ReactNode;
}> = ({ title, sub, children }) => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[100px] rounded-full" />
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-8 right-8 w-10 h-10 rounded-xl bg-surface border border-border2 shadow-soft flex items-center justify-center text-ink2 hover:text-primary transition-all z-50"
      >
        {isDark ? <SunMedium size={18} /> : <MoonStar size={18} />}
      </button>

      <div className="w-full max-w-110 z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-8 group">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform duration-500">
              <Cap size={24} />
            </div>
            <h1 className="text-2xl font-black font-serif text-ink tracking-tight">
              DzidzaAI
            </h1>
          </div>

          <h2 className="text-3xl font-black font-serif text-ink mb-2 tracking-tight">
            {title}
          </h2>
          <p className="text-xs font-bold text-ink3 uppercase tracking-[0.2em]">
            {sub}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            ["Secure access", "Encrypted sign-in and recovery flows."],
            ["Fast onboarding", "Create an account or verify in one flow."],
            [
              "Study continuity",
              "Your preferences carry across every session.",
            ],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="rounded-2xl border border-border2 bg-bg/70 px-4 py-3 text-left shadow-soft"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink3">
                {title}
              </p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-ink2">
                {desc}
              </p>
            </div>
          ))}
        </div>

        <Card className="p-8 shadow-2xl border-border2 bg-surface/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-700">
          {children}
        </Card>

        <div className="mt-12 flex items-center justify-center gap-8 text-[10px] font-black text-ink3 uppercase tracking-widest opacity-60">
          <span className="hover:text-primary cursor-pointer transition-colors">
            Privacy
          </span>
          <span className="hover:text-primary cursor-pointer transition-colors">
            Academic standards
          </span>
          <span className="hover:text-primary cursor-pointer transition-colors">
            Support
          </span>
        </div>
      </div>
    </div>
  );
};
