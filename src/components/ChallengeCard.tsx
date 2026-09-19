"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Mic, PhoneCall, ThumbsUp, Users } from "lucide-react";
import { Badge, Card, PriorityBadge, Progress, StatusBadge } from "@/components/ui";
import type { ChallengeSummary } from "@/types";

export function ChallengeCard({
  challenge,
  href,
  actions,
}: {
  challenge: ChallengeSummary;
  href?: string;
  actions?: React.ReactNode;
}) {
  const detailHref = href ?? `/challenges/${challenge.id}`;
  const title = (
    <p className="text-base font-semibold text-slate-900 hover:underline">{challenge.title}</p>
  );
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-xs text-white">{challenge.complaintCode}</span>
        <PriorityBadge level={challenge.priorityLevel} score={challenge.priorityScore} />
        <StatusBadge status={challenge.status} />
        <Badge tone="slate">{challenge.category}</Badge>
        {challenge.inputMethod === "VOICE" ? <Badge tone="violet"><Mic className="h-3 w-3" /> Voice</Badge> : null}
        {challenge.inputMethod === "IVR" ? <Badge tone="amber"><PhoneCall className="h-3 w-3" /> IVR</Badge> : null}
      </div>

      <div className="mt-2"><Link href={detailHref}>{title}</Link></div>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{challenge.summary ?? challenge.description}</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {challenge.location}</span>
        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {challenge.peopleAffected.toLocaleString("en-IN")} affected</span>
        <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {challenge.votes} community votes</span>
        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(challenge.createdAt).toLocaleDateString()}</span>
      </div>

      {challenge.requiredExpertise.length ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {challenge.requiredExpertise.map((e) => (<Badge key={e} tone="indigo">{e}</Badge>))}
        </div>
      ) : null}

      {challenge.matchedUniversity ? (
        <div className="mt-3 rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
          <span className="font-semibold">Matched university:</span> {challenge.matchedUniversity}
          {challenge.matchedUniversityScore !== null ? <> · {challenge.matchedUniversityScore}% match</> : null}
        </div>
      ) : null}

      {challenge.acceptedUniversity ? (
        <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          ✅ Accepted by <span className="font-semibold">{challenge.acceptedUniversity}</span>
          {challenge.projectTitle ? <> · Project: <span className="font-semibold">{challenge.projectTitle}</span></> : null}
        </div>
      ) : null}

      {challenge.projectProgress !== null ? <div className="mt-3"><Progress value={challenge.projectProgress} /></div> : null}

      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </Card>
  );
}
