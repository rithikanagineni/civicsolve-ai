"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileCheck2,
  GraduationCap,
  MapPinned,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import type { Role } from "@/context/AppContext";

type FeatureItem = {
  title: string;
  description: string;
  status: string;
  scope: string;
  icon: LucideIcon;
};

const featureMap: Record<Role, FeatureItem[]> = {
  CITIZEN: [
    { title: "AI problem triage", description: "Summarizes each issue, classifies it, estimates urgency and suggests the right handling path.", status: "Live", scope: "Auto triage", icon: Bot },
    { title: "Problem lifecycle tracking", description: "Follow the complete status, approvals, milestones and handoff timeline from report to resolution.", status: "Live", scope: "Status view", icon: Activity },
    { title: "Evidence upload", description: "Attach photos, supporting files and verification notes before and after the fix is submitted.", status: "Ready", scope: "Document proof", icon: FileCheck2 },
    { title: "Event registration", description: "Join local repair drives, collaborative hackathons and campus-community action events.", status: "Available", scope: "Volunteer access", icon: CalendarDays },
    { title: "Knowledge lookup", description: "Search stored civic guidance, reusable playbooks and resolution notes related to similar issues.", status: "Ready", scope: "RAG library", icon: Search },
  ],
  UNIVERSITY: [
    { title: "AI + RAG knowledge base", description: "Search institutional knowledge, prior case studies and reusable methodologies for each reported problem.", status: "Live", scope: "Research support", icon: Search },
    { title: "Student collaboration", description: "Create interdisciplinary teams, assign roles and coordinate faculty-led project execution.", status: "Live", scope: "Team orchestration", icon: GraduationCap },
    { title: "Project collaboration hub", description: "Link civic problem reports with student clubs, labs, departments and industry mentors.", status: "Live", scope: "Multi-stakeholder", icon: BriefcaseBusiness },
    { title: "Evidence validation", description: "Review submitted proof, validate mitigation plans and confirm final impact outcomes.", status: "Ready", scope: "System checks", icon: ShieldCheck },
    { title: "Event participation", description: "Promote research clinics, innovation sprints and collaboration events for students and faculty.", status: "Available", scope: "Campus events", icon: CalendarDays },
  ],
  INDUSTRY: [
    { title: "Nearby responder matching", description: "Rank nearby experts by proximity, technical fit and reputation for each civic problem or task.", status: "Live", scope: "Location-aware matching", icon: MapPinned },
    { title: "Responder task workflow", description: "Accept, start, submit evidence and verify tasks in a controlled evidence-driven resolution flow.", status: "Live", scope: "Operational tasks", icon: Users },
    { title: "Project collaboration", description: "Support university teams with funding, hardware, mentorship and implementation guidance.", status: "Live", scope: "Industry support", icon: Building2 },
    { title: "Impact analytics", description: "Track resolved issues, deployed support and measurable contribution to civic outcomes.", status: "Ready", scope: "Performance metrics", icon: Sparkles },
    { title: "Event collaboration", description: "Register for innovation challenges, townhall events and practical collaboration workshops.", status: "Available", scope: "Partnership events", icon: CalendarDays },
  ],
  FIELD_PERSON: [
    { title: "Assigned visit queue", description: "View only the field visits assigned to your account, including location and required skills.", status: "Live", scope: "Private assignments", icon: MapPinned },
    { title: "Verification reporting", description: "Record observations, evidence, direct resolutions, or a clear escalation to the university team.", status: "Live", scope: "Field evidence", icon: FileCheck2 },
    { title: "Safe escalation", description: "Hand off work that needs university design, resources, or industry collaboration without losing the audit trail.", status: "Ready", scope: "University handoff", icon: ShieldCheck },
  ],
  ADMIN: [
    { title: "AI oversight and triage", description: "Monitor automated problem classification, severity scoring and priority management across the platform.", status: "Live", scope: "Platform intelligence", icon: Bot },
    { title: "Impact analytics", description: "Review resolved issues, participation and overall civic outcomes in near-real time dashboards.", status: "Live", scope: "Cross-portal metrics", icon: Activity },
    { title: "Knowledge governance", description: "Curate the shared RAG knowledge base and keep policy guidance available to all portals.", status: "Ready", scope: "Knowledge quality", icon: Search },
    { title: "Event and partner management", description: "Coordinate civic events, collaboration programs and community engagement opportunities.", status: "Available", scope: "Program ops", icon: CalendarDays },
  ],
};

export function RoleFeatureHub({ role }: { role: Role }) {
  const items = featureMap[role];
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  return (
    <div className="mt-8 space-y-4">
      <SectionTitle
        title={`${roleLabel} feature suite`}
        subtitle="Role-specific capabilities that map directly to the platform workflow"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(({ title, description, status, scope, icon: Icon }) => (
          <Card key={title} className="h-full border-slate-200 bg-white/90">
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                <Icon className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                {status}
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {scope}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
