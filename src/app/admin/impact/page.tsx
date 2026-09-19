"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Card, Empty, Loading, SectionTitle } from "@/components/ui";
import { apiError, get } from "@/lib/api";
import { useApp } from "@/context/AppContext";

type Report = {
  id: number; projectId: number; challengeId: number; complaintCode: string; problem: string; solution: string;
  university: string; industries: string[]; location: string; peopleBenefited: number; implementationDate: string;
  durationDays: number; satisfaction: number; impactScore: number;
};

export default function AdminImpactPage() {
  const { pushToast } = useApp();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<{ reports: Report[] }>("/impact-reports")
      .then((d) => setReports(d.reports))
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  return (
    <AppShell role="ADMIN">
      <SectionTitle title="Impact reports" subtitle="Generated automatically when a project reaches 100%" />
      {loading ? <Loading /> : null}
      {!loading && reports.length === 0 ? <Empty message="No completed projects yet." /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-xs text-white">{r.complaintCode}</span>
              <Badge tone="emerald">Impact {r.impactScore}/100</Badge>
              <Badge tone="amber">{r.satisfaction}/5 satisfaction</Badge>
            </div>
            <p className="mt-2 font-semibold">{r.problem}</p>
            <p className="mt-1 text-sm text-slate-600">{r.solution}</p>
            <div className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
              <p>University: <b>{r.university}</b></p>
              <p>Industry: <b>{r.industries.join(", ") || "—"}</b></p>
              <p>Location: <b>{r.location}</b></p>
              <p>People benefited: <b>{r.peopleBenefited.toLocaleString("en-IN")}</b></p>
              <p>Implementation: <b>{new Date(r.implementationDate).toLocaleDateString()}</b></p>
              <p>Duration: <b>{r.durationDays} days</b></p>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
