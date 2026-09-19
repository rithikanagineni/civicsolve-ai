"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiError, get } from "@/lib/api";
import { Badge, Card, Empty, Loading, Progress, StatusBadge } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import type { ProjectSummary } from "@/types";

export function ProjectsList({ scope }: { scope?: string }) {
  const { pushToast } = useApp();
  const [items, setItems] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<{ projects: ProjectSummary[] }>(`/projects${scope ? `?scope=${scope}` : ""}`)
      .then((d) => setItems(d.projects))
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [scope, pushToast]);

  if (loading) return <Loading />;
  if (items.length === 0) return <Empty message="No projects yet." />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((p) => (
        <Card key={p.id}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-xs text-white">{p.complaintCode}</span>
            <StatusBadge status={p.status} />
            <Badge tone="indigo">{p.universityName}</Badge>
            <Badge tone="slate">{p.category}</Badge>
          </div>
          <Link href={`/projects/${p.id}`} className="mt-2 block text-base font-semibold hover:underline">{p.title}</Link>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.description}</p>
          <p className="mt-2 text-xs text-slate-500">Challenge: {p.challengeTitle} · {p.location}</p>
          <div className="mt-3"><Progress value={p.progress} /></div>
          {p.supporters.length ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {p.supporters.map((s) => (<Badge key={s.id} tone={s.status === "ACTIVE" ? "emerald" : "amber"}>{s.industryName} · {s.supportType} · {s.status}</Badge>))}
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
