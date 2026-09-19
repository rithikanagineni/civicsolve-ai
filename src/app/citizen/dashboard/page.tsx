"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Loader2, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChallengeCard } from "@/components/ChallengeCard";
import { EventRegistrationBoard } from "@/components/EventRegistrationBoard";
import { KnowledgeBaseBoard } from "@/components/KnowledgeBaseBoard";
import { Card, Empty, Loading, SectionTitle, StatCard } from "@/components/ui";
import { apiError, get } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import type { ChallengeSummary } from "@/types";

export default function CitizenDashboard() {
  const { t, user, pushToast } = useApp();
  const [items, setItems] = useState<ChallengeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<{ challenges: ChallengeSummary[] }>("/challenges/my")
      .then((d) => setItems(d.challenges))
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  const high = items.filter((c) => ["HIGH", "CRITICAL"].includes(c.priorityLevel)).length;
  const inProgress = items.filter((c) => !["REPORTED", "COMPLETED", "CITIZEN_VALIDATION"].includes(c.status)).length;
  const solved = items.filter((c) => ["COMPLETED", "CITIZEN_VALIDATION"].includes(c.status)).length;

  return (
    <AppShell role="CITIZEN">
      <div className="mb-6 rounded-[28px] border border-indigo-100 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 p-5 text-white shadow-[0_18px_40px_rgba(79,70,229,0.2)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100">Citizen workspace</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Namaste, {user?.fullName?.split(" ")[0]} 👋</h1>
            <p className="mt-2 text-sm text-indigo-100">Your problems, your AI analysis, your solutions — all in one place.</p>
          </div>
          <Link href="/citizen/report" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100">
            <Plus className="h-4 w-4" /> {t("reportProblem")}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("totalProblems")} value={items.length} icon={<ClipboardList className="h-5 w-5 text-indigo-600" />} />
        <StatCard label={t("highPriority")} value={high} tone="rose" icon={<AlertTriangle className="h-5 w-5 text-rose-600" />} />
        <StatCard label={t("inProgress")} value={inProgress} tone="amber" icon={<Loader2 className="h-5 w-5 text-amber-600" />} />
        <StatCard label={t("solved")} value={solved} tone="emerald" icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} />
      </div>

      <div className="mt-8">
        <SectionTitle
          title="My Reported Problems"
          subtitle="Only problems reported by your account (filtered server-side by citizen_id)"
          action={<Link href="/citizen/problems" className="text-sm font-medium text-indigo-700 hover:underline">View all →</Link>}
        />
        {loading ? <Loading /> : null}
        {!loading && items.length === 0 ? (
          <Empty message="You have not reported any problems yet. Use “Report a Problem” to start — voice input is supported." />
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {items.slice(0, 6).map((c) => (
            <ChallengeCard key={c.id} challenge={c} href={`/challenges/${c.id}`} />
          ))}
        </div>
      </div>

      <Card className="mt-8 bg-gradient-to-r from-slate-50 to-indigo-50">
        <h3 className="text-sm font-semibold text-slate-900">How CivicSolve works</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Report → AI understands → priority score → duplicate check → university match → acceptance → project &
          milestones → industry support → implementation → your validation.
        </p>
      </Card>

      <KnowledgeBaseBoard />
      <EventRegistrationBoard />
    </AppShell>
  );
}
