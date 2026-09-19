import { handleError, ok } from "@/server/exception/http";
import { requireAuth, type Role } from "@/server/security/auth";

type KnowledgeItem = {
  id: number;
  title: string;
  category: string;
  summary: string;
  tags: string[];
};

const knowledgeByRole: Record<Role, KnowledgeItem[]> = {
  CITIZEN: [
    {
      id: 1,
      title: "Water leakage response playbook",
      category: "Water Supply",
      summary: "Step-by-step inspection, temporary repair, notification and validation workflow for communities facing leakage or contamination.",
      tags: ["water", "safety", "repair"],
    },
    {
      id: 2,
      title: "Road safety mitigation checklist",
      category: "Infrastructure",
      summary: "Risk assessment for potholes, dangerous barriers and drainage problems with evidence collection guidance.",
      tags: ["road", "safety", "civil"],
    },
    {
      id: 3,
      title: "Waste collection escalation notes",
      category: "Sanitation",
      summary: "Coordination flow between local workers, resident reports and final verification of service restoration.",
      tags: ["waste", "sanitation", "service"],
    },
  ],
  UNIVERSITY: [
    {
      id: 11,
      title: "Research-to-solution handoff model",
      category: "Academic Collaboration",
      summary: "How faculty and student teams translate civic pain points into structured research questions, prototypes and validation loops.",
      tags: ["research", "student", "prototype"],
    },
    {
      id: 12,
      title: "Problem framing template",
      category: "Problem Definition",
      summary: "A structured checklist for defining the issue, stakeholders, impact and measurable success criteria before prototype work begins.",
      tags: ["framing", "metrics", "scope"],
    },
    {
      id: 13,
      title: "Community validation checklist",
      category: "Impact",
      summary: "Validate whether the delivered fix improves quality of life and whether citizen feedback matches intended impact goals.",
      tags: ["validation", "citizen", "impact"],
    },
  ],
  INDUSTRY: [
    {
      id: 21,
      title: "Support package design",
      category: "Industry Collaboration",
      summary: "A reusable model for deciding when to offer mentorship, hardware, software integration, or funding support for a civic project.",
      tags: ["support", "mentorship", "funding"],
    },
    {
      id: 22,
      title: "Field verification workflow",
      category: "Operations",
      summary: "Capture evidence, validate task completion, and verify outcome quality before marking a job as resolved.",
      tags: ["verification", "evidence", "operations"],
    },
    {
      id: 23,
      title: "Deployment readiness checklist",
      category: "Implementation",
      summary: "Ensure the solution is not just technically sound but also maintainable, scalable and ready for local deployment.",
      tags: ["deployment", "scaling", "maintenance"],
    },
  ],
  FIELD_PERSON: [
    { id: 41, title: "Field verification checklist", category: "Operations", summary: "Verify the location, document observations and submit evidence using the assigned visit workflow.", tags: ["field", "verification", "evidence"] },
    { id: 42, title: "Safety-first site visit guide", category: "Safety", summary: "Assess hazards, avoid unsafe interventions and escalate work that requires university support.", tags: ["safety", "escalation"] },
  ],
  ADMIN: [
    {
      id: 31,
      title: "Governance and moderation model",
      category: "Platform Policy",
      summary: "How to keep AI classification, citizen validation and role-based handoff consistent while protecting trust and accountability.",
      tags: ["governance", "moderation", "policy"],
    },
    {
      id: 32,
      title: "Impact analytics summary",
      category: "Analytics",
      summary: "Monitor volumes, priority shifts and solved outcomes across citizens, universities and industries to identify emerging patterns.",
      tags: ["analytics", "impact", "metrics"],
    },
  ],
};

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    const url = new URL(req.url);
    const role = (url.searchParams.get("role") as Role | null) ?? auth.role;
    return ok({ items: knowledgeByRole[role] ?? knowledgeByRole[auth.role] });
  } catch (error) {
    return handleError(error);
  }
}
