"use client";

import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, GraduationCap, Plus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Field, SectionTitle, inputClass } from "@/components/ui";
import { apiError, get, post } from "@/lib/api";
import { useApp } from "@/context/AppContext";

type CollaborationMember = {
  id: number;
  name: string;
  role: string;
  email: string | null;
  expertise: string | null;
  kind: string;
};

type CollaborationGroup = {
  id: number;
  name: string;
  description: string;
  goal: string;
  status: string;
  projectId: number | null;
  projectTitle: string | null;
  members: CollaborationMember[];
};

type ProjectOption = { id: number; title: string; complaintCode: string | null };

export default function UniversityCollaborationPage() {
  const { pushToast } = useApp();
  const [groups, setGroups] = useState<CollaborationGroup[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [form, setForm] = useState({ name: "", description: "", goal: "", projectId: "", status: "ACTIVE" });
  const [memberForm, setMemberForm] = useState<Record<number, { name: string; role: string; email: string; expertise: string; kind: string }>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      get<{ groups: CollaborationGroup[] }>("/collaboration"),
      get<{ projects: ProjectOption[] }>("/projects"),
    ])
      .then(([collab, projectRes]) => {
        setGroups(collab.groups ?? []);
        setProjects((projectRes.projects ?? []).map((project) => ({
          id: project.id,
          title: project.title,
          complaintCode: project.complaintCode,
        })));
      })
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  useEffect(() => { load(); }, [load]);

  async function createGroup() {
    if (!form.name.trim()) {
      pushToast("Give the collaboration group a name.", "error");
      return;
    }

    try {
      await post("/collaboration", {
        name: form.name,
        description: form.description,
        goal: form.goal,
        projectId: form.projectId ? Number(form.projectId) : null,
        status: form.status,
      });
      setForm({ name: "", description: "", goal: "", projectId: "", status: "ACTIVE" });
      load();
      pushToast("Collaboration group created", "success");
    } catch (error) {
      pushToast(apiError(error), "error");
    }
  }

  async function addMember(groupId: number) {
    const entry = memberForm[groupId] ?? { name: "", role: "", email: "", expertise: "", kind: "STUDENT" };
    if (!entry.name.trim() || !entry.role.trim()) {
      pushToast("Add a member name and role before saving.", "error");
      return;
    }

    try {
      await post(`/collaboration/${groupId}/members`, {
        name: entry.name,
        role: entry.role,
        email: entry.email,
        expertise: entry.expertise,
        kind: entry.kind,
      });
      setMemberForm((prev) => ({ ...prev, [groupId]: { name: "", role: "", email: "", expertise: "", kind: "STUDENT" } }));
      load();
      pushToast("Team member added", "success");
    } catch (error) {
      pushToast(apiError(error), "error");
    }
  }

  return (
    <AppShell role="UNIVERSITY">
      <div className="mb-6 rounded-[28px] border border-violet-100 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 p-5 text-white shadow-[0_18px_40px_rgba(99,102,241,0.18)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-100">University collaboration hub</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Project teams, faculty groups and industry partners</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <Card>
            <SectionTitle title="Active collaboration groups" subtitle="Create project groups, assign members and connect them to a live project" />
            {loading ? <p className="text-sm text-slate-500">Loading collaboration groups…</p> : null}
            {!loading && groups.length === 0 ? <p className="text-sm text-slate-500">No collaboration groups yet. Create one to start coordinating the team.</p> : null}
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{group.name}</p>
                      <p className="text-xs text-slate-500">{group.projectTitle ? `Project: ${group.projectTitle}` : "No project linked yet"}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{group.status}</span>
                  </div>
                  {group.description ? <p className="mt-2 text-sm text-slate-600">{group.description}</p> : null}
                  {group.goal ? <p className="mt-1 text-xs text-slate-500">Goal: {group.goal}</p> : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.members.length > 0 ? group.members.map((member) => (
                      <div key={member.id} className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700">
                        <span className="font-semibold">{member.name}</span> · {member.role}
                        {member.expertise ? ` · ${member.expertise}` : ""}
                      </div>
                    )) : <span className="text-xs text-slate-500">No members added yet.</span>}
                  </div>

                  <div className="mt-4 grid gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-3 md:grid-cols-5">
                    <input
                      className={inputClass}
                      placeholder="Name"
                      value={memberForm[group.id]?.name ?? ""}
                      onChange={(e) => setMemberForm((prev) => ({ ...prev, [group.id]: { ...(prev[group.id] ?? { name: "", role: "", email: "", expertise: "", kind: "STUDENT" }), name: e.target.value } }))}
                    />
                    <input
                      className={inputClass}
                      placeholder="Role"
                      value={memberForm[group.id]?.role ?? ""}
                      onChange={(e) => setMemberForm((prev) => ({ ...prev, [group.id]: { ...(prev[group.id] ?? { name: "", role: "", email: "", expertise: "", kind: "STUDENT" }), role: e.target.value } }))}
                    />
                    <input
                      className={inputClass}
                      placeholder="Email"
                      value={memberForm[group.id]?.email ?? ""}
                      onChange={(e) => setMemberForm((prev) => ({ ...prev, [group.id]: { ...(prev[group.id] ?? { name: "", role: "", email: "", expertise: "", kind: "STUDENT" }), email: e.target.value } }))}
                    />
                    <input
                      className={inputClass}
                      placeholder="Expertise"
                      value={memberForm[group.id]?.expertise ?? ""}
                      onChange={(e) => setMemberForm((prev) => ({ ...prev, [group.id]: { ...(prev[group.id] ?? { name: "", role: "", email: "", expertise: "", kind: "STUDENT" }), expertise: e.target.value } }))}
                    />
                    <select
                      className={inputClass}
                      value={memberForm[group.id]?.kind ?? "STUDENT"}
                      onChange={(e) => setMemberForm((prev) => ({ ...prev, [group.id]: { ...(prev[group.id] ?? { name: "", role: "", email: "", expertise: "", kind: "STUDENT" }), kind: e.target.value } }))}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="FACULTY">Faculty</option>
                      <option value="INDUSTRY">Industry</option>
                      <option value="STARTUP">Startup</option>
                    </select>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button onClick={() => addMember(group.id)}>
                      <Plus className="mr-1 h-4 w-4" /> Add member
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionTitle title="Create collaboration group" subtitle="Use this to organize project stakeholders" />
            <div className="space-y-3">
              <Field label="Group name">
                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Civil engineering lab" />
              </Field>
              <Field label="Description">
                <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Prototype validation and field research team" />
              </Field>
              <Field label="Goal">
                <textarea className={inputClass} rows={2} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="Road safety assessment and sensor validation" />
              </Field>
              <Field label="Link to project">
                <select className={inputClass} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  <option value="">No project selected</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.complaintCode ?? "Project"} · {project.title}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="PLANNING">Planning</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </Field>
              <Button onClick={createGroup} className="w-full">Create group</Button>
            </div>
          </Card>

          <Card className="bg-violet-50/60">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-2 text-violet-700"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase tracking-wide text-violet-700">Team coverage</p>
                <p className="text-lg font-semibold text-slate-900">{groups.reduce((total, group) => total + group.members.length, 0)} members engaged</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-100 p-2 text-sky-700"><BriefcaseBusiness className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Project groups</p>
                <p className="text-lg font-semibold text-slate-900">{groups.filter((group) => group.projectId).length} linked projects</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><GraduationCap className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Coordination</p>
                <p className="text-lg font-semibold text-slate-900">{groups.length} active groups</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
