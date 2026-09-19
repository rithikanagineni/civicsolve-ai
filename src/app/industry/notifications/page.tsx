"use client";

import { AppShell } from "@/components/AppShell";
import { NotificationsView } from "@/components/NotificationsView";

export default function IndustryNotificationsPage() {
  return (
    <AppShell role="INDUSTRY">
      <NotificationsView />
    </AppShell>
  );
}
