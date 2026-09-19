"use client";

import { AppShell } from "@/components/AppShell";
import { ProjectsList } from "@/components/ProjectsList";
import { SectionTitle } from "@/components/ui";

export default function IndustrySupportPage() {
  return (
    <AppShell role="INDUSTRY">
      <SectionTitle title="My supported projects" subtitle="Persisted in industry_support — accept requests inside the project workspace" />
      <ProjectsList scope="mine" />
    </AppShell>
  );
}
