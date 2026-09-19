"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity, BarChart3, Bell, BookOpen, Building2, CalendarRange, ClipboardList,
  FileCheck2, FileText, FolderKanban, GraduationCap, Handshake, Home,
  LayoutDashboard, LogOut, MapPin, MessageSquareHeart, Mic, Rocket, ShieldCheck,
  Sparkles, Users,
} from "lucide-react";
import { get } from "@/lib/api";
import { homeFor, useApp, type Role } from "@/context/AppContext";
import { LANGUAGES } from "@/lib/i18n";
import { PortalAssistant } from "@/components/PortalAssistant";

type NavItem = { href: string; label: string; icon: ReactNode };

const icon = (I: typeof Home) => <I className="h-4 w-4" />;

function navFor(role: Role, t: (k: string) => string): NavItem[] {
  if (role === "CITIZEN")
    return [
      { href: "/citizen/dashboard", label: t("dashboard"), icon: icon(LayoutDashboard) },
      { href: "/citizen/report", label: t("reportProblem"), icon: icon(Mic) },
      { href: "/citizen/problems", label: t("myProblems"), icon: icon(ClipboardList) },
      { href: "/citizen/events", label: "Events", icon: icon(CalendarRange) },
      { href: "/citizen/projects", label: t("projects"), icon: icon(FolderKanban) },
      { href: "/citizen/community", label: t("community"), icon: icon(Users) },
      { href: "/citizen/feedback", label: t("feedback"), icon: icon(MessageSquareHeart) },
      { href: "/citizen/notifications", label: t("notifications"), icon: icon(Bell) },
      { href: "/citizen/profile", label: t("profile"), icon: icon(ShieldCheck) },
    ];
  if (role === "UNIVERSITY")
    return [
      { href: "/university/dashboard", label: "Dashboard", icon: icon(LayoutDashboard) },
      { href: "/university/challenges", label: "Recommended", icon: icon(Sparkles) },
      { href: "/university/accepted", label: "Accepted", icon: icon(ClipboardList) },
      { href: "/university/projects", label: "Projects", icon: icon(FolderKanban) },
      { href: "/university/collaboration", label: "Collaboration", icon: icon(Users) },
      { href: "/university/field-persons", label: "Field persons", icon: icon(MapPin) },
      { href: "/university/events", label: "Events", icon: icon(CalendarRange) },
      { href: "/university/team", label: "Profile", icon: icon(GraduationCap) },
      { href: "/university/notifications", label: "Notifications", icon: icon(Bell) },
    ];
  if (role === "INDUSTRY")
    return [
      { href: "/industry/dashboard", label: "Dashboard", icon: icon(LayoutDashboard) },
      { href: "/industry/projects", label: "Recommended Projects", icon: icon(FolderKanban) },
      { href: "/industry/responders", label: "Responder Match", icon: icon(Users) },
      { href: "/industry/tasks", label: "Tasks", icon: icon(Rocket) },
      { href: "/industry/events", label: "Events", icon: icon(CalendarRange) },
      { href: "/industry/support", label: "My Support", icon: icon(Handshake) },
      { href: "/industry/notifications", label: "Notifications", icon: icon(Bell) },
      { href: "/industry/profile", label: "Profile", icon: icon(Building2) },
    ];
  if (role === "FIELD_PERSON")
    return [
      { href: "/field/dashboard", label: "Dashboard", icon: icon(LayoutDashboard) },
      { href: "/field/assignments", label: "My Assignments", icon: icon(ClipboardList) },
      { href: "/field/visits", label: "Visits", icon: icon(MapPin) },
      { href: "/field/reports", label: "Field Reports", icon: icon(FileText) },
      { href: "/field/notifications", label: "Notifications", icon: icon(Bell) },
      { href: "/field/profile", label: "My Profile", icon: icon(ShieldCheck) },
    ];
  return [
    { href: "/admin/dashboard", label: "Dashboard", icon: icon(LayoutDashboard) },
    { href: "/admin/users", label: "Users", icon: icon(Users) },
    { href: "/admin/challenges", label: "Challenges", icon: icon(ClipboardList) },
    { href: "/admin/projects", label: "Projects", icon: icon(FolderKanban) },
    { href: "/admin/events", label: "Events", icon: icon(CalendarRange) },
    { href: "/admin/analytics", label: "Analytics", icon: icon(BarChart3) },
    { href: "/admin/impact", label: "Impact Reports", icon: icon(FileText) },
  ];
}

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const { user, ready, logout, t, language, setLanguage, login } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace(homeFor(user.role));
  }, [ready, user, role, router]);

  useEffect(() => {
    if (!user) return;
    get<{ unread: number }>("/notifications")
      .then((d) => setUnread(d.unread))
      .catch(() => setUnread(0));
  }, [user, pathname]);

  if (!ready || !user || user.role !== role) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading CivicSolve…</div>;
  }

  const nav = navFor(role, t);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.10),_transparent_25%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-slate-950 text-slate-100 lg:flex">
        <Link href="/" className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-sm font-black text-white shadow-lg shadow-indigo-500/30">
            CS
          </div>
          <div>
            <p className="text-sm font-semibold text-white">CivicSolve AI</p>
            <p className="text-[11px] text-slate-400">{role.toLowerCase()} workspace</p>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                  active ? "bg-white text-slate-900 shadow-md" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                {item.href.includes("notifications") && unread > 0 ? (
                  <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{unread}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 p-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native}
              </option>
            ))}
          </select>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-300">
            <LogOut className="h-4 w-4" /> {t("logout")}
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl lg:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.organizationName ?? user.fullName}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {role === "UNIVERSITY" && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await login("rahul.field@civicsolve.in", "demo1234");
                    router.push("/field/dashboard");
                  } catch {
                    router.push("/login");
                  }
                }}
                className="hidden items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100 sm:flex"
                title="Quick switch to Rahul Kumar's Field Person workspace"
              >
                <span>👷 Switch to Field Portal</span>
              </button>
            )}
            {role === "FIELD_PERSON" && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await login("abc.university@civicsolve.in", "demo1234");
                    router.push("/university/dashboard");
                  } catch {
                    router.push("/login");
                  }
                }}
                className="hidden items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100 sm:flex"
                title="Quick switch to University workspace"
              >
                <span>🏛️ Switch to University Portal</span>
              </button>
            )}
            <Link href={`/${role.toLowerCase()}/notifications`} className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50">
              <Bell className="h-4 w-4" />
              {unread > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{unread}</span> : null}
            </Link>
            <button onClick={logout} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white/80 px-4 py-2 backdrop-blur-lg lg:hidden">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
              {item.label}
            </Link>
          ))}
        </div>
        <main className="mx-auto max-w-7xl p-4 lg:p-8">{children}</main>
      </div>
      <PortalAssistant role={role} />
    </div>
  );
}
