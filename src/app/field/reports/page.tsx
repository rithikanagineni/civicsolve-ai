"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Card, Empty, Loading, PriorityBadge } from "@/components/ui";
import { apiError, get } from "@/lib/api";
import { useApp } from "@/context/AppContext";

type ReportItem = {
  report: {
    id: number;
    assignmentId: number;
    challengeId: number;
    verified: boolean;
    problemExists: string;
    observations: string;
    severity: string | null;
    affectedPeople: number | null;
    locationConfirmed: boolean;
    recommendedSolution: string | null;
    recommendedAction: string | null;
    canResolveDirectly: boolean;
    solutionPerformed: string | null;
    materialsUsed: string | null;
    universitySupportReason: string | null;
    photos: string[];
    submittedAt: string;
  };
  assignment: {
    id: number;
    status: string;
    distanceKm: number | null;
  };
  challenge: {
    id: number;
    title: string;
    complaintCode: string;
    location: string;
    category: string;
    priority: string;
  };
  university: {
    organizationName: string | null;
    fullName: string;
  };
};

export default function FieldReportsPage() {
  const { pushToast } = useApp();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    get<{ reports: ReportItem[] }>("/field/reports")
      .then((res) => setReports(res.reports || []))
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppShell role="FIELD_PERSON">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Submitted Field Reports</h1>
            <p className="mt-1 text-sm text-slate-500">
              Historical archive of all physical site inspections, technical verifications, and resolution reports.
            </p>
          </div>
          <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            Total Filed: {reports.length}
          </span>
        </div>

        {loading ? (
          <Loading label="Loading filed reports…" />
        ) : reports.length === 0 ? (
          <Empty message="You haven't submitted any field verification reports yet." />
        ) : (
          <div className="grid gap-4">
            {reports.map((item) => {
              const { report, assignment, challenge, university } = item;
              return (
                <Card key={report.id} className="border-slate-200 p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {challenge.complaintCode}
                        </span>
                        <Badge tone="slate">{challenge.category}</Badge>
                        {report.severity ? <PriorityBadge level={report.severity} /> : null}
                        <Badge tone={report.canResolveDirectly ? "emerald" : "indigo"}>
                          {report.canResolveDirectly ? "DIRECTLY RESOLVED" : "UNIVERSITY ESCALATED"}
                        </Badge>
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900">
                        {challenge.title}
                      </h3>

                      <p className="text-xs text-slate-500">
                        📍 {challenge.location} · University: {university.organizationName || university.fullName} · Submitted {new Date(report.submittedAt).toLocaleString()}
                      </p>

                      <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Observations:</p>
                        <p className="line-clamp-3">{report.observations}</p>
                      </div>

                      {report.canResolveDirectly ? (
                        <div className="text-xs text-emerald-800 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                          <strong>Resolution Action:</strong> {report.solutionPerformed}
                          {report.materialsUsed ? <span className="block mt-0.5 text-emerald-700"><strong>Tools/Materials:</strong> {report.materialsUsed}</span> : null}
                        </div>
                      ) : (
                        <div className="text-xs text-indigo-800 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100">
                          <strong>Recommended Solution:</strong> {report.recommendedSolution || report.recommendedAction}
                        </div>
                      )}

                      {report.photos && report.photos.length > 0 ? (
                        <div className="flex items-center gap-2 pt-1">
                          {report.photos.slice(0, 3).map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Evidence thumbnail ${i + 1}`}
                              className="h-16 w-24 object-cover rounded-lg border border-slate-200"
                            />
                          ))}
                          {report.photos.length > 3 ? (
                            <span className="text-xs text-slate-400 font-medium">
                              +{report.photos.length - 3} more
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                      <Link
                        href={`/field/assignments/${assignment.id}`}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        View Full Report →
                      </Link>
                      <Link
                        href={`/challenges/${challenge.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Problem Page
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
