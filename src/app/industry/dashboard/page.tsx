"use client";

import Link from "next/link";
import { useState } from "react";
import { FolderKanban, Handshake, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EventRegistrationBoard } from "@/components/EventRegistrationBoard";
import { IndustryRecommended, type IndustryMatch } from "@/components/IndustryRecommended";
import { KnowledgeBaseBoard } from "@/components/KnowledgeBaseBoard";
import { TaskWorkflowBoard } from "@/components/TaskWorkflowBoard";
import { SectionTitle, StatCard } from "@/components/ui";
import { useApp } from "@/context/AppContext";

export default function IndustryDashboard() {
  const { user } = useApp();
  const [items, setItems] = useState<IndustryMatch[]>([]);

  const supported = items.filter((p) => p.mySupportStatus === "ACTIVE").length;
  const requests = items.filter((p) => p.mySupportStatus === "REQUESTED").length;

  return (
    <AppShell role="INDUSTRY">
      <div className="mb-6 rounded-[28px] border border-amber-100 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 text-white shadow-[0_18px_40px_rgba(249,115,22,0.18)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">Industry workspace</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{user?.organizationName ?? user?.fullName}</h1>
        <p className="mt-2 text-sm text-amber-100">University projects matched to your technology, domain and deployment capability.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Recommended projects" value={items.length} icon={<Sparkles className="h-5 w-5 text-indigo-600" />} />
        <StatCard label="Supported projects" value={supported} tone="emerald" icon={<Handshake className="h-5 w-5 text-emerald-600" />} />
        <StatCard label="Support requests" value={requests} tone="amber" icon={<FolderKanban className="h-5 w-5 text-amber-600" />} />
        <StatCard label="Mentorship slots" value={supported * 2} tone="sky" icon={<Users className="h-5 w-5 text-sky-600" />} />
      </div>

      <div className="mt-8">
        <SectionTitle
          title="Recommended projects"
          subtitle="Ranked by technology, domain and support-capability fit"
          action={<Link href="/industry/projects" className="text-sm font-medium text-indigo-700 hover:underline">View all →</Link>}
        />
        <IndustryRecommended limit={4} onLoaded={setItems} />
      </div>

      <TaskWorkflowBoard />
      <KnowledgeBaseBoard />
      <EventRegistrationBoard />
    </AppShell>
  );
}
