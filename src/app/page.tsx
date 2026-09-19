"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, Building2, CheckCircle2, GraduationCap, Languages, Mic, PhoneCall, Radar, Repeat2, Sparkles, Users } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Badge, Card } from "@/components/ui";

const WORKFLOW = ["REPORT", "AI UNDERSTANDS", "PRIORITIZE", "MATCH", "COLLABORATE", "SOLVE", "VALIDATE"];

const FEATURES = [
  { icon: Languages, title: "Regional Languages + Voice + IVR", text: "8 Indian languages, browser speech-to-text and a *#437 IVR flow for citizens without internet or typing skills.", tone: "from-cyan-500 to-blue-500" },
  { icon: BrainCircuit, title: "AI Problem Intelligence", text: "Every report is classified, summarised, scored and enriched with the exact expertise needed to solve it.", tone: "from-violet-500 to-indigo-500" },
  { icon: Radar, title: "Semantic Duplicate Detection", text: "Finds problems that mean the same thing even when the wording is completely different — flagged, never deleted.", tone: "from-fuchsia-500 to-pink-500" },
  { icon: GraduationCap, title: "AI University Matching", text: "Departments, research areas, faculty expertise and student teams ranked with an explainable match score.", tone: "from-emerald-500 to-teal-500" },
  { icon: Building2, title: "University–Industry Collaboration", text: "Technology, mentorship, hardware, funding and deployment support wired into every project.", tone: "from-amber-500 to-orange-500" },
  { icon: Repeat2, title: "Closed-Loop Civic Innovation", text: "Report → Understand → Match → Collaborate → Solve → Validate → Improve, tracked on one challenge ID.", tone: "from-slate-700 to-slate-900" },
];

const IMPACT_STATS = [
  { label: "Issue categories covered", value: "12+" },
  { label: "Language support", value: "8" },
  { label: "Stakeholder roles", value: "3" },
  { label: "Citizen-to-solution loop", value: "1" },
];

const STORY_IMAGES = [
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
];

