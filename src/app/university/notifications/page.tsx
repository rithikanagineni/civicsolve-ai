"use client";

import { AppShell } from "@/components/AppShell";
import { NotificationsView } from "@/components/NotificationsView";

export default function UniversityNotificationsPage() {
  return (
    <AppShell role="UNIVERSITY">
      <NotificationsView />
    </AppShell>
  );
}
