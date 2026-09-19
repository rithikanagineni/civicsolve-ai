"use client";

import { AppShell } from "@/components/AppShell";
import { EventRegistrationBoard } from "@/components/EventRegistrationBoard";
import { RoleFeatureHub } from "@/components/RoleFeatureHub";

export default function UniversityEventsPage() {
  return (
    <AppShell role="UNIVERSITY">
      <div className="mb-6 rounded-[28px] border border-violet-100 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 p-5 text-white shadow-[0_18px_40px_rgba(99,102,241,0.18)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-100">Events</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Innovation clinics, workshops and collaboration meets</h1>
      </div>
      <EventRegistrationBoard />
      <RoleFeatureHub role="UNIVERSITY" />
    </AppShell>
  );
}
