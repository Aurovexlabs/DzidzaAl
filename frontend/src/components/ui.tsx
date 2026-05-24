import { clsx } from "clsx";
import React from "react";

// ─── BUTTON ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "glass";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading,
  children,
  className,
  disabled,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-transparent focus-visible:ring-4 focus-visible:ring-primary/15 outline-hidden";

  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md active:scale-[0.99]",
    secondary:
      "bg-secondary text-white hover:bg-secondary-light shadow-sm hover:shadow-md active:scale-[0.99]",
    outline:
      "bg-transparent border border-border2 text-ink hover:bg-surface2 hover:border-primary/25",
    ghost: "bg-transparent text-ink3 hover:bg-surface2 hover:text-ink",
    danger:
      "bg-danger text-white hover:brightness-95 shadow-sm active:scale-[0.99]",
    glass:
      "bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/10 text-ink dark:text-white hover:bg-white/75 dark:hover:bg-white/15",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base",
    icon: "w-10 h-10 p-0",
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        children
      )}
    </button>
  );
};

// ─── INPUT ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<
  HTMLInputElement | HTMLTextAreaElement
> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  as?: "input" | "textarea";
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className,
  as = "input",
  ...props
}) => {
  const Component = as as any;
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-[10px] font-black text-ink3 uppercase tracking-[0.2em] ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink3 group-focus-within:text-primary transition-colors">
            {icon}
          </span>
        )}
        <Component
          className={clsx(
            "input w-full rounded-xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-hidden transition-all",
            icon && "pl-11",
            error && "border-red-500 focus:ring-red-500/10",
            as === "textarea" && "min-h-30 resize-none",
            className,
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-500 mt-0.5 ml-1 animate-slide-in">
          {error}
        </p>
      )}
    </div>
  );
};

// ─── CARD ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: "default" | "glass" | "outline";
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  hoverable,
  variant = "default",
  style,
}) => {
  const variants = {
    default: "surface-card",
    glass:
      "bg-surface/80 backdrop-blur-xl border border-white/15 dark:border-white/8 shadow-2xl rounded-[1.5rem]",
    outline:
      "bg-transparent border border-dashed border-border2 rounded-[1.25rem]",
  };

  return (
    <div
      className={clsx(
        "rounded-[1.25rem] p-6 transition-all duration-300",
        variants[variant],
        hoverable &&
          "cursor-pointer hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/20",
        className,
      )}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};

// ─── BADGE ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  variant?: "blue" | "green" | "amber" | "red" | "purple" | "teal" | "neutral";
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "blue",
  children,
  className,
}) => {
  const variants = {
    blue: "bg-primary/10 text-primary border border-primary/10",
    green: "bg-secondary/10 text-secondary border border-secondary/10",
    amber: "bg-warn/10 text-warn border border-warn/10",
    red: "bg-danger/10 text-danger border border-danger/10",
    purple: "bg-surface2 text-ink2 border border-border2",
    teal: "bg-secondary/10 text-secondary border border-secondary/10",
    neutral: "bg-surface2 text-ink3 border border-border2",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};

// ─── SPINNER ──────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className,
}) => (
  <div
    className={clsx(
      "animate-spin rounded-full border-2 border-current border-t-transparent",
      className,
    )}
    style={{ width: size, height: size }}
  />
);

// ─── MODAL ────────────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) => {
  if (!isOpen) return null;
  const widths = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={clsx(
          "surface-card animate-fade-in w-full overflow-hidden",
          widths[size],
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-8 border-b border-border2">
            <h3 className="text-2xl font-black font-serif text-ink tracking-tight">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-3 rounded-2xl text-ink3 hover:text-ink hover:bg-surface2 transition-all"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-8 overflow-y-auto max-h-[80vh] scrollbar-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
interface ProgressProps {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressProps> = ({
  value,
  max = 100,
  color,
  label,
  showPercent,
  className,
}) => {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  const fill = color || "var(--accent)";

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <div className="flex justify-between items-center px-1">
        {label && (
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
            {label}
          </span>
        )}
        {showPercent && (
          <span className="text-[10px] font-black text-primary tracking-tighter">
            {pct}%
          </span>
        )}
      </div>
      <div className="h-2 w-full bg-surface2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: fill }}
        />
      </div>
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: React.ReactNode;
  value: string | number;
  icon?: React.ReactNode;
  sub?: string;
  subColor?: "up" | "down" | "neutral";
  trend?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  sub,
  subColor = "neutral",
  trend,
}) => {
  const subClasses = {
    up: "text-secondary bg-secondary/10",
    down: "text-red-500 bg-red-500/10",
    neutral: "text-text-secondary bg-surface2",
  };

  return (
    <Card
      className="flex flex-col h-full border-border2 group hover:border-primary/20"
      hoverable
    >
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 rounded-2xl bg-surface2 border border-border2 text-primary transition-transform group-hover:scale-110">
          {icon || <div className="w-5 h-5" />}
        </div>
        {sub && (
          <span
            className={clsx(
              "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest",
              subClasses[subColor],
            )}
          >
            {sub}
          </span>
        )}
      </div>
      <div className="mt-auto">
        <p className="text-[10px] font-black text-ink3 uppercase tracking-[0.2em] mb-1.5">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-ink tracking-tighter">
            {value}
          </p>
          {trend !== undefined && (
            <span
              className={clsx(
                "text-xs font-bold",
                trend >= 0 ? "text-secondary" : "text-red-500",
              )}
            >
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, subtitle, action, icon }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <h2 className="text-3xl font-bold font-serif text-ink tracking-tight">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="text-sm font-medium text-ink3 max-w-xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

// ─── SKELETON ─────────────────────────────────────────────────────────────────
export const Skeleton: React.FC<{
  className?: string;
  variant?: "text" | "circle" | "rect";
}> = ({ className, variant = "rect" }) => (
  <div
    className={clsx(
      "animate-pulse bg-surface2",
      variant === "circle" ? "rounded-full" : "rounded-xl",
      className,
    )}
  />
);

// ─── TYPING INDICATOR ─────────────────────────────────────────────────────────
export const TypingIndicator: React.FC = () => (
  <div className="flex gap-1.5 p-4 px-5 bg-surface border border-border2 rounded-2xl w-fit animate-in fade-in zoom-in-95 duration-300 shadow-soft">
    <div
      className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce"
      style={{ animationDelay: "0ms" }}
    />
    <div
      className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
      style={{ animationDelay: "200ms" }}
    />
    <div
      className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-bounce"
      style={{ animationDelay: "400ms" }}
    />
  </div>
);

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <Card
    variant="outline"
    className="flex flex-col items-center justify-center py-24 text-center group"
  >
    <div className="w-20 h-20 rounded-4xl bg-surface border border-border2 text-ink3 flex items-center justify-center mb-8 transition-all group-hover:scale-110 group-hover:text-primary group-hover:border-primary/20">
      {icon}
    </div>
    <h3 className="text-xl font-bold font-serif text-ink mb-3 tracking-tight">
      {title}
    </h3>
    {description && (
      <p className="text-ink3 mb-10 max-w-sm leading-relaxed text-sm font-medium">
        {description}
      </p>
    )}
    {action}
  </Card>
);
