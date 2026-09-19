"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ChallengeDetailView } from "@/components/ChallengeDetailView";
import { UniversityFieldWorkflow } from "@/components/UniversityFieldWorkflow";
import { Button } from "@/components/ui";
import { apiError, post } from "@/lib/api";
import { useApp } from "@/context/AppContext";

export default function SharedChallengeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user, pushToast } = useApp();
  const role = user?.role ?? "CITIZEN";
  const back =
    role === "UNIVERSITY"
      ? "/university/challenges"
      : role === "INDUSTRY"
      ? "/industry/projects"
      : role === "FIELD_PERSON"
      ? "/field/dashboard"
      : role === "ADMIN"
      ? "/admin/challenges"
      : "/citizen/problems";

  return (
    <AppShell role={role}>
      <Link href={back} className="mb-4 inline-block text-sm text-slate-500 hover:underline">
        ← Back
      </Link>
      <ChallengeDetailView
        challengeId={id}
        actions={(detail, reload) => {
          if (role === "UNIVERSITY") {
            const acceptedByMe = detail.acceptedBy?.universityId === user?.id;
            if (detail.acceptedBy) {
              return (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
                    {acceptedByMe ? "✓ You accepted this problem (UNIVERSITY_ACCEPTED)" : `Accepted by ${detail.acceptedBy.name}`}
                  </span>
                  {detail.project ? (
                    <Link
                      href={`/projects/${detail.project.id}`}
                      className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
                    >
                      Open project workspace
                    </Link>
                  ) : null}
                </div>
              );
            }

            return (
              <Button
                variant="success"
                className="shadow-md font-bold text-sm px-5 py-2.5"
                onClick={async () => {
                  try {
                    await post(`/challenges/${id}/accept`, {});
                    pushToast("Problem accepted successfully! Field verification is now enabled.", "success");
                    reload();
                  } catch (e) {
                    pushToast(apiError(e), "error");
                  }
                }}
              >
                ACCEPT PROBLEM
              </Button>
            );
          }

          if (role === "CITIZEN" && detail.project) {
            return (
              <Link
                href={`/projects/${detail.project.id}`}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
              >
                Project workspace
              </Link>
            );
          }
          return null;
        }}
        footer={(detail, reload) =>
          role === "UNIVERSITY" ? (
            <UniversityFieldWorkflow
              challengeId={id}
              accepted={
                detail.acceptedBy?.universityId === user?.id ||
                ["UNIVERSITY_ACCEPTED", "FIELD_VERIFICATION_PENDING", "FIELD_PERSON_ASSIGNED", "FIELD_VERIFICATION_IN_PROGRESS", "FIELD_REPORT_SUBMITTED", "FIELD_RESOLVED"].includes(detail.challenge.status)
              }
              reload={reload}
              challengeLocation={{
                title: detail.challenge.title,
                location: detail.challenge.location,
                latitude: detail.challenge.latitude,
                longitude: detail.challenge.longitude,
                address: detail.challenge.address,
              }}
              challengeTitle={detail.challenge.title}
            />
          ) : null
        }
      />
    </AppShell>
  );
}
