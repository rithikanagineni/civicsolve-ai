"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardCheck, FolderKanban, Handshake, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EventRegistrationBoard } from "@/components/EventRegistrationBoard";
import { KnowledgeBaseBoard } from "@/components/KnowledgeBaseBoard";
import { RecommendedChallenges, type UniMatch } from "@/components/RecommendedChallenges";
import { Loading, SectionTitle, StatCard } from "@/components/ui";
import { apiError, get } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import type { ProjectSummary } from "@/types";

export default function UniversityDashboard() {
  const { user, pushToast } = useApp();
  const [matches, setMatches] = useState<UniMatch[]>([]);
  const [accepted, setAccepted] = useState<UniMatch[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      get<{ matches: UniMatch[] }>("/universities/recommended?status=RECOMMENDED"),
      get<{ matches: UniMatch[] }>("/universities/recommended?status=ACCEPTED"),
      get<{ projects: ProjectSummary[] }>("/projects"),
    ])
      .then(([r, a, p]) => { setMatches(r.matches); setAccepted(a.matches); setProjects(p.projects); })
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  const pendingSupport = projects.reduce((acc, p) => acc + p.supporters.filter((s) => s.status === "REQUESTED").length, 0);

  return (
    <AppShell role="UNIVERSITY">
      <div className="mb-6 rounded-[28px] border border-violet-100 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 p-5 text-white shadow-[0_18px_40px_rgba(99,102,241,0.18)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-100">University workspace</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{user?.organizationName ?? user?.fullName}</h1>
        <p className="mt-2 text-sm text-violet-100">AI-matched civic challenges for your departments and student teams.</p>
      </div>

      {loading ? <Loading /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Recommended challenges" value={matches.length} icon={<Sparkles className="h-5 w-5 text-indigo-600" />} />
          <StatCard label="Accepted challenges" value={accepted.length} tone="emerald" icon={<ClipboardCheck className="h-5 w-5 text-emerald-600" />} />
          <StatCard label="Projects" value={projects.length} tone="sky" icon={<FolderKanban className="h-5 w-5 text-sky-600" />} />
          <StatCard label="Pending industry support" value={pendingSupport} tone="amber" icon={<Handshake className="h-5 w-5 text-amber-600" />} />
        </div>
      )}

      <div className="mt-8">
        <SectionTitle
          title="Recommended challenges"
          subtitle="Ranked by explainable AI match score against your expertise"
          action={<Link href="/university/challenges" className="text-sm font-medium text-indigo-700 hover:underline">View all →</Link>}
        />
        <RecommendedChallenges limit={4} />
      </div>

      <KnowledgeBaseBoard />
      <EventRegistrationBoard />
    </AppShell>
  );
}
