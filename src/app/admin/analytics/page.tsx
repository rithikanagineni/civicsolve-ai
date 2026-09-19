"use client";

import { AppShell } from "@/components/AppShell";
import { AnalyticsView } from "@/components/AnalyticsView";
import { SectionTitle } from "@/components/ui";

export default function AdminAnalyticsPage() {
  return (
    <AppShell role="ADMIN">
      <SectionTitle title="Analytics" subtitle="GET /api/analytics — aggregated directly from PostgreSQL" />
      <AnalyticsView />
    </AppShell>
  );
}
