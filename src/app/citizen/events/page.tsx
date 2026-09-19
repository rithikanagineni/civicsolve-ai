"use client";

import { AppShell } from "@/components/AppShell";
import { EventRegistrationBoard } from "@/components/EventRegistrationBoard";
import { RoleFeatureHub } from "@/components/RoleFeatureHub";

export default function CitizenEventsPage() {
  return (
    <AppShell role="CITIZEN">
      <div className="mb-6 rounded-[28px] border border-sky-100 bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 p-5 text-white shadow-[0_18px_40px_rgba(14,165,233,0.18)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">Events</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Community revamps, repair drives and collaborative action</h1>
      </div>
      <EventRegistrationBoard />
      <RoleFeatureHub role="CITIZEN" />
    </AppShell>
  );
}
