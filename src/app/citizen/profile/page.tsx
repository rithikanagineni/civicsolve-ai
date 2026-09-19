"use client";

import { AppShell } from "@/components/AppShell";
import { ProfileView } from "@/components/ProfileView";

export default function CitizenProfilePage() {
  return (
    <AppShell role="CITIZEN">
      <ProfileView />
    </AppShell>
  );
}
