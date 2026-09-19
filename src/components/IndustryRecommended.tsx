"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Handshake, Sparkles } from "lucide-react";
import { apiError, get, post } from "@/lib/api";
import { Badge, Button, Card, Empty, Loading, Progress, StatusBadge, inputClass } from "@/components/ui";
import { useApp } from "@/context/AppContext";

export type IndustryMatch = {
  projectId: number;
  title: string;
  status: string;
  progress: number;
  universityName: string;
  challengeId: number;
  complaintCode: string;
  challengeTitle: string;
  category: string;
  location: string;
  priorityLevel: string;
  requiredTech: string[];
  matchScore: number;
  reasons: string[];
  mySupportStatus: string | null;
  mySupportId: number | null;
};

const SUPPORT_TYPES = ["Technology", "Mentorship", "Hardware", "Software", "Funding", "Infrastructure", "Deployment", "Expertise"];

export function IndustryRecommended({ limit, onLoaded }: { limit?: number; onLoaded?: (items: IndustryMatch[]) => void }) {
  const { pushToast } = useApp();
  const [items, setItems] = useState<IndustryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    get<{ projects: IndustryMatch[] }>("/industry/recommended")
      .then((d) => { setItems(d.projects); onLoaded?.(d.projects); })
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushToast]);

  useEffect(load, [load]);

  async function support(p: IndustryMatch) {
    try {
      await post(`/projects/${p.projectId}/industry-support`, {
        supportType: type[p.projectId] ?? "Technology",
        description: `${type[p.projectId] ?? "Technology"} support for ${p.title}`,
      });
      pushToast("You are now supporting this project", "success");
      load();
    } catch (e) {
      pushToast(apiError(e), "error");
    }
  }

  if (loading) return <Loading />;
  const list = limit ? items.slice(0, limit) : items;
  if (list.length === 0) return <Empty message="No recommended projects yet." />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {list.map((p) => (
        <Card key={p.projectId}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-xs text-white">{p.complaintCode}</span>
            <StatusBadge status={p.status} />
            <Badge tone="violet"><Sparkles className="h-3 w-3" /> {p.matchScore}% match</Badge>
            <Badge tone="slate">{p.category}</Badge>
          </div>
          <Link href={`/projects/${p.projectId}`} className="mt-2 block text-base font-semibold hover:underline">{p.title}</Link>
          <p className="mt-1 text-sm text-slate-600">University: {p.universityName} · {p.location}</p>
          {p.requiredTech.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {p.requiredTech.map((t) => (<Badge key={t} tone="indigo">{t}</Badge>))}
            </div>
          ) : null}
          <ul className="mt-2 space-y-0.5 text-xs text-slate-600">
            {p.reasons.slice(0, 3).map((r, index) => (<li key={`${p.projectId}-${index}-${r}`}>✓ {r}</li>))}
          </ul>
          <div className="mt-3"><Progress value={p.progress} /></div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {p.mySupportStatus ? (
              <Badge tone={p.mySupportStatus === "ACTIVE" ? "emerald" : "amber"}>Your support: {p.mySupportStatus}</Badge>
            ) : (
              <>
                <select className={`${inputClass} max-w-[160px]`} value={type[p.projectId] ?? "Technology"} onChange={(e) => setType((prev) => ({ ...prev, [p.projectId]: e.target.value }))}>
                  {SUPPORT_TYPES.map((s) => (<option key={s}>{s}</option>))}
                </select>
                <Button variant="success" onClick={() => support(p)}><Handshake className="h-4 w-4" /> Support Project</Button>
              </>
            )}
            <Link href={`/projects/${p.projectId}`} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50">Open</Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
