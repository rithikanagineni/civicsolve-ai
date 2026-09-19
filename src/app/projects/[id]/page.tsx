"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Building2, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { apiError, get, post, put } from "@/lib/api";
import { Badge, Button, Card, Empty, Field, Loading, Progress, SectionTitle, StatusBadge, inputClass } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import type { Milestone } from "@/types";

type Detail = {
  project: { id: number; title: string; description: string; status: string; progress: number; department: string | null; universityId: number; universityName: string | null; complaintCode: string | null; challengeTitle: string | null; requiredTech: string[]; startedAt: string; completedAt: string | null };
  challenge: { id: number; title: string; location: string; category: string; priorityLevel: string; citizenId: number } | null;
  milestones: Milestone[];
  progressUpdates: { id: number; progress: number; note: string; createdAt: string }[];
  industrySupport: { id: number; industryId: number; industryName: string; supportType: string; description: string; status: string; matchScore: number; reasons: string[] }[];
  members: { id: number; name: string; role: string }[];
  messages: { id: number; body: string; createdAt: string; senderId: number; senderName: string; senderRole: string }[];
  impactReport: { peopleBenefited: number; durationDays: number; impactScore: number; satisfaction: number; implementationDate: string; solution: string } | null;
  feedback: { rating: number; comment: string | null; resolved: boolean; suggestion: string | null } | null;
  recommendedIndustries: { industryId: number; name: string; score: number; reasons: string[] }[];
};

const SUPPORT_TYPES = ["Technology", "Mentorship", "Hardware", "Software", "Funding", "Infrastructure", "Deployment", "Expertise"];

