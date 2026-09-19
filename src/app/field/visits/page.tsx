"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Empty, Loading, PriorityBadge, SectionTitle } from "@/components/ui";
import { apiError, get, post } from "@/lib/api";
import { useApp } from "@/context/AppContext";

type AssignmentItem = {
  assignment: {
    id: number;
    challengeId: number;
    status: string;
    assignedAt: string;
    startedAt: string | null;
    completedAt: string | null;
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

export default function FieldVisitsPage() {
  const { pushToast } = useApp();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    get<{ assignments: AssignmentItem[] }>("/field/assignments")
      .then((res) => setAssignments(res.assignments || []))
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStart = async (id: number) => {
    try {
      await post(`/field-assignments/${id}/start`);
      pushToast("Physical visit started!", "success");
      load();
    } catch (e) {
      pushToast(apiError(e), "error");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FIELD_PERSON_ASSIGNED":
        return <Badge tone="amber">VISIT PENDING</Badge>;
      case "VISIT_ACCEPTED":
        return <Badge tone="indigo">TRAVEL SCHEDULED</Badge>;
      case "FIELD_VERIFICATION_IN_PROGRESS":
        return <Badge tone="sky">ON-SITE INSPECTION</Badge>;
      case "FIELD_RESOLVED":
        return <Badge tone="emerald">VISIT COMPLETED (RESOLVED)</Badge>;
      case "FIELD_REPORT_SUBMITTED":
        return <Badge tone="violet">VISIT COMPLETED (REPORTED)</Badge>;
      default:
        return <Badge tone="slate">{status.replaceAll("_", " ")}</Badge>;
    }
  };

  return (
    <AppShell role="FIELD_PERSON">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Site Visits & Ground Inspections</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track on-ground travel itineraries, inspection status, and verification milestones.
            </p>
          </div>
        </div>

        {loading ? (
          <Loading label="Loading visit schedules…" />
        ) : assignments.length === 0 ? (
          <Empty message="No active or past site visits found for your account." />
        ) : (
          <div className="space-y-4">
            {assignments.map((item) => {
              const { assignment, challenge, university } = item;
              return (
                <Card key={assignment.id} className="border-slate-200 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {challenge.complaintCode}
                        </span>
                        <Badge tone="slate">{challenge.category}</Badge>
                        {challenge.priority ? <PriorityBadge level={challenge.priority} /> : null}
                        {getStatusBadge(assignment.status)}
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900">
                        {challenge.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span>📍 Destination: <strong>{challenge.location}</strong></span>
                        {assignment.distanceKm !== null ? (
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                            {assignment.distanceKm} km from registered base
                          </span>
                        ) : null}
                        <span>🏛️ Coordinator: {university.organizationName || university.fullName}</span>
                      </div>

                      <div className="text-xs text-slate-400">
                        {assignment.startedAt ? (
                          <span>Started on-site: {new Date(assignment.startedAt).toLocaleString()}</span>
                        ) : assignment.completedAt ? (
                          <span>Completed: {new Date(assignment.completedAt).toLocaleString()}</span>
                        ) : (
                          <span>Assigned: {new Date(assignment.assignedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/field/assignments/${assignment.id}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Visit Details & Report →
                      </Link>

                      {assignment.status === "VISIT_ACCEPTED" && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleStart(assignment.id)}
                        >
                          🚗 Mark Arrived / Start
                        </Button>
                      )}
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
