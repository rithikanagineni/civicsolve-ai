"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Empty, Loading, SectionTitle, inputClass } from "@/components/ui";
import { apiError, get } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import type { ChallengeSummary } from "@/types";

export default function AdminChallengesPage() {
  const { pushToast } = useApp();
  const [items, setItems] = useState<ChallengeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [priority, setPriority] = useState("ALL");
  const [q, setQ] = useState("");

  useEffect(() => {
    get<{ challenges: ChallengeSummary[] }>("/challenges")
      .then((d) => setItems(d.challenges))
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  const filtered = items
    .filter((c) => priority === "ALL" || c.priorityLevel === priority)
    .filter((c) => `${c.title} ${c.complaintCode} ${c.category} ${c.location} ${c.citizenName ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell role="ADMIN">
      <SectionTitle
        title="All challenges"
        subtitle="Every citizen problem with AI analysis, priority and university acceptance"
        action={
          <div className="flex gap-2">
            <input className={`${inputClass} max-w-[220px]`} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className={`${inputClass} max-w-[150px]`} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (<option key={p}>{p}</option>))}
            </select>
          </div>
        }
      />
      {loading ? <Loading /> : null}
      {!loading && filtered.length === 0 ? <Empty message="No challenges found." /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((c) => (<ChallengeCard key={c.id} challenge={c} href={`/challenges/${c.id}`} />))}
      </div>
    </AppShell>
  );
}
