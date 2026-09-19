"use client";

import { Activity, CheckCircle2, Clock3, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RoleFeatureHub } from "@/components/RoleFeatureHub";
import { Card, SectionTitle, StatusBadge } from "@/components/ui";

const timeline = [
  { stage: "REPORTED", note: "Issue filed and citizen acknowledgment sent.", time: "Today, 09:10" },
  { stage: "AI_TRIAGE", note: "AI classified it as Water Supply and estimated high priority.", time: "Today, 09:16" },
  { stage: "UNIVERSITY_MATCHED", note: "Regional engineering department assigned as the primary responder.", time: "Today, 11:05" },
  { stage: "PROJECT_CREATED", note: "Solution project created with student and faculty collaboration.", time: "Today, 13:40" },
  { stage: "CITIZEN_VALIDATION", note: "Citizen will validate the mitigation and close the loop.", time: "Pending" },
];

export default function CitizenTrackingPage() {
  return (
    <AppShell role="CITIZEN">
      <div className="mb-6 rounded-[28px] border border-indigo-100 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 p-5 text-white shadow-[0_18px_40px_rgba(79,70,229,0.2)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100">Problem tracking</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Track every step of your report</h1>
        <p className="mt-2 text-sm text-indigo-100">From AI classification to resolution proof, each status update stays visible in one timeline.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <SectionTitle title="Status timeline" subtitle="Complete lifecycle of the reported issue" />
          <ol className="space-y-4 border-l border-slate-200 pl-4">
            {timeline.map((item) => (
              <li key={item.stage} className="relative">
                <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-indigo-500" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.stage} />
                    <p className="text-sm font-medium text-slate-800">{item.note}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{item.time}</span>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-4">
          <Card className="bg-indigo-50/60">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-2 text-indigo-700"><Activity className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Current state</p>
                <p className="text-lg font-semibold text-slate-900">In project delivery</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 p-2 text-amber-700"><Clock3 className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Estimated resolution</p>
                <p className="text-lg font-semibold text-slate-900">5 days</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Verification proof</p>
                <p className="text-lg font-semibold text-slate-900">2 items uploaded</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-100 p-2 text-sky-700"><FileText className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Knowledge notes</p>
                <p className="text-lg font-semibold text-slate-900">3 related records</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <RoleFeatureHub role="CITIZEN" />
    </AppShell>
  );
}