export default function LandingPage() {
  const { t } = useApp();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eef2ff_0%,#f8fafc_30%,#f8fafc_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-500 to-cyan-500 text-sm font-black text-white shadow-lg shadow-indigo-200">
              CS
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-slate-900">CivicSolve AI</p>
              <p className="text-[11px] text-slate-500">Smart civic futures</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/ivr" className="hidden rounded-xl px-3 py-2 text-slate-600 transition hover:bg-slate-100 sm:block">IVR Demo</Link>
            <Link href="/language-selection" className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-slate-100">{t("chooseLanguage")}</Link>
            <Link href="/login" className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-slate-100">{t("login")}</Link>
            <Link href="/register" className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800">{t("register")}</Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(34,197,94,0.12),transparent_22%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.1),transparent_32%)]" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge tone="indigo">AI-powered civic innovation platform</Badge>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Civic issues <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">solved together.</span>
              </h1>
              <p className="mt-4 text-xl font-medium text-indigo-700">“{t("tagline")}”</p>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                A modern civic-tech platform that brings citizens, universities, and industry together to turn local challenges into measurable public impact.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-200 transition hover:translate-y-[-1px]">
                  Report a problem <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white">
                  <Users className="h-4 w-4" /> Sign in
                </Link>
                <Link href="/ivr" className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100">
                  <PhoneCall className="h-4 w-4" /> IVR access
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-3 text-sm text-slate-600">
                {[
                  "Voice-enabled reporting",
                  "AI classification",
                  "University + industry matching",
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-12 h-32 w-32 rounded-full bg-violet-300/30 blur-3xl" />
              <div className="absolute -right-4 bottom-10 h-28 w-28 rounded-full bg-cyan-300/30 blur-3xl" />

              <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Civic pipeline</p>
                      <p className="mt-2 text-2xl font-bold">Live impact dashboard</p>
                    </div>
                    <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-300">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {[
                      { title: "Water crisis reported", time: "2 min ago", tone: "from-cyan-500 to-blue-500" },
                      { title: "University match confirmed", time: "18 min ago", tone: "from-violet-500 to-indigo-500" },
                      { title: "Industry support requested", time: "42 min ago", tone: "from-emerald-500 to-teal-500" },
                    ].map((item) => (
                      <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${item.tone}`} />
                          <span className="text-[11px] uppercase tracking-wide text-slate-300">{item.time}</span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-100">{item.title}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {[
                    { value: "12+", label: "Categories" },
                    { value: "8", label: "Languages" },
                    { value: "93%", label: "Match score" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-slate-50 px-3 py-4">
                      <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                      <div className="mt-1 text-[11px] text-slate-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 overflow-x-auto">
            <div className="flex min-w-max items-center justify-center gap-2">
              {WORKFLOW.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-[11px] font-bold tracking-[0.18em] text-slate-700 shadow-sm">
                    {step}
                  </div>
                  {i < WORKFLOW.length - 1 ? <ArrowRight className="h-4 w-4 text-slate-400" /> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-8 text-center">
          <Badge tone="violet">Why it stands out</Badge>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Built for civic trust, AI clarity, and rapid collaboration.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="group overflow-hidden border-slate-200 bg-white/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(79,70,229,0.12)]">
              <div className={`mb-5 inline-flex rounded-2xl bg-gradient-to-br ${f.tone} p-3 text-white shadow-lg`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/80 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Badge tone="emerald">About CivicSolve AI</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              A digital civic infrastructure that turns public problems into measurable public impact.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              CivicSolve AI connects citizens, universities, and industries in one transparent workflow: report a problem,
              let AI understand urgency and context, match the right academic or technical partners, and track every milestone
              until the solution is validated by the people affected.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {IMPACT_STATS.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50 p-4 shadow-sm">
                  <div className="text-3xl font-black text-slate-900">{item.value}</div>
                  <div className="mt-1 text-sm text-slate-600">{item.label}</div>
                </div>
              ))}
            </div>
            <ul className="mt-6 space-y-2 text-sm text-slate-700">
              {[
                "Explainable AI priority scoring (0–100)",
                "One challenge ID connects analysis, matches, project, milestones and feedback",
                "Voice + IVR + 8 regional languages",
                "Citizen feedback is the final validation layer",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> {x}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4">
            {STORY_IMAGES.map((image, index) => (
              <div key={image} className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] ${index === 1 ? "lg:translate-x-6" : ""}`}>
                <img src={image} alt="CivicSolve AI community and civic impact" className="h-52 w-full object-cover sm:h-60" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <Badge tone="indigo">How the platform works</Badge>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">From local problem to measurable civic transformation.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Mic, title: "Voice reporting", text: "Speak your problem in your language — the browser converts it to text before submission.", tone: "from-cyan-500 to-sky-500" },
            { icon: PhoneCall, title: "IVR prototype", text: "Simulated *#437 call flow: language → category → description → confirmation → complaint code.", tone: "from-violet-500 to-indigo-500" },
            { icon: BrainCircuit, title: "AI-powered matching", text: "The system grades urgency, recommends the right university, and connects the right industry support.", tone: "from-emerald-500 to-teal-500" },
          ].map((f) => (
            <Card key={f.title} className="bg-gradient-to-br from-white to-slate-50">
              <div className={`mb-5 inline-flex rounded-2xl bg-gradient-to-br ${f.tone} p-3 text-white shadow-lg`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-[32px] border border-indigo-100 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 p-[1px] shadow-[0_30px_80px_rgba(79,70,229,0.28)]">
          <div className="rounded-[31px] bg-slate-950 px-6 py-8 text-center text-white sm:px-10">
            <Badge tone="indigo">Ready to act</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">Turn public challenges into visible solutions.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-300">
              Join CivicSolve AI to report issues, collaborate with institutions, and deliver real-world improvements to communities.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">Create account</Link>
              <Link href="/login" className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Login</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/80 py-8 text-center text-xs text-slate-500 backdrop-blur-xl">
        CivicSolve AI · SIH26043 — Digital Platform to Crowdsource Societal Problems and Connect Them With Universities & Industry
      </footer>
    </div>
  );
}
