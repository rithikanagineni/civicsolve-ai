"use client";

import { AppShell } from "@/components/AppShell";
import { AnalyticsView } from "@/components/AnalyticsView";
import { SectionTitle } from "@/components/ui";

export default function AdminDashboard() {
  return (
    <AppShell role="ADMIN">
      <div className="mb-6 rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">Admin workspace</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Platform overview</h1>
        <p className="mt-2 text-sm text-slate-300">CivicSolve AI · closed-loop civic innovation metrics</p>
      </div>
      <SectionTitle title="Platform overview" subtitle="CivicSolve AI · closed-loop civic innovation metrics" />
      <AnalyticsView />
    </AppShell>
  );
}
