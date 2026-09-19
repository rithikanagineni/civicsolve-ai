"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Empty, Field, Loading, PriorityBadge, SectionTitle, inputClass } from "@/components/ui";
import { CivicMap, type MapCandidate } from "@/components/CivicMap";
import { apiError, get, post } from "@/lib/api";
import { useApp } from "@/context/AppContext";

type AssignmentDetailResponse = {
  assignment: {
    id: number;
    challengeId: number;
    fieldPersonId: number;
    universityId: number;
    status: string;
    assignedAt: string;
    startedAt: string | null;
    completedAt: string | null;
    distanceKm: number | null;
    recommendationScore: number | null;
    recommendationReasons: string[] | null;
  };
  challenge: {
    id: number;
    title: string;
    description: string;
    complaintCode: string;
    category: string;
    subcategory?: string | null;
    location: string;
    latitude: number | null;
    longitude: number | null;
    priority: string;
    urgencyLevel?: string;
    reportedAt?: string;
    status: string;
    images?: string[];
  };
  university: {
    id: number;
    organizationName: string | null;
    fullName: string;
    email: string;
    phone?: string | null;
  };
  person: {
    id: number;
    fullName: string;
    registeredLocation: string | null;
    latitude: number | null;
    longitude: number | null;
    skills: string[];
    expertise: string[];
    experienceYears: number | null;
    mobile: string | null;
  };
  reports: Array<{
    id: number;
    verified: boolean;
    problemExists: string;
    currentSituation: string | null;
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
  }>;
};