export default function ProjectWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { user, ready, pushToast } = useApp();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [supportType, setSupportType] = useState("Technology");
  const [supportDesc, setSupportDesc] = useState("");
  const [fundingAmount, setFundingAmount] = useState("");
  const [mentorshipFocus, setMentorshipFocus] = useState("");
  const [technologyStack, setTechnologyStack] = useState("");
  const [hardwareSpec, setHardwareSpec] = useState("");
  const [deploymentPlan, setDeploymentPlan] = useState("");
  const [expertiseArea, setExpertiseArea] = useState("");
  const [targetIndustry, setTargetIndustry] = useState<number | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    get<Detail>(`/projects/${id}`)
      .then((d) => { setData(d); setProgress(d.project.progress); })
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [id, pushToast]);

  useEffect(() => { if (ready && !user) router.replace("/login"); }, [ready, user, router]);
  useEffect(() => { if (user) load(); }, [user, load]);

  if (loading || !data) return <div className="p-10"><Loading label="Loading project workspace…" /></div>;

  const isUniversity = user?.role === "UNIVERSITY" && data.project.universityId === user.id;
  const isIndustry = user?.role === "INDUSTRY";
  const canUpdate = isUniversity || (isIndustry && data.industrySupport.some((s) => s.industryId === user?.id && s.status === "ACTIVE")) || user?.role === "ADMIN";

  function supportRequestSummary() {
    const base = supportDesc.trim() || `Support request: ${supportType.toLowerCase()} participation.`;
    if (supportType === "Funding") return `${base} Funding amount requested: ${fundingAmount || "not specified"}.`;
    if (supportType === "Mentorship") return `${base} Mentorship focus: ${mentorshipFocus || "general mentorship"}.`;
    if (supportType === "Technology") return `${base} Technology stack: ${technologyStack || "to be confirmed"}.`;
    if (supportType === "Hardware") return `${base} Hardware specification: ${hardwareSpec || "to be confirmed"}.`;
    if (supportType === "Deployment") return `${base} Deployment plan: ${deploymentPlan || "to be confirmed"}.`;
    if (supportType === "Expertise") return `${base} Expertise area: ${expertiseArea || "to be confirmed"}.`;
    return base;
  }

  async function action(fn: () => Promise<unknown>, successMessage: string) {
    try {
      await fn();
      pushToast(successMessage, "success");
      load();
    } catch (e) {
      pushToast(apiError(e), "error");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <button onClick={() => router.back()} className="mb-4 text-sm text-slate-500 hover:underline">← Back</button>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {data.project.complaintCode ? <span className="rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-xs text-white">{data.project.complaintCode}</span> : null}
          <StatusBadge status={data.project.status} />
          <Badge tone="indigo">{data.project.universityName}</Badge>
          {data.project.department ? <Badge tone="slate">{data.project.department}</Badge> : null}
        </div>
        <h1 className="mt-3 text-2xl font-semibold">{data.project.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{data.project.description}</p>
        {data.challenge ? (
          <p className="mt-2 text-xs text-slate-500">
            Solving challenge #{data.challenge.id}: {data.challenge.title} · {data.challenge.location}
          </p>
        ) : null}
        <div className="mt-4"><Progress value={data.project.progress} label="Overall progress" /></div>
        <div className="mt-3 flex flex-wrap gap-1">
          {data.members.map((m, index) => (<Badge key={`${m.id ?? "member"}-${m.role ?? "role"}-${index}`} tone="slate">{m.name} · {(m.role ?? "MEMBER").replaceAll("_", " ")}</Badge>))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Milestones" subtitle="Visual delivery timeline" />
          <ol className="relative space-y-3 border-l border-slate-200 pl-4">
            {data.milestones.map((m) => (
              <li key={m.id} className="relative">
                <span className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ${m.status === "COMPLETED" ? "bg-emerald-500" : m.status === "IN_PROGRESS" ? "bg-amber-500" : "bg-slate-300"}`} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{m.title} <span className="text-xs text-slate-500">· {m.percentage}%</span></p>
                  {canUpdate && m.status !== "COMPLETED" ? (
                    <div className="flex gap-1">
                      {m.status === "PENDING" ? (
                        <Button size="sm" variant="outline" onClick={() => action(() => put(`/milestones/${m.id}`, { status: "IN_PROGRESS" }), "Milestone started")}>Start</Button>
                      ) : null}
                      {m.status === "IN_PROGRESS" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            className="hidden"
                            id={`upload-${m.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setUploadedDocs((prev) => ({ ...prev, [m.id]: file.name }));
                            }}
                          />
                          <label htmlFor={`upload-${m.id}`} className="inline-flex cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Upload</label>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                              if (!uploadedDocs[m.id]) {
                                pushToast("Upload a report or document before marking this milestone complete.", "error");
                                return;
                              }
                              action(() => put(`/milestones/${m.id}`, { status: "COMPLETED", documentUrl: uploadedDocs[m.id] }), "Milestone completed");
                            }}
                          >
                            Complete
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">{m.description}</p>
                <p className="text-[11px] text-slate-400">{m.status}{m.completedAt ? ` · ${new Date(m.completedAt).toLocaleDateString()}` : ""}</p>
                {uploadedDocs[m.id] ? <p className="mt-1 text-[11px] text-emerald-700">Document attached: {uploadedDocs[m.id]}</p> : null}
              </li>
            ))}
          </ol>
          {isUniversity ? (
            <div className="mt-4 flex gap-2">
              <input className={inputClass} placeholder="New milestone title" value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} />
              <Button
                onClick={() => {
                  if (milestoneTitle.trim().length < 3) return pushToast("Enter a milestone title", "error");
                  action(() => post(`/projects/${id}/milestones`, { title: milestoneTitle, percentage: 100 }), "Milestone added").then(() => setMilestoneTitle(""));
                }}
              >
                Add
              </Button>
            </div>
          ) : null}
        </Card>

        <div className="space-y-6">
          {canUpdate ? (
            <Card>
              <SectionTitle title="Post progress update" subtitle="Updates notify the citizen instantly" />
              <div className="space-y-3">
                <Field label={`Progress: ${progress}%`}>
                  <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full" />
                </Field>
                <Field label="Update note">
                  <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Prototype installed at the site…" />
                </Field>
                <Button
                  onClick={() => {
                    if (note.trim().length < 3) return pushToast("Add a short note", "error");
                    action(() => post(`/projects/${id}/progress`, { progress, note }), "Progress updated").then(() => setNote(""));
                  }}
                >
                  Publish update
                </Button>
                {progress === 100 ? <p className="text-xs text-emerald-700">Publishing at 100% marks the project COMPLETED and requests citizen validation.</p> : null}
              </div>
            </Card>
          ) : null}

          <Card>
            <SectionTitle title="Industry collaboration" subtitle="Technology · mentorship · hardware · funding · deployment" />
            <div className="space-y-2">
              {data.industrySupport.map((s) => (
                <div key={s.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                  <p className="flex flex-wrap items-center gap-2 font-medium"><Building2 className="h-4 w-4 text-emerald-600" />{s.industryName}<Badge tone={s.status === "ACTIVE" ? "emerald" : "amber"}>{s.status}</Badge></p>
                  <p className="text-xs text-slate-600">{s.supportType} — {s.description}</p>
                  {isIndustry && s.industryId === user?.id && s.status === "REQUESTED" ? (
                    <Button size="sm" variant="success" className="mt-2" onClick={() => action(() => post(`/industry-support/${s.id}/accept`), "Support accepted")}>Accept request</Button>
                  ) : null}
                </div>
              ))}
              {data.industrySupport.length === 0 ? <p className="text-sm text-slate-500">No industry partners yet.</p> : null}
            </div>

            {isUniversity || isIndustry ? (
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                {isUniversity ? (
                  <Field label="Recommended industry partners">
                    <select className={inputClass} value={targetIndustry ?? ""} onChange={(e) => setTargetIndustry(Number(e.target.value))}>
                      <option value="">Select a partner…</option>
                      {data.recommendedIndustries.map((r) => (
                        <option key={r.industryId} value={r.industryId}>{r.name} — {r.score}% match</option>
                      ))}
                    </select>
                  </Field>
                ) : null}
                <Field label="Support type">
                  <select className={inputClass} value={supportType} onChange={(e) => setSupportType(e.target.value)}>
                    {SUPPORT_TYPES.map((s) => (<option key={s}>{s}</option>))}
                  </select>
                </Field>

                {supportType === "Funding" ? (
                  <Field label="Funding amount required">
                    <input className={inputClass} value={fundingAmount} onChange={(e) => setFundingAmount(e.target.value)} placeholder="e.g. $25,000" />
                  </Field>
                ) : null}
                {supportType === "Mentorship" ? (
                  <Field label="Mentorship focus">
                    <input className={inputClass} value={mentorshipFocus} onChange={(e) => setMentorshipFocus(e.target.value)} placeholder="Product strategy, engineering review, field support" />
                  </Field>
                ) : null}
                {supportType === "Technology" ? (
                  <Field label="Technology stack">
                    <input className={inputClass} value={technologyStack} onChange={(e) => setTechnologyStack(e.target.value)} placeholder="IoT, AI, Python, GIS, sensors" />
                  </Field>
                ) : null}
                {supportType === "Hardware" ? (
                  <Field label="Hardware specification">
                    <input className={inputClass} value={hardwareSpec} onChange={(e) => setHardwareSpec(e.target.value)} placeholder="Sensors, routers, edge devices, battery backup" />
                  </Field>
                ) : null}
                {supportType === "Deployment" ? (
                  <Field label="Deployment plan">
                    <input className={inputClass} value={deploymentPlan} onChange={(e) => setDeploymentPlan(e.target.value)} placeholder="Site installation, field rollout, maintenance timeline" />
                  </Field>
                ) : null}
                {supportType === "Expertise" ? (
                  <Field label="Expertise area">
                    <input className={inputClass} value={expertiseArea} onChange={(e) => setExpertiseArea(e.target.value)} placeholder="Urban design, legal advisory, procurement, safety reviews" />
                  </Field>
                ) : null}

                <Field label="Description">
                  <input className={inputClass} value={supportDesc} onChange={(e) => setSupportDesc(e.target.value)} placeholder="Brief description of the support being offered" />
                </Field>
                <Button
                  onClick={() =>
                    action(
                      () => post(`/projects/${id}/industry-support`, { supportType, description: supportRequestSummary(), industryId: targetIndustry }),
                      isUniversity ? "Support request sent" : "You are now supporting this project",
                    )
                  }
                  disabled={false}
                >
                  {isUniversity ? "Request support" : "Support this project"}
                </Button>
                {isUniversity && data.recommendedIndustries.length ? (
                  <ul className="space-y-1 text-xs text-slate-600">
                    {data.recommendedIndustries.slice(0, 3).map((r) => (
                      <li key={r.industryId}><b>{r.name}</b> {r.score}% — {r.reasons.slice(0, 2).join(", ")}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Progress history" />
          {data.progressUpdates.length === 0 ? <Empty message="No progress updates yet." /> : null}
          <div className="space-y-2">
            {data.progressUpdates.map((u) => (
              <div key={u.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                <b>{u.progress}%</b> · {u.note}
                <span className="block text-[11px] text-slate-400">{new Date(u.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Project messaging" subtitle="Citizen · University · Industry" />
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {data.messages.map((m) => (
              <div key={m.id} className={`rounded-xl p-3 text-sm ${m.senderId === user?.id ? "bg-indigo-50" : "bg-slate-50"}`}>
                <p className="text-xs font-semibold text-slate-700">{m.senderName} <span className="font-normal text-slate-400">· {m.senderRole}</span></p>
                <p className="text-slate-700">{m.body}</p>
                <p className="text-[11px] text-slate-400">{new Date(m.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {data.messages.length === 0 ? <p className="text-sm text-slate-500"><MessageSquare className="mr-1 inline h-4 w-4" />No messages yet.</p> : null}
          </div>
          <div className="mt-3 flex gap-2">
            <input className={inputClass} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a message…" />
            <Button
              onClick={() => {
                if (!message.trim()) return;
                action(() => post(`/projects/${id}/messages`, { body: message }), "Message sent").then(() => setMessage(""));
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {data.impactReport ? (
        <Card className="mt-6 border-emerald-200 bg-emerald-50/40">
          <SectionTitle title="Impact report" subtitle="Generated when the project is completed" />
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <p><span className="text-slate-500">People benefited:</span> <b>{data.impactReport.peopleBenefited.toLocaleString("en-IN")}</b></p>
            <p><span className="text-slate-500">Duration:</span> <b>{data.impactReport.durationDays} days</b></p>
            <p><span className="text-slate-500">Impact score:</span> <b>{data.impactReport.impactScore}/100</b></p>
            <p><span className="text-slate-500">Implementation:</span> <b>{new Date(data.impactReport.implementationDate).toLocaleDateString()}</b></p>
            <p><span className="text-slate-500">Citizen satisfaction:</span> <b>{data.feedback?.rating ?? data.impactReport.satisfaction}/5</b></p>
            <p className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Closed-loop delivery</p>
          </div>
          {data.feedback ? <p className="mt-3 text-sm text-slate-600">“{data.feedback.comment}”</p> : null}
        </Card>
      ) : null}

      {data.challenge ? (
        <p className="mt-6 text-center text-xs text-slate-400">
          One challenge ID connects everything ·{" "}
          <Link href={`/citizen/problems/${data.challenge.id}`} className="underline">challenge #{data.challenge.id}</Link>
        </p>
      ) : null}
    </div>
  );
}
