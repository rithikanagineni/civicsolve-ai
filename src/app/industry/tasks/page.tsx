"use client";

import { AppShell } from "@/components/AppShell";
import { RoleFeatureHub } from "@/components/RoleFeatureHub";
import { TaskWorkflowBoard } from "@/components/TaskWorkflowBoard";

export default function IndustryTasksPage() {
  return (
    <AppShell role="INDUSTRY">
      <div className="mb-6 rounded-[28px] border border-amber-100 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 text-white shadow-[0_18px_40px_rgba(249,115,22,0.18)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">Task workflow</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Operational tasks and evidence-based service delivery</h1>
      </div>
      <TaskWorkflowBoard />
      <RoleFeatureHub role="INDUSTRY" />
    </AppShell>
  );
}
