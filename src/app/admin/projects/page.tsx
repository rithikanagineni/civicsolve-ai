"use client";

import { AppShell } from "@/components/AppShell";
import { ProjectsList } from "@/components/ProjectsList";
import { SectionTitle } from "@/components/ui";

export default function AdminProjectsPage() {
  return (
    <AppShell role="ADMIN">
      <SectionTitle title="All projects" subtitle="University-led projects with industry collaboration" />
      <ProjectsList />
    </AppShell>
  );
}
