"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Card, Empty, Loading, Progress, SectionTitle, StatusBadge } from "@/components/ui";
import { apiError, get } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import type { ProjectSummary } from "@/types";

export default function CitizenProjectsPage() {
  const { pushToast } = useApp();
  const [items, setItems] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<{ projects: ProjectSummary[] }>("/projects")
      .then((d) => setItems(d.projects))
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  return (
    <AppShell role="CITIZEN">
      <SectionTitle title="Projects solving my problems" subtitle="Created when a university accepts your challenge" />
      {loading ? <Loading /> : null}
      {!loading && items.length === 0 ? <Empty message="No projects yet — a university project appears here once your challenge is accepted." /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((p) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-xs text-white">{p.complaintCode}</span>
              <StatusBadge status={p.status} />
              <Badge tone="indigo">{p.universityName}</Badge>
            </div>
            <Link href={`/projects/${p.id}`} className="mt-2 block text-base font-semibold hover:underline">{p.title}</Link>
            <p className="mt-1 text-sm text-slate-600">{p.description}</p>
            <div className="mt-3"><Progress value={p.progress} /></div>
            {p.supporters.length ? (
              <div className="mt-3 flex flex-wrap gap-1">
                {p.supporters.map((s) => (<Badge key={s.id} tone="emerald">{s.industryName} · {s.supportType}</Badge>))}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
