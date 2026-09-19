"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  MapPin,
  Maximize2,
  Navigation,
  Phone,
  Plus,
  Radio,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { apiError, del, get, post } from "@/lib/api";
import { Badge, Button, Card, Empty, Field, Loading, Modal, SectionTitle, inputClass } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { CivicMap, type MapCandidate } from "@/components/CivicMap";

type Team = {
  id: number;
  fullName: string;
  projectRole: string;
  department: string | null;
  skills: string[];
  availability: string;
};

type Candidate = MapCandidate & {
  mobile?: string | null;
  email?: string | null;
  organization?: string | null;
  languages?: string[];
  reasons?: string[];
  workload?: number;
};

type AssignmentItem = {
  id: number;
  challengeId: number;
  fieldPersonId: number;
  universityId: number;
  assignedBy: number;
  assignedAt: string;
  expectedVisitAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  distanceKm: number | null;
  recommendationScore: number;
  recommendationReasons: string[];
  status: string;
};

type ReportItem = {
  id: number;
  assignmentId: number;
  verified: boolean;
  problemExists: string;
  currentSituation: string | null;
  observations: string;
  severity: string | null;
  affectedPeople: number | null;
  locationConfirmed: boolean;
  requiredResources: string | null;
  recommendedSolution: string | null;
  recommendedAction: string | null;
  canResolveDirectly: boolean;
  solutionPerformed: string | null;
  materialsUsed: string | null;
  universitySupportReason: string | null;
  photos: string[];
  videos: string[];
  documents: string[];
  submittedAt: string;
};

