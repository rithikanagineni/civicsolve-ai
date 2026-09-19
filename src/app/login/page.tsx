"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, ClipboardList, ShieldCheck, Users, Wrench } from "lucide-react";
import { homeFor, useApp } from "@/context/AppContext";
import { Button, Field, inputClass } from "@/components/ui";
import { LANGUAGES } from "@/lib/i18n";

const ADMIN_EMAIL = "rithikanagineni021@gmail.com";
const ADMIN_PASSWORD = "Nagineni@123";

const QUICK = [
  { label: "Citizen", accent: "from-emerald-500 to-teal-500", icon: Users, description: "Report and track civic issues" },
  { label: "University", accent: "from-indigo-500 to-violet-500", icon: ClipboardList, description: "Review matched challenges" },
  { label: "Field Person", accent: "from-sky-500 to-blue-600", icon: Wrench, description: "Site visits, ground verification & reports" },
  { label: "Industry", accent: "from-amber-500 to-orange-500", icon: Building2, description: "Support impactful projects" },
  { label: "Admin", accent: "from-slate-700 to-slate-900", icon: ShieldCheck, description: "Platform administration sign-in" },
] as const;

export default function LoginPage() {
  const { login, t, language, setLanguage, pushToast } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPortal, setSelectedPortal] = useState<string>("Citizen");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isAdminPortal = selectedPortal === "Admin";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "expired") {
      setNotice("Your previous session is no longer valid. Please sign in again.");
      window.history.replaceState(null, "", "/login");
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await login(email.trim(), password);
      pushToast(`Welcome back, ${user.fullName}`, "success");
      router.push(homeFor(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  function selectPortal(portal: string) {
    setSelectedPortal(portal);
    if (portal === "Admin") {
      setEmail(ADMIN_EMAIL);
      setPassword(ADMIN_PASSWORD);
    } else if (portal === "Field Person") {
      setEmail("rahul.field@civicsolve.in");
      setPassword("demo1234");
    } else if (portal === "University") {
      setEmail("abc.university@civicsolve.in");
      setPassword("demo1234");
    } else if (portal === "Citizen") {
      setEmail("priya.citizen@civicsolve.in");
      setPassword("demo1234");
    } else if (portal === "Industry") {
      setEmail("urbaniot.industry@civicsolve.in");
      setPassword("demo1234");
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white lg:flex">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center text-sm text-slate-300 transition hover:text-white">← CivicSolve AI</Link>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Secure access</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight">{t("tagline")}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
              Four portals. One civic platform. Sign in to the workspace built for report, review, support, and governance.
            </p>

            <div className="mt-8 grid gap-3">
              {QUICK.map((q) => {
                const Icon = q.icon;
                const active = selectedPortal === q.label;
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => selectPortal(q.label)}
                    className={`rounded-2xl border p-3 text-left transition ${active ? "border-white/60 bg-white/10 shadow-lg shadow-indigo-900/20" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${q.accent}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{q.label} portal</p>
                        <p className="text-[11px] text-slate-400">{q.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Access notes</p>
            <p className="mt-2 text-sm text-slate-200">Each portal keeps the right user data, verification checks, and role-specific workspace access.</p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <form onSubmit={submit} className="w-full max-w-md space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Welcome back</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{t("login")}</h1>
              <p className="mt-1 text-sm text-slate-500">Access your CivicSolve workspace</p>
            </div>

            <Field label={t("chooseLanguage")}>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.native} — {l.label}</option>
                ))}
              </select>
            </Field>

            <Field label={t("email")}>
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={isAdminPortal} required />
            </Field>
            <Field label={t("password")}>
              <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} readOnly={isAdminPortal} required />
            </Field>

            {isAdminPortal ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-700 shadow-sm">
                <p className="font-semibold text-slate-900">Admin sign-in only</p>
                <p className="mt-1">Email: {ADMIN_EMAIL}</p>
                <p>Password: {ADMIN_PASSWORD}</p>
              </div>
            ) : null}

            {notice ? <p className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p> : null}
            {error ? <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

            <Button type="submit" disabled={busy} className="w-full rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-700 to-violet-600 px-4 py-3 text-base font-semibold shadow-lg shadow-indigo-200 hover:brightness-110">
              {busy ? "Signing in…" : t("login")}
            </Button>

            {!isAdminPortal ? (
              <p className="text-center text-sm text-slate-500">
                New here? <Link href="/register" className="font-medium text-indigo-700 hover:underline">{t("register")}</Link>
              </p>
            ) : (
              <p className="text-center text-sm text-slate-500">Admin access is restricted to the platform administrator account.</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
