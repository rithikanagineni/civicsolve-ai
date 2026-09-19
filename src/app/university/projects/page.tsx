"use client";

import { AppShell } from "@/components/AppShell";
import { ProjectsList } from "@/components/ProjectsList";
import { SectionTitle } from "@/components/ui";

export default function UniversityProjectsPage() {
  return (
    <AppShell role="UNIVERSITY">
      <SectionTitle title="Projects" subtitle="Open a workspace to manage milestones, progress updates, industry support and messaging" />
      <ProjectsList />
    </AppShell>
  );
}
