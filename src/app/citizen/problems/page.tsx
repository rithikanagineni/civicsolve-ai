"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Empty, Loading, SectionTitle, inputClass } from "@/components/ui";
import { apiError, get } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import type { ChallengeSummary } from "@/types";

export default function MyProblemsPage() {
  const { t, pushToast } = useApp();
  const [items, setItems] = useState<ChallengeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    get<{ challenges: ChallengeSummary[] }>("/challenges/my")
      .then((d) => setItems(d.challenges))
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  const filtered = items.filter((c) =>
    `${c.title} ${c.complaintCode} ${c.category} ${c.location}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell role="CITIZEN">
      <SectionTitle
        title={t("myProblems")}
        subtitle="GET /api/challenges/my — the backend filters by the authenticated citizen ID"
        action={<input className={`${inputClass} max-w-xs`} placeholder="Search my problems…" value={q} onChange={(e) => setQ(e.target.value)} />}
      />
      {loading ? <Loading /> : null}
      {!loading && filtered.length === 0 ? <Empty message="No problems found." /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((c) => (<ChallengeCard key={c.id} challenge={c} href={`/challenges/${c.id}`} />))}
      </div>
    </AppShell>
  );
}
