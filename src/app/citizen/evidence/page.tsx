"use client";

import { CalendarDays, FileImage, FileText, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RoleFeatureHub } from "@/components/RoleFeatureHub";
import { Card, SectionTitle } from "@/components/ui";

const evidence = [
  { name: "Before repair photo", type: "Image", date: "12 Aug 2026" },
  { name: "Site sketch", type: "PDF", date: "13 Aug 2026" },
  { name: "Field inspection summary", type: "Text", date: "15 Aug 2026" },
];

export default function CitizenEvidencePage() {
  return (
    <AppShell role="CITIZEN">
      <div className="mb-6 rounded-[28px] border border-sky-100 bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 p-5 text-white shadow-[0_18px_40px_rgba(14,165,233,0.18)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">Evidence upload</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Upload proof for resolution and validation</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <SectionTitle title="Upload evidence" subtitle="Supporting media and records for execution and final verification" />
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <UploadCloud className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            <p className="text-sm font-medium text-slate-700">Drop files here or click to browse</p>
            <p className="mt-1 text-xs text-slate-500">Accepted: images, PDFs, inspection notes, before/after proof</p>
            <button className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Select files</button>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Uploaded materials" subtitle="Current proof trail" />
          <div className="space-y-3">
            {evidence.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  {item.type === "Image" ? <FileImage className="h-4 w-4 text-emerald-600" /> : <FileText className="h-4 w-4 text-sky-600" />}
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="text-[11px] text-slate-500">{item.type}</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500">{item.date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
          <p className="text-sm text-slate-700">Final verification windows are triggered once the university submits evidence and the citizen confirms the impact.</p>
        </div>
      </div>

      <RoleFeatureHub role="CITIZEN" />
    </AppShell>
  );
}
