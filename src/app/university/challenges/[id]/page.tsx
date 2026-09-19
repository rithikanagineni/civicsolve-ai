"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ChallengeDetailView } from "@/components/ChallengeDetailView";
import { Button } from "@/components/ui";
import { apiError, post } from "@/lib/api";
import { useApp } from "@/context/AppContext";

export default function UniversityChallengeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user, pushToast } = useApp();
  const [busy, setBusy] = useState(false);
  const [showReview, setShowReview] = useState(true);
  const [lead, setLead] = useState({ name: "", role: "Project Lead", email: "", expertise: "", phone: "" });
  const [teamMembers, setTeamMembers] = useState([{ name: "", role: "", email: "", expertise: "", phone: "" }]);

  const addMember = () => setTeamMembers((prev) => [...prev, { name: "", role: "", email: "", expertise: "", phone: "" }]);
  const updateMember = (index: number, field: string, value: string) => {
    setTeamMembers((prev) => prev.map((member, memberIndex) => memberIndex === index ? { ...member, [field]: value } : member));
  };

  const canAccept = lead.name.trim() && lead.role.trim() && teamMembers.some((member) => member.name.trim() && member.role.trim());

  return (
    <AppShell role="UNIVERSITY">
      <Link href="/university/challenges" className="mb-4 inline-block text-sm text-slate-500 hover:underline">← Recommended challenges</Link>
      <ChallengeDetailView
        challengeId={id}
        actions={(detail, reload) => {
          const acceptedByMe = detail.acceptedBy?.universityId === user?.id;
          if (detail.acceptedBy) {
            return (
              <>
                <span className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                  {acceptedByMe ? "You accepted this challenge" : `Accepted by ${detail.acceptedBy.name}`}
                </span>
                {detail.project ? (
                  <Link href={`/projects/${detail.project.id}`} className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
                    Open project workspace
                  </Link>
                ) : null}
              </>
            );
          }

          return (
            <div className="w-full space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">Review problem and assign the project team</p>
                  <button type="button" onClick={() => setShowReview((prev) => !prev)} className="text-xs font-medium text-indigo-700 hover:underline">
                    {showReview ? "Hide details" : "Review details"}
                  </button>
                </div>

                {showReview ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                    <p className="font-medium text-slate-800">Challenge summary</p>
                    <p className="mt-2">{detail.challenge.title}</p>
                    <p className="mt-1">{detail.challenge.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {detail.challenge.category ? <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{detail.challenge.category}</span> : null}
                      {detail.challenge.location ? <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{detail.challenge.location}</span> : null}
                      {detail.challenge.priorityLevel ? <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">{detail.challenge.priorityLevel}</span> : null}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="mb-3 text-sm font-semibold text-slate-800">Project lead</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" value={lead.name} onChange={(e) => setLead((prev) => ({ ...prev, name: e.target.value }))} placeholder="Lead name" />
                    <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" value={lead.role} onChange={(e) => setLead((prev) => ({ ...prev, role: e.target.value }))} placeholder="Lead role" />
                    <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" value={lead.email} onChange={(e) => setLead((prev) => ({ ...prev, email: e.target.value }))} placeholder="Lead email" />
                    <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" value={lead.phone} onChange={(e) => setLead((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Lead phone" />
                    <div className="md:col-span-2">
                      <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" value={lead.expertise} onChange={(e) => setLead((prev) => ({ ...prev, expertise: e.target.value }))} placeholder="Lead expertise or specialization" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">Project team members</p>
                    <button type="button" onClick={addMember} className="text-xs font-medium text-indigo-700 hover:underline">+ Add team member</button>
                  </div>
                  <div className="space-y-3">
                    {teamMembers.map((member, index) => (
                      <div key={`${member.name || "new"}-${index}`} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
                        <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" value={member.name} onChange={(e) => updateMember(index, "name", e.target.value)} placeholder="Member name" />
                        <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" value={member.role} onChange={(e) => updateMember(index, "role", e.target.value)} placeholder="Role in this project" />
                        <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" value={member.email} onChange={(e) => updateMember(index, "email", e.target.value)} placeholder="Email" />
                        <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" value={member.phone} onChange={(e) => updateMember(index, "phone", e.target.value)} placeholder="Phone" />
                        <div className="md:col-span-2">
                          <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" value={member.expertise} onChange={(e) => updateMember(index, "expertise", e.target.value)} placeholder="Expertise / skill area" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                variant="success"
                disabled={busy || !canAccept}
                onClick={async () => {
                  if (!lead.name.trim() || !lead.role.trim()) {
                    pushToast("Add the project lead with a name and role before accepting.", "error");
                    return;
                  }
                  const validTeamMembers = teamMembers.filter((member) => member.name.trim() || member.role.trim() || member.email.trim() || member.expertise.trim() || member.phone.trim());
                  if (validTeamMembers.length === 0) {
                    pushToast("Add at least one project team member before accepting.", "error");
                    return;
                  }
                  setBusy(true);
                  try {
                    await post(`/challenges/${id}/accept`, {
                      department: detail.project?.department ?? "Research and Development",
                      lead: {
                        name: lead.name,
                        role: lead.role,
                        email: lead.email,
                        expertise: lead.expertise,
                        phone: lead.phone,
                      },
                      teamMembers: [
                        ...validTeamMembers,
                        {
                          name: lead.name,
                          role: lead.role,
                          email: lead.email,
                          expertise: lead.expertise,
                          phone: lead.phone,
                        },
                      ],
                    });
                    pushToast("Challenge accepted — project created", "success");
                    reload();
                  } catch (e) {
                    pushToast(apiError(e), "error");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Accepting…" : "Accept challenge and create project"}
              </Button>
            </div>
          );
        }}
      />
    </AppShell>
  );
}
