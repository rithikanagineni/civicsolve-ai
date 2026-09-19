"use client";

import { AppShell } from "@/components/AppShell";
import { KnowledgeBaseBoard } from "@/components/KnowledgeBaseBoard";
import { RoleFeatureHub } from "@/components/RoleFeatureHub";

export default function CitizenKnowledgePage() {
  return (
    <AppShell role="CITIZEN">
      <div className="mb-6 rounded-[28px] border border-indigo-100 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 p-5 text-white shadow-[0_18px_40px_rgba(79,70,229,0.2)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100">Knowledge base</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">AI-powered civic learning and guidance</h1>
        <p className="mt-2 text-sm text-indigo-100">Search similar issues, playbooks and resolved cases to understand what good resolution looks like.</p>
      </div>
      <KnowledgeBaseBoard />
      <RoleFeatureHub role="CITIZEN" />
    </AppShell>
  );
}
