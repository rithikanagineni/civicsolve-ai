"use client";

import { AppShell } from "@/components/AppShell";
import { RecommendedChallenges } from "@/components/RecommendedChallenges";
import { SectionTitle } from "@/components/ui";

export default function UniversityAcceptedPage() {
  return (
    <AppShell role="UNIVERSITY">
      <SectionTitle title="Accepted challenges" subtitle="Persisted in challenge_matches with status ACCEPTED and accepted_at timestamp" />
      <RecommendedChallenges status="ACCEPTED" />
    </AppShell>
  );
}
