"use client";

import { AppShell } from "@/components/AppShell";
import { RecommendedChallenges } from "@/components/RecommendedChallenges";
import { SectionTitle } from "@/components/ui";

export default function UniversityChallengesPage() {
  return (
    <AppShell role="UNIVERSITY">
      <SectionTitle title="Recommended challenges" subtitle="GET /api/universities/recommended — matched by departments, research areas, faculty expertise and student teams" />
      <RecommendedChallenges />
    </AppShell>
  );
}
