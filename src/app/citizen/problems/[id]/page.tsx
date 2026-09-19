"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ChallengeDetailView } from "@/components/ChallengeDetailView";
import { FeedbackForm } from "@/components/FeedbackForm";
import { Button } from "@/components/ui";
import { apiError, post } from "@/lib/api";
import { useApp } from "@/context/AppContext";

export default function CitizenProblemDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { pushToast } = useApp();

  return (
    <AppShell role="CITIZEN">
      <Link href="/citizen/problems" className="mb-4 inline-block text-sm text-slate-500 hover:underline">← My Problems</Link>
      <ChallengeDetailView
        challengeId={id}
        actions={(detail, reload) => (
          <>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await post(`/challenges/${id}/analyze`);
                  pushToast("AI re-analysis completed", "success");
                  reload();
                } catch (e) { pushToast(apiError(e), "error"); }
              }}
            >
              Re-run AI analysis
            </Button>
            {detail.project ? (
              <Link href={`/projects/${detail.project.id}`} className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50">
                Project workspace
              </Link>
            ) : null}
          </>
        )}
        footer={(detail, reload) =>
          ["COMPLETED", "CITIZEN_VALIDATION"].includes(detail.challenge.status) ? (
            <FeedbackForm challengeId={id} complaintCode={detail.challenge.complaintCode} onDone={reload} />
          ) : null
        }
      />
    </AppShell>
  );
}
