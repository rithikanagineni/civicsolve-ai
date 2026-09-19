"use client";

import { AppShell } from "@/components/AppShell";
import { EventRegistrationBoard } from "@/components/EventRegistrationBoard";
import { RoleFeatureHub } from "@/components/RoleFeatureHub";

export default function IndustryEventsPage() {
  return (
    <AppShell role="INDUSTRY">
      <div className="mb-6 rounded-[28px] border border-amber-100 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 text-white shadow-[0_18px_40px_rgba(249,115,22,0.18)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">Events</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Partnership events, innovation clinics and deal-flow programs</h1>
      </div>
      <EventRegistrationBoard />
      <RoleFeatureHub role="INDUSTRY" />
    </AppShell>
  );
}
