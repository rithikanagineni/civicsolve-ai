"use client";

import { AppShell } from "@/components/AppShell";
import { KnowledgeBaseBoard } from "@/components/KnowledgeBaseBoard";
import { RoleFeatureHub } from "@/components/RoleFeatureHub";

export default function UniversityKnowledgePage() {
  return (
    <AppShell role="UNIVERSITY">
      <div className="mb-6 rounded-[28px] border border-violet-100 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 p-5 text-white shadow-[0_18px_40px_rgba(99,102,241,0.18)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-100">Knowledge exchange</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Research playbooks and case-based guidance</h1>
      </div>
      <KnowledgeBaseBoard />
      <RoleFeatureHub role="UNIVERSITY" />
    </AppShell>
  );
}
