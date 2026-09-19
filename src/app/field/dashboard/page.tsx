"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Empty, Loading, PriorityBadge, SectionTitle, StatCard } from "@/components/ui";
import { apiError, get, post } from "@/lib/api";
import { useApp } from "@/context/AppContext";

type AssignmentItem = {
  assignment: {
    id: number;
    challengeId: number;
    status: string;
    assignedAt: string;
    distanceKm: number | null;
    recommendationScore: number | null;
    recommendationReasons: string[] | null;
  };
  challenge: {
    id: number;
    title: string;
    complaintCode: string;
    location: string;
    category: string;
    priority: string;
    urgencyLevel?: string;
  };
  university: {
    organizationName: string | null;
    fullName: string;
  };
  person: {
    fullName: string;
    registeredLocation: string | null;
  };
};

export default function FieldDashboard() {
  const { pushToast } = useApp();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ACTION_REQUIRED" | "IN_PROGRESS" | "COMPLETED">("ALL");

  const load = useCallback(() => {
    get<{ assignments: AssignmentItem[] }>("/field/assignments")
      .then((res) => setAssignments(res.assignments || []))
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAccept = async (id: number) => {
    try {
      await post(`/field-assignments/${id}/accept`);
      pushToast("Visit accepted successfully", "success");
      load();
    } catch (e) {
      pushToast(apiError(e), "error");
    }
  };

  const handleStart = async (id: number) => {
    try {
      await post(`/field-assignments/${id}/start`);
      pushToast("Physical field visit started", "success");
      load();
    } catch (e) {
      pushToast(apiError(e), "error");
    }
  };

  const newAssignmentsCount = assignments.filter((a) => a.assignment.status === "FIELD_PERSON_ASSIGNED").length;
  const upcomingVisitsCount = assignments.filter((a) => a.assignment.status === "VISIT_ACCEPTED").length;
  const inProgressCount = assignments.filter((a) => a.assignment.status === "FIELD_VERIFICATION_IN_PROGRESS").length;
  const completedCount = assignments.filter((a) =>
    ["FIELD_RESOLVED", "FIELD_REPORT_SUBMITTED", "COMPLETED"].includes(a.assignment.status)
  ).length;

  const filteredAssignments = assignments.filter((item) => {
    const s = item.assignment.status;
    if (filter === "ACTION_REQUIRED") return s === "FIELD_PERSON_ASSIGNED" || s === "VISIT_ACCEPTED";
    if (filter === "IN_PROGRESS") return s === "FIELD_VERIFICATION_IN_PROGRESS";
    if (filter === "COMPLETED") return ["FIELD_RESOLVED", "FIELD_REPORT_SUBMITTED", "COMPLETED"].includes(s);
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FIELD_PERSON_ASSIGNED":
        return <Badge tone="amber">PENDING ACCEPTANCE</Badge>;
      case "VISIT_ACCEPTED":
        return <Badge tone="indigo">VISIT ACCEPTED</Badge>;
      case "FIELD_VERIFICATION_IN_PROGRESS":
        return <Badge tone="sky">IN PROGRESS</Badge>;
      case "FIELD_RESOLVED":
        return <Badge tone="emerald">RESOLVED ON-FIELD</Badge>;
      case "FIELD_REPORT_SUBMITTED":
        return <Badge tone="violet">REPORT SUBMITTED</Badge>;
      default:
        return <Badge tone="slate">{status.replaceAll("_", " ")}</Badge>;
    }
  };

  return (
    <AppShell role="FIELD_PERSON">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Field Person Portal</h1>
            <p className="mt-1 text-sm text-slate-500">
              Welcome back. Manage your site verifications, on-ground inspections, and technical reports.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/field/assignments"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              All Assignments ({assignments.length})
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="New Assignments"
            value={newAssignmentsCount}
            hint="Pending your visit acceptance"
            tone="amber"
            icon={<span className="text-xl">📋</span>}
          />
          <StatCard
            label="Upcoming Visits"
            value={upcomingVisitsCount}
            hint="Accepted, ready for travel"
            tone="indigo"
            icon={<span className="text-xl">🚗</span>}
          />
          <StatCard
            label="In Progress"
            value={inProgressCount}
            hint="Physical verification underway"
            tone="sky"
            icon={<span className="text-xl">🔍</span>}
          />
          <StatCard
            label="Completed"
            value={completedCount}
            hint="Resolved or report filed"
            tone="emerald"
            icon={<span className="text-xl">✅</span>}
          />
        </div>

        {/* Section Header & Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <SectionTitle
            title="Priority & Assigned Visits"
            subtitle="Verified assignments dispatched by partnered universities for ground inspection."
          />
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600">
            {(
              [
                ["ALL", `All (${assignments.length})`],
                ["ACTION_REQUIRED", `Action Required (${newAssignmentsCount + upcomingVisitsCount})`],
                ["IN_PROGRESS", `In Progress (${inProgressCount})`],
                ["COMPLETED", `Completed (${completedCount})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  filter === key ? "bg-white font-semibold text-slate-900 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Loading label="Loading your assigned field visits…" />
        ) : filteredAssignments.length === 0 ? (
          <Empty message="No field visits found matching the selected filter." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredAssignments.map((item) => {
              const { assignment, challenge, university, person } = item;
              return (
                <Card key={assignment.id} className="flex flex-col justify-between border-slate-200">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-indigo-600">
                            {challenge.complaintCode}
                          </span>
                          <Badge tone="slate">{challenge.category}</Badge>
                          {challenge.priority ? (
                            <PriorityBadge level={challenge.priority} />
                          ) : null}
                        </div>
                        <h3 className="mt-1.5 text-base font-semibold text-slate-900">
                          {challenge.title}
                        </h3>
                      </div>
                      {getStatusBadge(assignment.status)}
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">📍 Location:</span>
                        <span className="font-medium text-slate-800">{challenge.location}</span>
                        {assignment.distanceKm !== null ? (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            {assignment.distanceKm} km away
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>🏛️ Dispatched by:</span>
                        <span className="font-medium text-slate-700">
                          {university.organizationName || university.fullName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>🕒 Assigned on:</span>
                        <span>{new Date(assignment.assignedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {assignment.recommendationScore ? (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-indigo-50/70 p-2 text-xs text-indigo-900 border border-indigo-100">
                        <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {assignment.recommendationScore}% MATCH
                        </span>
                        <span className="truncate">
                          Recommended based on proximity, electrical & technical expertise
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/field/assignments/${assignment.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                      >
                        Open Assignment →
                      </Link>
                      <Link
                        href={`/challenges/${challenge.id}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Problem Page
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      {assignment.status === "FIELD_PERSON_ASSIGNED" ? (
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => handleAccept(assignment.id)}
                        >
                          ✓ Accept Visit
                        </Button>
                      ) : null}

                      {assignment.status === "VISIT_ACCEPTED" ? (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleStart(assignment.id)}
                        >
                          🚗 Start Visit
                        </Button>
                      ) : null}

                      {assignment.status === "FIELD_VERIFICATION_IN_PROGRESS" ? (
                        <Link
                          href={`/field/assignments/${assignment.id}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          📝 Fill Report
                        </Link>
                      ) : null}
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
