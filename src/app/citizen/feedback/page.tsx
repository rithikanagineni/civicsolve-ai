"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FeedbackForm } from "@/components/FeedbackForm";
import { Badge, Card, Empty, Loading, SectionTitle, StatusBadge } from "@/components/ui";
import { apiError, get } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import type { ChallengeSummary } from "@/types";

type Feedback = { id: number; challengeId: number; rating: number; comment: string | null; resolved: boolean; suggestion: string | null; createdAt: string };

export default function CitizenFeedbackPage() {
  const { pushToast } = useApp();
  const [items, setItems] = useState<ChallengeSummary[]>([]);
  const [history, setHistory] = useState<Record<number, Feedback[]>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await get<{ challenges: ChallengeSummary[] }>("/challenges/my");
      const completed = d.challenges.filter((c) => ["COMPLETED", "CITIZEN_VALIDATION"].includes(c.status));
      setItems(completed);
      const entries = await Promise.all(
        completed.map(async (c) => [c.id, (await get<{ feedback: Feedback[] }>(`/challenges/${c.id}/feedback`)).feedback] as const),
      );
      setHistory(Object.fromEntries(entries));
    } catch (e) {
      pushToast(apiError(e), "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => { void load(); }, [load]);

  return (
    <AppShell role="CITIZEN">
      <SectionTitle title="Feedback & satisfaction history" subtitle="Citizen validation is the final layer of the CivicSolve loop" />
      {loading ? <Loading /> : null}
      {!loading && items.length === 0 ? <Empty message="No completed projects awaiting your validation yet." /> : null}
      <div className="space-y-6">
        {items.map((c) => (
          <div key={c.id} className="space-y-3">
            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-xs text-white">{c.complaintCode}</span>
                <StatusBadge status={c.status} />
                <Badge tone="indigo">{c.acceptedUniversity ?? "University"}</Badge>
              </div>
              <p className="mt-2 font-semibold">{c.title}</p>
              {history[c.id]?.length ? (
                <div className="mt-3 space-y-2">
                  {history[c.id].map((f) => (
                    <div key={f.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                      <p className="font-medium text-amber-600">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)} · Resolved: {f.resolved ? "YES" : "NO"}</p>
                      {f.comment ? <p className="text-slate-600">{f.comment}</p> : null}
                      {f.suggestion ? <p className="text-xs text-slate-500">Suggestion: {f.suggestion}</p> : null}
                      <p className="text-[11px] text-slate-400">{new Date(f.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
            {!history[c.id]?.length ? <FeedbackForm challengeId={c.id} complaintCode={c.complaintCode} onDone={load} /> : null}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
