"use client";

import { useMemo, useState } from "react";
import { Bot, Sparkles, X } from "lucide-react";
import type { Role } from "@/context/AppContext";

const rolePrompts: Record<Role, string[]> = {
  CITIZEN: [
    "How do I report a civic problem?",
    "What does the AI analysis mean?",
    "How do I track my problem status?",
    "What happens after university acceptance?",
  ],
  UNIVERSITY: [
    "How do I review recommended challenges?",
    "What should I do after accepting a challenge?",
    "How do project milestones work?",
    "How do I collaborate with industry?",
  ],
  INDUSTRY: [
    "How do I find recommended projects?",
    "What support can I offer?",
    "What is industry collaboration workflow?",
    "How do I review support requests?",
  ],
  FIELD_PERSON: [
    "How do I start my assigned visit?",
    "What must a field report include?",
    "When should I escalate to the university?",
  ],
  ADMIN: [
    "What metrics are available in analytics?",
    "How do I monitor platform health?",
    "What should I review as an admin?",
    "How do I see total users and projects?",
  ],
};

function buildAssistantReply(role: Role, question: string): string {
  const normalized = question.toLowerCase();

  if (role === "CITIZEN") {
    if (normalized.includes("report") || normalized.includes("problem")) {
      return "Use the Report a Problem page, add title and description, and choose your language or voice input. CivicSolve will run AI classification, duplicate checks, and university matching right after you submit.";
    }
    if (normalized.includes("ai") || normalized.includes("analysis") || normalized.includes("priority")) {
      return "The AI analysis explains the category, subcategory, urgency, severity, confidence, duplicate risk, and required expertise. It also shows an explainable priority score so you can understand why it was marked HIGH or CRITICAL.";
    }
    if (normalized.includes("status") || normalized.includes("track") || normalized.includes("progress")) {
      return "Open My Problems to see each complaint card. You can track complaint code, status, university acceptance, project progress, and final citizen validation from the same challenge detail page.";
    }
    if (normalized.includes("accept") || normalized.includes("university")) {
      return "Once a university accepts your problem, a project is created and linked to your challenge. You will then see the accepted university, project title, milestone progress, and the collaboration updates in your dashboard.";
    }
    return "As a citizen, you can report issues, review AI analysis, monitor project progress, receive notifications, and submit feedback after completion. The system keeps each citizen's challenges isolated to their own account.";
  }

  if (role === "UNIVERSITY") {
    if (normalized.includes("challenge") || normalized.includes("recommend")) {
      return "Go to Recommended Challenges, review the AI match score and reasons, and then accept a challenge that fits your expertise. Acceptance is stored in the system and creates the project workspace automatically.";
    }
    if (normalized.includes("project") || normalized.includes("milestone")) {
      return "Projects include milestones such as requirement analysis, solution design, prototype development, testing, field implementation, and final validation. Progress updates are visible to citizens and stakeholders.";
    }
    if (normalized.includes("industry") || normalized.includes("support")) {
      return "You can request technology, mentorship, hardware, software, funding, or deployment support from relevant industry partners. These support records are stored against the project.";
    }
    return "Your university dashboard helps you review recommended challenges, accept relevant civic issues, create or manage projects, and connect with industry for implementation support.";
  }

  if (role === "INDUSTRY") {
    if (normalized.includes("project") || normalized.includes("recommend")) {
      return "Review recommended projects in your dashboard, inspect the university and requirement fit, and decide which projects match your technology or deployment capability.";
    }
    if (normalized.includes("support") || normalized.includes("offer")) {
      return "You can offer technology, mentorship, hardware, software, funding, or infrastructure support. Accepted support requests become active project collaboration records.";
    }
    if (normalized.includes("match") || normalized.includes("score")) {
      return "The platform calculates a project match score based on technology, domain expertise, deployment capability, and support type, then shows the reasons behind the recommendation.";
    }
    return "The industry portal helps you discover impactful civic projects, support them with the resources you offer, and monitor the collaborative work with the university.";
  }

  if (role === "FIELD_PERSON") {
    if (normalized.includes("start") || normalized.includes("visit")) return "Open My field visits and select Start visit when you begin the physical verification. GPS is optional; do not claim a live location without it.";
    if (normalized.includes("report") || normalized.includes("evidence")) return "Submit whether the problem is verified, detailed observations, severity, recommended solution and any evidence links. Explain whether you resolved it directly or need university intervention.";
    return "Your portal shows only field visits assigned to your account. Verify safely, document the situation accurately, and escalate work that needs university resources.";
  }

  if (role === "ADMIN") {
    if (normalized.includes("analytics") || normalized.includes("metric") || normalized.includes("chart")) {
      return "Use the analytics dashboard to review problems by category, priority, resolution status, university participation, industry engagement, satisfaction, and community voting patterns.";
    }
    if (normalized.includes("user") || normalized.includes("monitor") || normalized.includes("health")) {
      return "The admin workspace shows total users, citizen/university/industry counts, active projects, completed projects, and platform-wide health signals for governance and oversight.";
    }
    return "As an administrator, you can oversee user activity, challenge flow, project status, analytics, impact reports, and overall platform governance across all roles.";
  }

  return "This assistant is available to guide you through the CivicSolve workflow for your role. Ask about reporting, matching, project lifecycle, support, analytics, or validation.";
}

export function PortalAssistant({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("Ask me anything about your portal and I will guide you through the workflow.");

  const prompts = useMemo(() => rolePrompts[role], [role]);

  const handleAsk = (text: string) => {
    const value = text.trim();
    if (!value) return;
    setAnswer(buildAssistantReply(role, value));
    setQuestion("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-semibold">{role.toLowerCase()} AI assistant</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleAsk(prompt)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-slate-700">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" /> Assistant reply
              </div>
              <p>{answer}</p>
            </div>

            <div className="space-y-2">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask your portal assistant..."
                className="min-h-[90px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => handleAsk(question)}
                className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Ask assistant
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-slate-800"
      >
        <Bot className="h-4 w-4" />
        AI assistant
      </button>
    </div>
  );
}
