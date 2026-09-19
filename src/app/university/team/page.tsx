"use client";

import { AppShell } from "@/components/AppShell";
import { ProfileView } from "@/components/ProfileView";

export default function UniversityTeamPage() {
  return (
    <AppShell role="UNIVERSITY">
      <ProfileView />
      <p className="mt-4 text-xs text-slate-500">
        Departments, research areas, faculty expertise and student teams directly drive the AI university-matching score.
      </p>
    </AppShell>
  );
}