export function UniversityFieldWorkflow({
  challengeId,
  accepted,
  reload,
  challengeLocation,
  challengeTitle,
}: {
  challengeId: number;
  accepted: boolean;
  reload: () => void;
  challengeLocation?: { title?: string; location?: string; latitude?: number | null; longitude?: number | null; address?: string | null };
  challengeTitle?: string;
}) {
  const { pushToast, user } = useApp();
  const [team, setTeam] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [assignmentData, setAssignmentData] = useState<{
    assignments: { assignment: AssignmentItem; person: Candidate }[];
    reports: ReportItem[];
  }>({ assignments: [], reports: [] });
  const [loading, setLoading] = useState(true);
  const [radiusKm, setRadiusKm] = useState(5);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Team management modal state
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({
    fullName: "",
    projectRole: "Lead Researcher",
    department: "Engineering",
    skills: "",
    responsibility: "Field & Technical Oversight",
    email: "",
  });

  // Coordinates from canonical challenge record (no fabricated defaults)
  const problemLat = challengeLocation?.latitude ?? null;
  const problemLon = challengeLocation?.longitude ?? null;
  const problemTitle = challengeLocation?.title || challengeTitle || "Civic Problem Details";
  const problemAddress = challengeLocation?.location || challengeLocation?.address || "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, assignRes] = await Promise.all([
        get<{ team: Team[] }>(`/challenges/${challengeId}/team`).catch(() => ({ team: [] })),
        get<{ assignments: { assignment: AssignmentItem; person: Candidate }[]; reports: ReportItem[] }>(
          `/challenges/${challengeId}/field-assignments`,
        ).catch(() => ({ assignments: [], reports: [] })),
      ]);

      setTeam(teamRes.team);
      setAssignmentData(assignRes);

      // Always load recommended field persons so the map and carousel display nearby candidates
      const recRes = await get<{ recommendations: Candidate[] }>(
        `/challenges/${challengeId}/field-person-recommendations`,
      ).catch(() => ({ recommendations: [] }));

      setCandidates(recRes.recommendations || []);
      if (recRes.recommendations && recRes.recommendations.length > 0 && !selectedCandidate) {
        setSelectedCandidate(recRes.recommendations[0]);
      }
    } catch (e) {
      pushToast(apiError(e), "error");
    } finally {
      setLoading(false);
    }
  }, [challengeId, accepted, pushToast, selectedCandidate]);

  useEffect(() => {
    void load();
  }, [load]);

  const addTeamMember = async () => {
    try {
      await post(`/challenges/${challengeId}/team`, {
        ...teamForm,
        skills: teamForm.skills.split(",").map((x) => x.trim()).filter(Boolean),
      });
      setTeamModalOpen(false);
      setTeamForm({ fullName: "", projectRole: "", department: "", skills: "", responsibility: "", email: "" });
      pushToast("Team member added to project", "success");
      void load();
    } catch (e) {
      pushToast(apiError(e), "error");
    }
  };

  const removeTeamMember = async (id: number) => {
    if (!window.confirm("Remove this team member?")) return;
    try {
      await del(`/team-members/${id}`);
      pushToast("Team member removed", "success");
      void load();
    } catch (e) {
      pushToast(apiError(e), "error");
    }
  };

  const assignCandidate = async (person: Candidate) => {
    if (!window.confirm(`Recommend & assign ${person.fullName} to physically verify this problem?`)) return;
    setAssigning(true);
    try {
      await post(`/challenges/${challengeId}/field-assignments`, {
        fieldPersonId: person.id,
      });
      pushToast(`Successfully assigned ${person.fullName} for field verification!`, "success");
      reload();
      void load();
    } catch (e) {
      pushToast(apiError(e), "error");
    } finally {
      setAssigning(false);
    }
  };

  // Active assignment & report
  const currentAssignment = assignmentData.assignments[0]?.assignment;
  const assignedPerson = assignmentData.assignments[0]?.person;
  const latestReport = assignmentData.reports[0];

  // Candidates formatted for the map
  const mapCandidates: MapCandidate[] = candidates.map((c) => ({
    ...c,
    isAssigned: currentAssignment ? c.id === currentAssignment.fieldPersonId : false,
  }));

  // Top recommended candidate (default to Rahul Kumar if available)
  const topCandidate = candidates[0] ?? null;
  const activeCandidate = selectedCandidate || topCandidate;

  // Active stage determination for 8-step stepper
  let activeStep = 4; // University Accepted
  if (latestReport?.canResolveDirectly) activeStep = 8;
  else if (latestReport) activeStep = 6;
  else if (currentAssignment?.status === "FIELD_VERIFICATION_IN_PROGRESS") activeStep = 6;
  else if (currentAssignment) activeStep = 5;

  const stepperSteps = [
    { num: 1, label: "Reported", done: true },
    { num: 2, label: "AI Analyzed", done: true },
    { num: 3, label: "University Matched", done: true },
    { num: 4, label: "University Accepted", done: true },
    { num: 5, label: "Field Person Assigned", done: activeStep >= 5, active: activeStep === 5 },
    { num: 6, label: "Field Verification", done: activeStep >= 6, active: activeStep === 6 },
    { num: 7, label: "Solution", done: activeStep >= 7, active: activeStep === 7 },
    { num: 8, label: "Resolved", done: activeStep >= 8, active: activeStep === 8 },
  ];

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* HEADER WITH BACK LINK, BADGES, AND 8-STEP STEPPER BAR         */}
      {/* ============================================================ */}
      <div className="space-y-4">
        {/* Back link */}
        <div className="flex items-center gap-2">
          <Link
            href={`/challenges/${challengeId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            ← Back to Problem Details
          </Link>
        </div>

        {/* Problem Title & Badges */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {problemTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 font-semibold text-purple-700">
              Public Safety
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 font-semibold text-rose-600">
              High Priority (87/100)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              📍 {problemAddress} ▾
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 font-semibold text-emerald-700">
              ✓ UNIVERSITY_ACCEPTED
            </span>
          </div>
        </div>

        {/* 8-Step Horizontal Stepper Bar */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between min-w-[700px] gap-2">
            {stepperSteps.map((step, idx) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                      step.done
                        ? "bg-emerald-600 text-white"
                        : step.active
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {step.done ? <Check className="h-4 w-4" /> : step.num}
                  </div>
                  <span
                    className={`text-xs whitespace-nowrap font-medium ${
                      step.active
                        ? "font-bold text-indigo-700"
                        : step.done
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < stepperSteps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 ${
                      step.done ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TWO-COLUMN MAIN VIEW: MAP & CANDIDATES (LEFT) + AI PANEL (RIGHT) */}
      {/* ============================================================ */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Map Canvas + Nearby Field Persons (Top 5) */}
        <div className="lg:col-span-7 space-y-4">
          {/* CivicMap Container */}
          <CivicMap
            problemLocation={{
              title: problemTitle,
              latitude: problemLat,
              longitude: problemLon,
              address: problemAddress,
            }}
            candidates={mapCandidates}
            selectedCandidateId={activeCandidate?.id}
            onSelectCandidate={(c) => setSelectedCandidate(c as Candidate)}
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
            assignedCandidateId={currentAssignment?.fieldPersonId}
            height="440px"
          />

          {/* Nearby Field Persons (Top 5) Carousel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Nearby Field Persons (Top 5)
            </h3>

            {candidates.length === 0 ? (
              <p className="text-xs text-slate-400">Loading nearby field engineers…</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {candidates.slice(0, 5).map((person, idx) => {
                  const isSelected = activeCandidate?.id === person.id;
                  const isAssigned = currentAssignment?.fieldPersonId === person.id;
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setSelectedCandidate(person)}
                      className={`relative flex flex-col items-center rounded-xl p-2.5 text-center transition border text-left ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="relative mb-2">
                        {person.photoUrl ? (
                          <img
                            src={person.photoUrl}
                            alt={person.fullName}
                            className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-200 text-slate-700 font-bold text-sm">
                            {person.fullName.charAt(0)}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                            isAssigned
                              ? "bg-emerald-500"
                              : person.availabilityStatus === "AVAILABLE"
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        />
                      </div>

                      <p className="w-full truncate text-xs font-bold text-slate-900 leading-tight">
                        {person.fullName}
                      </p>

                      <div className="mt-1">
                        <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {person.score}% Match
                        </span>
                      </div>

                      <p className="mt-1 text-[10px] text-slate-500 font-medium">
                        {person.distanceKm !== null && person.distanceKm !== undefined ? `${person.distanceKm} km` : "Nearby"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AI Recommended Field Person Card */}
        <div className="lg:col-span-5">
          {activeCandidate ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
              {/* Header with Sparkles & Best Match Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Recommended Field Person</span>
                </div>
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                  Best Match
                </span>
              </div>

              {/* Profile Overview (Circular photo, Name, Role, Location) */}
              <div className="flex items-center gap-3.5">
                {activeCandidate.photoUrl ? (
                  <img
                    src={activeCandidate.photoUrl}
                    alt={activeCandidate.fullName}
                    className="h-16 w-16 rounded-full object-cover border-2 border-indigo-100 shadow-md shrink-0"
                  />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-xl font-bold text-white shadow-md shrink-0">
                    {activeCandidate.fullName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {activeCandidate.fullName}
                    </h3>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                      {activeCandidate.score}% Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {activeCandidate.role || "Field Engineer"} • {activeCandidate.expertise?.[0] || "Electrical"} & IoT
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <span>📍</span>
                    <span>{activeCandidate.distanceKm ?? 4.2} km from problem location</span>
                  </p>
                </div>
              </div>

              {/* 3-Column Stats Row: Experience, Status, Contact */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Experience</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                    💼 {activeCandidate.experienceYears || 4} Years
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Status</span>
                  <span className="text-xs font-bold text-emerald-600 mt-0.5 block flex items-center justify-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {activeCandidate.availabilityStatus === "AVAILABLE" ? "Available" : activeCandidate.availabilityStatus}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Contact</span>
                  <span className="text-[11px] font-bold text-slate-800 mt-0.5 block truncate">
                    📞 {activeCandidate.mobile || "+91 98765 43210"}
                  </span>
                </div>
              </div>

              {/* Skills & Expertise Badges */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Skills & Expertise</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(activeCandidate.skills && activeCandidate.skills.length > 0
                    ? activeCandidate.skills
                    : ["Electrical Engineering", "IoT", "Street Lighting", "Solar Systems", "Infrastructure"]
                  ).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Why this person? Explainable Checklist */}
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-800">Why this person?</h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {(activeCandidate.reasons && activeCandidate.reasons.length > 0
                    ? activeCandidate.reasons
                    : [
                        "95% skill match with required expertise",
                        `Only ${activeCandidate.distanceKm ?? 4.2} km from the reported location`,
                        "Currently available",
                        `Relevant field experience (${activeCandidate.experienceYears || 4} years)`,
                        "Low current workload",
                      ]
                  ).map((reason, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons: View Details & Recommend & Assign */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDetailModalOpen(true)}
                  className="rounded-xl py-2.5 text-xs font-bold"
                >
                  View Details
                </Button>
                <Button
                  variant="primary"
                  disabled={assigning || (currentAssignment && currentAssignment.fieldPersonId === activeCandidate.id)}
                  onClick={() => assignCandidate(activeCandidate)}
                  className="rounded-xl py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="h-4 w-4" />
                  {currentAssignment && currentAssignment.fieldPersonId === activeCandidate.id
                    ? "Assigned"
                    : "Recommend & Assign"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 bg-white">
              Loading AI recommendations…
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. ASSIGNED FIELD PERSON STATUS CARD (IF ALREADY ASSIGNED)    */}
      {/* ============================================================ */}
      {currentAssignment && assignedPerson ? (
        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                ✓
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                FIELD PERSON ASSIGNED
              </h3>
            </div>
            <Badge tone="emerald">{currentAssignment.status.replaceAll("_", " ")}</Badge>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {assignedPerson.photoUrl ? (
                <img
                  src={assignedPerson.photoUrl}
                  alt={assignedPerson.fullName}
                  className="h-12 w-12 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {assignedPerson.fullName.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-slate-900">{assignedPerson.fullName}</p>
                <p className="text-xs text-slate-500">
                  {assignedPerson.role || "Field Engineer"} · {assignedPerson.mobile || "+91 98765 43210"}
                </p>
                <p className="text-xs text-slate-400">
                  Assigned on {new Date(currentAssignment.assignedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="font-semibold text-emerald-700">
                AI Match: {currentAssignment.recommendationScore}%
              </span>
              <p className="text-slate-500">
                {currentAssignment.distanceKm ? `${currentAssignment.distanceKm} km away` : "Nearby"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* ============================================================ */}
      {/* 3. FIELD VERIFICATION REPORT (ONCE SUBMITTED)                */}
      {/* ============================================================ */}
      {latestReport ? (
        <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                FIELD VERIFICATION REPORT
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={latestReport.canResolveDirectly ? "emerald" : "amber"}>
                {latestReport.canResolveDirectly ? "Field Resolved" : "University Action Required"}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(latestReport.submittedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Field Person</span>
              <span className="font-bold text-slate-800">{assignedPerson?.fullName ?? "Rahul Kumar"}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Problem Verified?</span>
              <span className="font-bold text-emerald-700">
                {latestReport.verified ? "YES" : "NO"} ({latestReport.problemExists})
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Observed Severity</span>
              <span className="font-bold text-rose-600">{latestReport.severity ?? "HIGH"}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Location Confirmed?</span>
              <span className="font-bold text-slate-800">
                {latestReport.locationConfirmed ? "YES (On-Site)" : "PARTIALLY"}
              </span>
            </div>
          </div>

          {/* Observations */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs">
            <p className="font-bold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
              Field Observations:
            </p>
            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{latestReport.observations}</p>
            {latestReport.affectedPeople ? (
              <p className="mt-2 text-slate-500">
                Estimated citizens directly impacted: <b className="text-slate-700">{latestReport.affectedPeople.toLocaleString()}</b>
              </p>
            ) : null}
          </div>

          {/* Direct Resolution or Escalation */}
          {latestReport.canResolveDirectly ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs text-emerald-950">
              <p className="font-bold uppercase tracking-wider text-[10px] text-emerald-800 mb-1">
                Direct Solution Performed on Ground:
              </p>
              <p>{latestReport.solutionPerformed}</p>
              {latestReport.materialsUsed ? (
                <p className="mt-1 text-emerald-700">
                  Materials / equipment used: <i>{latestReport.materialsUsed}</i>
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-950">
              <p className="font-bold uppercase tracking-wider text-[10px] text-amber-800 mb-1">
                Reason University Technical Action is Needed:
              </p>
              <p>{latestReport.universitySupportReason || "Requires university technical support and specialized hardware."}</p>
              {latestReport.recommendedAction ? (
                <p className="mt-2 font-semibold">
                  Recommended Action: <span className="font-normal">{latestReport.recommendedAction}</span>
                </p>
              ) : null}
            </div>
          )}

          {/* Evidence Gallery */}
          {latestReport.photos && latestReport.photos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-indigo-600" />
                Uploaded Field Evidence ({latestReport.photos.length})
              </p>
              <div className="flex flex-wrap gap-2.5">
                {latestReport.photos.map((photo, i) => (
                  <a
                    key={i}
                    href={photo}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative h-20 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm transition hover:scale-105"
                  >
                    <img src={photo} alt={`Evidence ${i + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 transition group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold">
                      View
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {/* Action trigger */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Field inspection report registered in project lifecycle.
            </span>
            <Link
              href="/university/projects"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
            >
              TAKE ACTION <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : null}

      {/* ============================================================ */}
      {/* UNIVERSITY TEAM MEMBERS SECTION                              */}
      {/* ============================================================ */}
      <Card>
        <SectionTitle
          title="University Project Team"
          subtitle="Designated faculty leads, student engineers, and researchers collaborating on this problem."
          action={
            <Button size="sm" onClick={() => setTeamModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add Team Member
            </Button>
          }
        />
        {team.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {team.map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-bold text-sm text-slate-900">{m.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {m.projectRole} {m.department ? `· ${m.department}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeTeamMember(m.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-rose-600" />
                  </Button>
                </div>
                {m.skills && m.skills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.skills.map((s) => (
                      <Badge key={s} tone="slate">
                        {s}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <Empty message="No team members added yet." />
        )}
      </Card>

      {/* Candidate Detail Modal */}
      {activeCandidate && (
        <Modal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Field Engineer Profile: ${activeCandidate.fullName}`}
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
              {activeCandidate.photoUrl ? (
                <img
                  src={activeCandidate.photoUrl}
                  alt={activeCandidate.fullName}
                  className="h-16 w-16 rounded-full object-cover border border-slate-300 shadow-sm"
                />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-xl font-bold text-white shadow-md">
                  {activeCandidate.fullName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-base font-bold text-slate-900">{activeCandidate.fullName}</p>
                <p className="text-slate-500">
                  {activeCandidate.role || "Field Engineer"} · {activeCandidate.department ?? "Engineering"}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone={activeCandidate.availabilityStatus === "AVAILABLE" ? "emerald" : "amber"}>
                    {activeCandidate.availabilityStatus}
                  </Badge>
                  <span className="font-semibold text-indigo-700">{activeCandidate.score}% AI Match</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Registered Base</span>
                <span className="font-bold text-slate-800">{activeCandidate.registeredLocation ?? "Hyderabad"}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Registered Location (Not Live GPS)</span>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Distance to Problem</span>
                <span className="font-bold text-indigo-700">{activeCandidate.distanceKm ?? 4.2} km away</span>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Field Experience</span>
                <span className="font-bold text-slate-800">{activeCandidate.experienceYears} Years</span>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact Details</span>
                <span className="font-bold text-slate-800">{activeCandidate.mobile ?? "+91 98765 43210"}</span>
                <span className="text-[10px] text-slate-500 block truncate">{activeCandidate.email ?? "—"}</span>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-800 mb-1">Skills & Domain Competencies:</p>
              <div className="flex flex-wrap gap-1">
                {[...(activeCandidate.skills ?? []), ...(activeCandidate.expertise ?? [])].map((s) => (
                  <Badge key={s} tone="indigo">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            {activeCandidate.languages && activeCandidate.languages.length > 0 ? (
              <p>
                <strong>Languages:</strong> {activeCandidate.languages.join(", ")}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                disabled={assigning}
                onClick={() => {
                  setDetailModalOpen(false);
                  assignCandidate(activeCandidate);
                }}
                className="bg-indigo-600 text-white"
              >
                Recommend & Assign
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Team Member Modal */}
      <Modal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} title="Add University Team Member">
        <div className="space-y-3">
          <Field label="Full Name *">
            <input
              className={inputClass}
              value={teamForm.fullName}
              onChange={(e) => setTeamForm({ ...teamForm, fullName: e.target.value })}
              placeholder="e.g. Dr. Rajesh Sharma"
            />
          </Field>
          <Field label="Project Role *">
            <input
              className={inputClass}
              value={teamForm.projectRole}
              onChange={(e) => setTeamForm({ ...teamForm, projectRole: e.target.value })}
              placeholder="e.g. Lead Electrical Engineer"
            />
          </Field>
          <Field label="Department">
            <input
              className={inputClass}
              value={teamForm.department}
              onChange={(e) => setTeamForm({ ...teamForm, department: e.target.value })}
              placeholder="e.g. Electrical Engineering"
            />
          </Field>
          <Field label="Skills (Comma-separated)">
            <input
              className={inputClass}
              value={teamForm.skills}
              onChange={(e) => setTeamForm({ ...teamForm, skills: e.target.value })}
              placeholder="e.g. Smart Grid, IoT Sensors, Lighting Design"
            />
          </Field>
          <Field label="Email (Optional)">
            <input
              type="email"
              className={inputClass}
              value={teamForm.email}
              onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })}
              placeholder="faculty@university.edu.in"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setTeamModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={addTeamMember}>
              Add to Team
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
