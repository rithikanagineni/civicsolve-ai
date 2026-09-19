"use client";

import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone] ?? tones.slate}`}>
      {children}
    </span>
  );
}

export const priorityTone = (level: string) =>
  level === "CRITICAL" ? "rose" : level === "HIGH" ? "amber" : level === "MEDIUM" ? "sky" : "slate";

export function PriorityBadge({ level, score }: { level: string; score?: number }) {
  return (
    <Badge tone={priorityTone(level)}>
      {level}
      {typeof score === "number" ? ` · ${score}` : ""}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = ["COMPLETED", "CITIZEN_VALIDATION"].includes(status)
    ? "emerald"
    : ["ACCEPTED", "PROJECT_CREATED", "INDUSTRY_SUPPORT", "DEVELOPMENT", "TESTING", "IMPLEMENTATION"].includes(status)
      ? "indigo"
      : status === "UNIVERSITY_MATCHED"
        ? "violet"
        : "slate";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}

export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{label ?? "Progress"}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, icon, tone = "indigo" }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    indigo: "from-indigo-500/10 to-indigo-500/0 text-indigo-600",
    emerald: "from-emerald-500/10 to-emerald-500/0 text-emerald-600",
    amber: "from-amber-500/10 to-amber-500/0 text-amber-600",
    rose: "from-rose-500/10 to-rose-500/0 text-rose-600",
    sky: "from-sky-500/10 to-sky-500/0 text-sky-600",
  };
  return (
    <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${tones[tone] ?? tones.indigo} bg-white p-5 shadow-sm`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger" | "success" | "outline";
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const variants: Record<string, string> = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      } ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

export function Empty({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 text-center text-sm text-slate-500">{message}</div>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      <span className="h-3 w-3 animate-ping rounded-full bg-indigo-500" />
      {label}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
