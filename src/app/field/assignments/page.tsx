"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Empty, Loading, PriorityBadge, SectionTitle, inputClass } from "@/components/ui";
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

export default function FieldAssignmentsPage() {
  const { pushToast } = useApp();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

  const filtered = useMemo(() => {
    return assignments.filter((item) => {
      const s = item.assignment.status;
      if (activeTab === "ASSIGNED" && s !== "FIELD_PERSON_ASSIGNED") return false;
      if (activeTab === "ACCEPTED" && s !== "VISIT_ACCEPTED") return false;
      if (activeTab === "IN_PROGRESS" && s !== "FIELD_VERIFICATION_IN_PROGRESS") return false;
      if (activeTab === "COMPLETED" && !["FIELD_RESOLVED", "FIELD_REPORT_SUBMITTED", "COMPLETED"].includes(s)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.challenge.title.toLowerCase().includes(q);
        const matchesCode = item.challenge.complaintCode.toLowerCase().includes(q);
        const matchesLoc = item.challenge.location.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesLoc) return false;
      }
      return true;
    });
  }, [assignments, activeTab, searchQuery]);

  const counts = useMemo(() => ({
    ALL: assignments.length,
    ASSIGNED: assignments.filter((a) => a.assignment.status === "FIELD_PERSON_ASSIGNED").length,
    ACCEPTED: assignments.filter((a) => a.assignment.status === "VISIT_ACCEPTED").length,
    IN_PROGRESS: assignments.filter((a) => a.assignment.status === "FIELD_VERIFICATION_IN_PROGRESS").length,
    COMPLETED: assignments.filter((a) =>
      ["FIELD_RESOLVED", "FIELD_REPORT_SUBMITTED", "COMPLETED"].includes(a.assignment.status)
    ).length,
  }), [assignments]);

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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assigned Field Verifications</h1>
            <p className="mt-1 text-sm text-slate-500">
              All physical inspection assignments assigned to your profile by partner universities.
            </p>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600">
            {[
              ["ALL", `All (${counts.ALL})`],
              ["ASSIGNED", `New (${counts.ASSIGNED})`],
              ["ACCEPTED", `Accepted (${counts.ACCEPTED})`],
              ["IN_PROGRESS", `In Progress (${counts.IN_PROGRESS})`],
              ["COMPLETED", `Completed (${counts.COMPLETED})`],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === key ? "bg-white font-semibold text-slate-900 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by code, title or location…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {loading ? (
          <Loading label="Loading assignments…" />
        ) : filtered.length === 0 ? (
          <Empty message="No assignments found in this view." />
        ) : (
          <div className="grid gap-4">
            {filtered.map((item) => {
              const { assignment, challenge, university, person } = item;
              return (
                <Card key={assignment.id} className="border-slate-200 p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2">
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">📍</span>
                          <span className="font-medium text-slate-700">{challenge.location}</span>
                          {assignment.distanceKm !== null ? (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                              {assignment.distanceKm} km
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">🏛️</span>
                          <span>University: <strong>{university.organizationName || university.fullName}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">🕒</span>
                          <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {assignment.recommendationReasons && assignment.recommendationReasons.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {assignment.recommendationReasons.map((reason, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                            >
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                      <Link
                        href={`/field/assignments/${assignment.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                      >
                        View Details & Inspection →
                      </Link>

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
