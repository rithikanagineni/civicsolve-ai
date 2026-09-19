"use client";

import { AppShell } from "@/components/AppShell";
import { IndustryRecommended } from "@/components/IndustryRecommended";
import { SectionTitle } from "@/components/ui";

export default function IndustryProjectsPage() {
  return (
    <AppShell role="INDUSTRY">
      <SectionTitle title="Recommended projects" subtitle="GET /api/industry/recommended — explainable industry matching" />
      <IndustryRecommended />
    </AppShell>
  );
}
