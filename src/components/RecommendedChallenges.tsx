"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { apiError, get } from "@/lib/api";
import { Badge, Card, Empty, Loading, PriorityBadge, StatusBadge } from "@/components/ui";
import { useApp } from "@/context/AppContext";

export type UniMatch = { matchId: number; matchScore: number; reasons: string[]; matchStatus: string; challengeId: number; complaintCode: string; title: string; description: string; category: string; subcategory: string | null; location: string; status: string; priorityLevel: string; priorityScore: number; peopleAffected: number; votes: number; citizenName: string | null; requiredExpertise: string[]; summary: string | null };

/** Recommendation cards deliberately expose a single action: VIEW. Acceptance is
 * contextual, after the university has reviewed details and formed a team. */
export function RecommendedChallenges({ status = "RECOMMENDED", limit }: { status?: string; limit?: number }) {
  const { pushToast } = useApp();
  const [items, setItems] = useState<UniMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => { get<{ matches: UniMatch[] }>(`/universities/recommended?status=${status}`).then((d) => setItems(d.matches)).catch((e) => pushToast(apiError(e), "error")).finally(() => setLoading(false)); }, [status, pushToast]);
  useEffect(load, [load]);
  if (loading) return <Loading />;
  const list = limit ? items.slice(0, limit) : items;
  if (!list.length) return <Empty message={status === "ACCEPTED" ? "No accepted challenges yet." : "No recommended challenges right now."} />;
  return <div className="grid gap-4 lg:grid-cols-2">{list.map((m) => <Card key={m.matchId}>
    <div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-xs text-white">{m.complaintCode}</span><PriorityBadge level={m.priorityLevel} score={m.priorityScore} /><StatusBadge status={m.status} /><Badge tone="violet"><Sparkles className="h-3 w-3" /> AI Match {m.matchScore}%</Badge></div>
    <p className="mt-2 text-base font-semibold">{m.title}</p><p className="mt-1 line-clamp-2 text-sm text-slate-600">{m.summary ?? m.description}</p><p className="mt-2 text-xs text-slate-500">{m.location} · {m.peopleAffected.toLocaleString("en-IN")} affected</p>
    {m.requiredExpertise.length ? <div className="mt-2 flex flex-wrap gap-1">{m.requiredExpertise.map((x) => <Badge key={x} tone="indigo">{x}</Badge>)}</div> : null}
    <Link href={`/challenges/${m.challengeId}`} className="mt-4 inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50">VIEW</Link>
  </Card>)}</div>;
}
