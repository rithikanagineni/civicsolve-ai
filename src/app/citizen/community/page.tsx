"use client";

import { useCallback, useEffect, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Button, Empty, Loading, SectionTitle } from "@/components/ui";
import { apiError, get, post } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import type { ChallengeSummary } from "@/types";

export default function CommunityPage() {
  const { t, pushToast } = useApp();
  const [items, setItems] = useState<ChallengeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    get<{ challenges: ChallengeSummary[] }>("/challenges")
      .then((d) => setItems(d.challenges))
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  useEffect(load, [load]);

  async function vote(id: number) {
    try {
      await post(`/challenges/${id}/vote`);
      pushToast("Thanks for supporting this problem", "success");
      load();
    } catch (e) {
      pushToast(apiError(e), "error");
    }
  }

  return (
    <AppShell role="CITIZEN">
      <SectionTitle title="Community problems" subtitle="Support problems reported by others — community votes feed the AI priority score" />
      {loading ? <Loading /> : null}
      {!loading && items.length === 0 ? <Empty message="No community problems yet." /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((c) => (
          <ChallengeCard
            key={c.id}
            challenge={c}
            actions={
              <Button size="sm" variant="outline" onClick={() => vote(c.id)}>
                <ThumbsUp className="h-3.5 w-3.5" /> {t("supportProblem")} ({c.votes})
              </Button>
            }
          />
        ))}
      </div>
    </AppShell>
  );
}
