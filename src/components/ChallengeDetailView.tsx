"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Building2, CheckCircle2, Copy, GraduationCap, MapPin, Sparkles, Users } from "lucide-react";
import { apiError, get } from "@/lib/api";
import { Badge, Card, Empty, Loading, PriorityBadge, Progress, SectionTitle, StatusBadge } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import type { ChallengeDetail } from "@/types";

export function ChallengeDetailView({
  challengeId,
  actions,
  footer,
}: {
  challengeId: number;
  actions?: (detail: ChallengeDetail, reload: () => void) => ReactNode;
  footer?: (detail: ChallengeDetail, reload: () => void) => ReactNode;
}) {
  const { pushToast } = useApp();
  const [detail, setDetail] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    get<ChallengeDetail>(`/challenges/${challengeId}`)
      .then(setDetail)
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [challengeId, pushToast]);

  useEffect(load, [load]);

  if (loading && !detail) return <Loading label="Loading challenge…" />;
  if (!detail) return <Empty message="Challenge not found." />;

  const c = detail.challenge;
  const a = detail.analysis;
  const factors = a
    ? [
        { label: "Severity", score: a.severityScore, max: 25 },
        { label: "Urgency", score: a.urgencyScore, max: 20 },
        { label: "People affected", score: a.peopleScore, max: 20 },
        { label: "Duration", score: a.durationScore, max: 15 },
        { label: "Safety risk", score: a.safetyScore, max: 20 },
        { label: "Geographic impact (boost)", score: a.geoScore, max: 5 },
        { label: "Community votes (boost)", score: a.votesScore, max: 5 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-xs text-white"
            onClick={() => { navigator.clipboard?.writeText(c.complaintCode); pushToast("Complaint code copied", "success"); }}
          >
            {c.complaintCode} <Copy className="h-3 w-3" />
          </button>
          <PriorityBadge level={c.priorityLevel} score={c.priorityScore} />
          <StatusBadge status={c.status} />
          <Badge tone="slate">{c.category}{c.subcategory ? ` · ${c.subcategory}` : ""}</Badge>
          <Badge tone="slate">{c.inputMethod} input · {c.language.toUpperCase()}</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{c.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.description}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location}{c.landmark ? ` · ${c.landmark}` : ""}</span>
          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {c.peopleAffected.toLocaleString("en-IN")} people affected</span>
          <span>Severity: {c.severity}</span>
          <span>Duration: {c.durationDays} days</span>
          <span>Reported by: {detail.citizen?.name ?? "Citizen"}</span>
          <span>Community votes: {c.votes}</span>
        </div>
        {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions(detail, load)}</div> : null}
      </Card>

      <Card>
        <SectionTitle title="AI Problem Intelligence" subtitle={a ? `Engine: ${a.engine} · confidence ${(a.confidence * 100).toFixed(0)}%` : undefined} />
        {a ? (
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-600" /> <b>{a.category}</b> / {a.subcategory}</p>
            <p className="text-slate-600">{a.summary}</p>
            <p className="text-slate-600">{a.impact}</p>
            <div className="flex flex-wrap gap-1">
              {a.requiredExpertise.map((e) => (<Badge key={e} tone="indigo">{e}</Badge>))}
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">AI-assisted priority recommendation — {a.priorityScore}/100</p>
              <div className="space-y-2">
                {factors.map((f) => (
                  <div key={f.label}>
                    <div className="flex justify-between text-xs text-slate-600"><span>{f.label}</span><span>{f.score}/{f.max}</span></div>
                    <div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${(f.score / f.max) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : <Empty message="AI analysis pending." />}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Semantic duplicate detection" subtitle="Flagged for review — never auto-deleted" />
          {detail.duplicates.length === 0 ? (
            <p className="text-sm text-slate-500">No similar problems found.</p>
          ) : (
            <div className="space-y-2">
              {detail.duplicates.map((d) => (
                <div key={d.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <b>Possible duplicate</b>
                    <Badge tone="amber">Similarity {d.similarity}%</Badge>
                    <Badge tone="slate">{d.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-amber-900">Related complaint <span className="font-mono">{d.complaintCode}</span> — {d.title}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle title="University matching" subtitle="Explainable AI match score" />
          <div className="space-y-2">
            {detail.matches.map((m) => (
              <div key={m.id} className={`rounded-xl border p-3 ${m.status === "ACCEPTED" ? "border-emerald-300 bg-emerald-50" : "border-slate-200"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-medium"><GraduationCap className="h-4 w-4 text-indigo-600" /> {m.universityName}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-indigo-700">{m.matchScore}% match</span>
                    {m.status === "ACCEPTED" ? <Badge tone="emerald">Accepted</Badge> : null}
                  </div>
                </div>
                <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                  {m.reasons.map((r, index) => (<li key={`${m.id}-${index}-${r}`}>✓ {r}</li>))}
                </ul>
              </div>
            ))}
            {detail.matches.length === 0 ? <p className="text-sm text-slate-500">No university matches yet.</p> : null}
          </div>
        </Card>
      </div>

      {detail.project ? (
        <Card>
          <SectionTitle
            title={`Project: ${detail.project.title}`}
            subtitle={`${detail.acceptedBy?.name ?? "University"}${detail.project.department ? ` · ${detail.project.department}` : ""} · status ${detail.project.status.replaceAll("_", " ")}`}
            action={<Link href={`/projects/${detail.project.id}`} className="text-sm font-medium text-indigo-700 hover:underline">Open workspace →</Link>}
          />
          <Progress value={detail.project.progress} />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Milestones</p>
              <ol className="relative space-y-3 border-l border-slate-200 pl-4">
                {detail.milestones.map((m) => (
                  <li key={m.id} className="relative">
                    <span className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ${m.status === "COMPLETED" ? "bg-emerald-500" : m.status === "IN_PROGRESS" ? "bg-amber-500" : "bg-slate-300"}`} />
                    <p className="text-sm font-medium text-slate-800">{m.title} <span className="text-xs text-slate-500">· {m.percentage}%</span></p>
                    <p className="text-xs text-slate-500">{m.description}</p>
                    <p className="text-[11px] text-slate-400">
                      {m.status}
                      {m.dueDate ? ` · due ${new Date(m.dueDate).toLocaleDateString()}` : ""}
                      {m.completedAt ? ` · completed ${new Date(m.completedAt).toLocaleDateString()}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Industry collaboration</p>
              {detail.industrySupport.length === 0 ? (
                <p className="text-sm text-slate-500">No industry partner yet.</p>
              ) : (
                <div className="space-y-2">
                  {detail.industrySupport.map((s) => (
                    <div key={s.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                      <p className="flex items-center gap-2 font-medium"><Building2 className="h-4 w-4 text-emerald-600" /> {s.industryName} <Badge tone={s.status === "ACTIVE" ? "emerald" : "amber"}>{s.status}</Badge></p>
                      <p className="text-xs text-slate-600">{s.supportType} — {s.description}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Progress updates</p>
              <div className="space-y-2">
                {detail.progressUpdates.slice(0, 5).map((u) => (
                  <div key={u.id} className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    <b>{u.progress}%</b> · {u.note}
                    <span className="block text-[11px] text-slate-400">{new Date(u.createdAt).toLocaleString()}</span>
                  </div>
                ))}
                {detail.progressUpdates.length === 0 ? <p className="text-sm text-slate-500">No updates yet.</p> : null}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <SectionTitle title="Lifecycle timeline" subtitle="Every stage is persisted as a lifecycle event" />
        <ol className="relative space-y-3 border-l border-slate-200 pl-4">
          {detail.lifecycle.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-indigo-500" />
              <p className="text-sm font-medium text-slate-800">{e.stage.replaceAll("_", " ")}</p>
              <p className="text-xs text-slate-600">{e.note}</p>
              <p className="text-[11px] text-slate-400">{new Date(e.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ol>
      </Card>

      {footer ? footer(detail, load) : null}

      {detail.challenge.status === "CITIZEN_VALIDATION" ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Closed loop complete — citizen validation received.
        </div>
      ) : null}
    </div>
  );
}