export default function FieldAssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.id;
  const { pushToast } = useApp();

  const [data, setData] = useState<AssignmentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Verification Report Form State
  const [form, setForm] = useState({
    verified: "YES",
    problemExists: "YES",
    severity: "HIGH",
    observations: "",
    affectedPeople: "50",
    locationConfirmed: true,
    canResolveDirectly: "NO",
    solutionPerformed: "",
    materialsUsed: "",
    recommendedAction: "",
    universitySupportReason: "",
    requiredResources: "",
    photos: [
      "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600&auto=format&fit=crop&q=80",
    ],
    newPhotoUrl: "",
  });

  const load = useCallback(() => {
    get<AssignmentDetailResponse>(`/field-assignments/${assignmentId}`)
      .then((res) => {
        setData(res);
        if (res.challenge?.priority) {
          setForm((prev) => ({
            ...prev,
            severity: res.challenge.priority || "HIGH",
          }));
        }
      })
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [assignmentId, pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await post(`/field-assignments/${assignmentId}/accept`);
      pushToast("Field visit accepted successfully", "success");
      load();
    } catch (e) {
      pushToast(apiError(e), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async () => {
    setSubmitting(true);
    try {
      await post(`/field-assignments/${assignmentId}/start`);
      pushToast("Field visit started! On-site inspection is in progress.", "success");
      load();
    } catch (e) {
      pushToast(apiError(e), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPhoto = () => {
    if (!form.newPhotoUrl.trim()) return;
    setForm((prev) => ({
      ...prev,
      photos: [...prev.photos, prev.newPhotoUrl.trim()],
      newPhotoUrl: "",
    }));
  };

  const handleRemovePhoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.observations.trim()) {
      pushToast("Please provide detailed observations from the field visit.", "error");
      return;
    }

    const isDirect = form.canResolveDirectly === "YES";
    if (isDirect && !form.solutionPerformed.trim()) {
      pushToast("Please describe the physical solution performed.", "error");
      return;
    }
    if (!isDirect && !form.universitySupportReason.trim() && !form.recommendedAction.trim()) {
      pushToast("Please provide the recommended action or reason why university engineering intervention is needed.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        verified: form.verified === "YES",
        problemExists: form.problemExists,
        severity: form.severity,
        observations: form.observations,
        affectedPeople: Number(form.affectedPeople) || 0,
        locationConfirmed: form.locationConfirmed,
        canResolveDirectly: isDirect,
        solutionPerformed: form.solutionPerformed,
        materialsUsed: form.materialsUsed,
        recommendedSolution: form.recommendedAction,
        recommendedAction: form.recommendedAction,
        universitySupportReason: form.universitySupportReason,
        requiredResources: form.requiredResources,
        photos: form.photos,
      };

      await post(`/field-assignments/${assignmentId}/verification-report`, payload);
      pushToast(
        isDirect
          ? "Field problem marked as resolved! Citizen validation has been requested."
          : "Field verification report submitted. Dispatched to university team.",
        "success"
      );
      load();
    } catch (e) {
      pushToast(apiError(e), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell role="FIELD_PERSON">
        <Loading label="Loading assignment details…" />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell role="FIELD_PERSON">
        <Empty message="Assignment not found or you do not have permission to view it." />
      </AppShell>
    );
  }

  const { assignment, challenge, university, person, reports } = data;
  const latestReport = reports && reports.length > 0 ? reports[0] : null;

  // Build map candidate marker
  const mapCandidates: MapCandidate[] = person.latitude && person.longitude ? [
    {
      id: person.id,
      fullName: person.fullName,
      registeredLocation: person.registeredLocation,
      latitude: person.latitude,
      longitude: person.longitude,
      availabilityStatus: "ASSIGNED",
      distanceKm: assignment.distanceKm ?? 4.2,
      isAssigned: true,
      skills: person.skills,
      expertise: person.expertise,
      experienceYears: person.experienceYears ?? 5,
    },
  ] : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FIELD_PERSON_ASSIGNED":
        return <Badge tone="amber">PENDING VISIT ACCEPTANCE</Badge>;
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
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/field/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/field/assignments" className="hover:text-slate-900">
            Assignments
          </Link>
          <span>/</span>
          <span className="font-mono font-semibold text-slate-800">{challenge.complaintCode}</span>
        </div>

        {/* Top Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  {challenge.complaintCode}
                </span>
                <Badge tone="slate">{challenge.category}</Badge>
                {challenge.subcategory ? <Badge tone="slate">{challenge.subcategory}</Badge> : null}
                {challenge.priority ? <PriorityBadge level={challenge.priority} /> : null}
                {getStatusBadge(assignment.status)}
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {challenge.title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Assigned on {new Date(assignment.assignedAt).toLocaleString()} by{" "}
                <strong>{university.organizationName || university.fullName}</strong>
              </p>
            </div>

            {assignment.recommendationScore ? (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 text-right">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">AI Recommendation</p>
                <p className="text-2xl font-bold text-indigo-900">{assignment.recommendationScore}% Match</p>
                <p className="text-xs text-indigo-700">6-Factor Algorithmic Ranking</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Action Banners & Progress Triggers */}
        {assignment.status === "FIELD_PERSON_ASSIGNED" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-amber-900">Action Required: Accept Field Visit</h3>
                <p className="mt-1 text-sm text-amber-800">
                  Please review the site details below and confirm acceptance of this on-ground verification assignment.
                </p>
              </div>
              <Button
                variant="primary"
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 shadow"
                disabled={submitting}
                onClick={handleAccept}
              >
                {submitting ? "Accepting…" : "✓ Accept Visit"}
              </Button>
            </div>
          </div>
        )}

        {assignment.status === "VISIT_ACCEPTED" && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-indigo-900">Visit Accepted: Ready for Site Travel</h3>
                <p className="mt-1 text-sm text-indigo-800">
                  Travel to the registered location ({challenge.location}). Click below when you arrive to begin the physical verification.
                </p>
              </div>
              <Button
                variant="success"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 shadow"
                disabled={submitting}
                onClick={handleStart}
              >
                {submitting ? "Starting…" : "🚗 Start Visit (On-Ground)"}
              </Button>
            </div>
          </div>
        )}

        {assignment.status === "FIELD_VERIFICATION_IN_PROGRESS" && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
              </span>
              <div>
                <h3 className="text-base font-semibold text-sky-900">Field Verification In Progress</h3>
                <p className="mt-0.5 text-sm text-sky-800">
                  Visit started at {assignment.startedAt ? new Date(assignment.startedAt).toLocaleTimeString() : "site"}. Please complete the verification report below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid: Problem Info & Geographic Map */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Problem & University Overview */}
          <div className="space-y-6">
            <Card className="border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Problem Description</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {challenge.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
                <div>
                  <span className="text-slate-400">Category:</span>
                  <p className="font-medium text-slate-800">{challenge.category}</p>
                </div>
                <div>
                  <span className="text-slate-400">Subcategory:</span>
                  <p className="font-medium text-slate-800">{challenge.subcategory || "N/A"}</p>
                </div>
                <div>
                  <span className="text-slate-400">Location:</span>
                  <p className="font-medium text-slate-800">{challenge.location}</p>
                </div>
                <div>
                  <span className="text-slate-400">Coordinates:</span>
                  <p className="font-medium text-slate-800">
                    {challenge.latitude ? `${challenge.latitude.toFixed(4)}, ${challenge.longitude?.toFixed(4)}` : "Unavailable"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">University Coordinator & Assignment Details</h2>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">University:</span>
                  <span className="font-semibold text-slate-800">{university.organizationName || university.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coordinator:</span>
                  <span className="text-slate-800">{university.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact Email:</span>
                  <span className="font-mono text-xs text-slate-700">{university.email}</span>
                </div>
                {university.phone ? (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact Phone:</span>
                    <span className="text-slate-800">{university.phone}</span>
                  </div>
                ) : null}
              </div>

              {assignment.recommendationReasons && assignment.recommendationReasons.length > 0 ? (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Matching Criteria</p>
                  <ul className="mt-2 space-y-1">
                    {assignment.recommendationReasons.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="text-emerald-500">✓</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card>

            <Card className="border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Your Field Profile Match</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <span className="text-xs text-slate-400">Registered Base Location:</span>
                  <p className="font-medium text-slate-800">{person.registeredLocation || "Hyderabad Area"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Your Skills:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {person.skills.map((s, i) => (
                      <span key={i} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Expertise Areas:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {person.expertise.map((e, i) => (
                      <span key={i} className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 border border-indigo-100">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Map Component */}
          <div className="space-y-6">
            <Card className="border-slate-200 p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Problem & Field Person Location</h3>
                  <p className="text-xs text-slate-500">
                    🔴 Problem Site · 🟢 Your Registered Base Location ({assignment.distanceKm ?? 4.2} km away)
                  </p>
                </div>
                <Badge tone="slate">Registered Location (Not Live GPS)</Badge>
              </div>

              <div className="p-4">
                <CivicMap
                  problemLocation={{
                    title: challenge.title,
                    latitude: challenge.latitude,
                    longitude: challenge.longitude,
                    address: challenge.location,
                  }}
                  candidates={mapCandidates}
                  assignedCandidateId={person.id}
                  radiusKm={5}
                  className="h-[340px]"
                />
              </div>

              <div className="bg-slate-50 p-3 text-xs text-slate-500 border-t border-slate-100 flex items-center justify-between">
                <span>📍 Distance to Problem: <strong>{assignment.distanceKm ?? 4.2} km</strong></span>
                <span>Base: {person.registeredLocation ?? "Jeedimetla"} → Site: {challenge.location}</span>
              </div>
            </Card>

            {challenge.images && challenge.images.length > 0 ? (
              <Card className="border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Citizen Uploaded Media</h3>
                <div className="grid grid-cols-2 gap-2">
                  {challenge.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Citizen report evidence"
                      className="rounded-xl object-cover h-36 w-full border border-slate-200"
                    />
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </div>

        {/* Verification Form (When In Progress) */}
        {assignment.status === "FIELD_VERIFICATION_IN_PROGRESS" && (
          <div className="rounded-2xl border-2 border-indigo-600 bg-white p-6 shadow-md" id="report">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white uppercase">
                  STEP 3
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  Field Verification & Technical Inspection Form
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Provide on-ground verification metrics, observations, evidence photos, and choose direct resolution or university engineering escalation.
              </p>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Does Problem Exist on Ground?">
                  <select
                    className={inputClass}
                    value={form.problemExists}
                    onChange={(e) => setForm({ ...form, problemExists: e.target.value })}
                  >
                    <option value="YES">YES - Confirmed</option>
                    <option value="PARTIALLY">PARTIALLY - Minor Variance</option>
                    <option value="NO">NO - False Report</option>
                  </select>
                </Field>

                <Field label="Physical Verification Completed?">
                  <select
                    className={inputClass}
                    value={form.verified}
                    onChange={(e) => setForm({ ...form, verified: e.target.value })}
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </Field>

                <Field label="Observed Severity Level">
                  <select
                    className={inputClass}
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </Field>

                <Field label="Estimated Affected Citizens">
                  <input
                    type="number"
                    className={inputClass}
                    value={form.affectedPeople}
                    onChange={(e) => setForm({ ...form, affectedPeople: e.target.value })}
                    placeholder="e.g. 50"
                  />
                </Field>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.locationConfirmed}
                    onChange={(e) => setForm({ ...form, locationConfirmed: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800">
                      Confirm Problem Coordinates on Ground
                    </span>
                    <p className="text-xs text-slate-500">
                      I have physically inspected the site at {challenge.location} ({challenge.latitude?.toFixed(4)}, {challenge.longitude?.toFixed(4)}).
                    </p>
                  </div>
                </label>
              </div>

              <Field label="Detailed On-Ground Observations" hint="Describe physical conditions, hazards, causes, wiring/infrastructure state.">
                <textarea
                  rows={4}
                  className={inputClass}
                  value={form.observations}
                  onChange={(e) => setForm({ ...form, observations: e.target.value })}
                  placeholder="e.g. Inspected 4 streetlight poles outside Shapur Primary School. 3 lamps have burned-out ballasts and damaged underground feeder wiring. Heavy pedestrian and student traffic during 6 PM - 8 PM creates urgent safety risk."
                />
              </Field>

              {/* Photo Evidence Upload */}
              <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">
                  Photo Evidence & Site Inspection Images
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {form.photos.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video">
                      <img src={url} alt={`Site evidence ${idx + 1}`} className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs opacity-80 hover:opacity-100"
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Enter evidence photo URL (e.g. https://...)"
                    value={form.newPhotoUrl}
                    onChange={(e) => setForm({ ...form, newPhotoUrl: e.target.value })}
                    className={inputClass}
                  />
                  <Button variant="outline" onClick={handleAddPhoto} size="sm">
                    + Add Image
                  </Button>
                </div>
              </div>

              {/* Resolution Action Selector */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-semibold text-slate-900 mb-2">Resolution Path Decision</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Can this problem be resolved directly on-field, or does it require technical development & resources from the university?
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      form.canResolveDirectly === "YES"
                        ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="canResolveDirectly"
                      value="YES"
                      checked={form.canResolveDirectly === "YES"}
                      onChange={(e) => setForm({ ...form, canResolveDirectly: e.target.value })}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 text-sm">Option A: Direct Field Resolution</span>
                      <p className="text-xs text-slate-500 mt-1">
                        Solved immediately on ground (minor repair, bulb replacement, fuse reset, clearing blockage). Moves directly to citizen validation.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      form.canResolveDirectly === "NO"
                        ? "border-indigo-500 bg-indigo-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="canResolveDirectly"
                      value="NO"
                      checked={form.canResolveDirectly === "NO"}
                      onChange={(e) => setForm({ ...form, canResolveDirectly: e.target.value })}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 text-sm">Option B: University Action Required</span>
                      <p className="text-xs text-slate-500 mt-1">
                        Requires university engineering intervention, student project design, hardware replacement, IoT sensors, or municipal budget.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Conditional Fields based on resolution path */}
                {form.canResolveDirectly === "YES" ? (
                  <div className="mt-4 space-y-4 pt-4 border-t border-slate-200">
                    <Field label="Solution Performed (Required for Direct Resolution)">
                      <textarea
                        rows={3}
                        className={inputClass}
                        value={form.solutionPerformed}
                        onChange={(e) => setForm({ ...form, solutionPerformed: e.target.value })}
                        placeholder="e.g. Replaced faulty 70W sodium lamp with new LED fixture, re-insulated junction box cables, tested circuit."
                      />
                    </Field>
                    <Field label="Materials & Tools Used">
                      <input
                        type="text"
                        className={inputClass}
                        value={form.materialsUsed}
                        onChange={(e) => setForm({ ...form, materialsUsed: e.target.value })}
                        placeholder="e.g. 70W LED fixture, 10m insulated copper cable, wire connectors, multimeter"
                      />
                    </Field>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4 pt-4 border-t border-slate-200">
                    <Field label="Recommended Solution / University Engineering Action">
                      <textarea
                        rows={3}
                        className={inputClass}
                        value={form.recommendedAction}
                        onChange={(e) => setForm({ ...form, recommendedAction: e.target.value })}
                        placeholder="e.g. Install smart solar-powered IoT street lighting poles with LDR automatic dimming and energy monitoring module."
                      />
                    </Field>
                    <Field label="Reason University Support is Needed">
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={form.universitySupportReason}
                        onChange={(e) => setForm({ ...form, universitySupportReason: e.target.value })}
                        placeholder="e.g. Entire underground cabling is corroded beyond simple patch repair. Requires electrical engineering team design and smart grid integration."
                      />
                    </Field>
                    <Field label="Estimated Resources / Hardware Required">
                      <input
                        type="text"
                        className={inputClass}
                        value={form.requiredResources}
                        onChange={(e) => setForm({ ...form, requiredResources: e.target.value })}
                        placeholder="e.g. 4x Solar LED fixtures, Microcontroller IoT boards, 50m armored cable, university lab testing"
                      />
                    </Field>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="submit"
                  variant={form.canResolveDirectly === "YES" ? "success" : "primary"}
                  disabled={submitting}
                  className="px-8 py-3 text-base shadow-md"
                >
                  {submitting
                    ? "Submitting Report…"
                    : form.canResolveDirectly === "YES"
                    ? "✓ Complete Direct Resolution & Notify Citizen"
                    : "🚀 Submit Report & Escalate to University"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Submitted Field Verification Report (Read-only) */}
        {latestReport && (
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    VERIFIED & SUBMITTED
                  </span>
                  <span className="text-xs text-slate-500">
                    Submitted on {new Date(latestReport.submittedAt).toLocaleString()}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Field Verification Inspection Report
                </h2>
              </div>
              <Badge tone={latestReport.canResolveDirectly ? "emerald" : "indigo"}>
                {latestReport.canResolveDirectly ? "DIRECTLY RESOLVED" : "UNIVERSITY ACTION REQUIRED"}
              </Badge>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Problem Exists</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{latestReport.problemExists}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Observed Severity</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{latestReport.severity || "HIGH"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Affected People</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{latestReport.affectedPeople || "50"}+ citizens</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Location Coordinates</p>
                <p className="mt-1 text-sm font-semibold text-emerald-700">✓ Confirmed On-Ground</p>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Observations</h4>
                <p className="mt-1 rounded-xl bg-slate-50 p-3 text-slate-800 leading-relaxed border border-slate-100">
                  {latestReport.observations}
                </p>
              </div>

              {latestReport.canResolveDirectly ? (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Solution Performed on Site</h4>
                  <p className="mt-1 rounded-xl bg-emerald-50/50 p-3 text-emerald-900 leading-relaxed border border-emerald-100">
                    {latestReport.solutionPerformed}
                  </p>
                  {latestReport.materialsUsed ? (
                    <p className="mt-2 text-xs text-slate-500">
                      <strong>Materials Used:</strong> {latestReport.materialsUsed}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Recommended Engineering Solution</h4>
                    <p className="mt-1 rounded-xl bg-indigo-50/50 p-3 text-indigo-900 leading-relaxed border border-indigo-100">
                      {latestReport.recommendedSolution || latestReport.recommendedAction}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reason University Support is Needed</h4>
                    <p className="mt-1 rounded-xl bg-slate-50 p-3 text-slate-700 leading-relaxed border border-slate-100">
                      {latestReport.universitySupportReason}
                    </p>
                  </div>
                </div>
              )}

              {latestReport.photos && latestReport.photos.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Photo Evidence</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {latestReport.photos.map((p, idx) => (
                      <img
                        key={idx}
                        src={p}
                        alt={`Evidence ${idx + 1}`}
                        className="rounded-xl object-cover h-32 w-full border border-slate-200"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
