"use client";

import { AppShell } from "@/components/AppShell";
import { NotificationsView } from "@/components/NotificationsView";

export default function CitizenNotificationsPage() {
  return (
    <AppShell role="CITIZEN">
      <NotificationsView />
    </AppShell>
  );
}
