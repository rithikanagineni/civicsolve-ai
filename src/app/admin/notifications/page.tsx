"use client";

import { AppShell } from "@/components/AppShell";
import { NotificationsView } from "@/components/NotificationsView";

export default function AdminNotificationsPage() {
  return (
    <AppShell role="ADMIN">
      <NotificationsView />
    </AppShell>
  );
}
