"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VoiceInput } from "@/components/VoiceInput";
import { Badge, Button, Card, Field, PriorityBadge, SectionTitle, inputClass } from "@/components/ui";
import { apiError, post } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import type { Analysis, ChallengeSummary } from "@/types";

const CATEGORIES = ["Water", "Roads", "Waste Management", "Sanitation", "Electricity", "Transportation", "Education", "Agriculture", "Environment", "Public Safety", "Infrastructure", "Digital Services", "Healthcare", "Other"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

type CreateResult = {
  challenge: ChallengeSummary;
  analysis: Analysis & { factors: { label: string; score: number; max: number }[] };
  duplicates: { relatedChallengeId: number; similarity: number; complaintCode: string; title: string }[];
  matches: { universityId: number; name: string; score: number; reasons: string[] }[];
};

export default function ReportProblemPage() {
  const { language, t, pushToast } = useApp();
  const [inputMethod, setInputMethod] = useState<"TEXT" | "VOICE">("TEXT");
  const [form, setForm] = useState({
    title: "", description: "", category: "Infrastructure", subcategory: "", location: "", landmark: "",
    severity: "HIGH", durationDays: 30, peopleAffected: 500, imageUrl: "",
  });
  const [photoName, setPhotoName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreateResult | null>(null);

  const set = (k: string, v: string | number) => setForm((prev) => ({ ...prev, [k]: v }));

  const handlePhotoUpload = (file: File | null) => {
    if (!file) {
      set("imageUrl", "");
      setPhotoName("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      set("imageUrl", value);
      setPhotoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(""); setResult(null);
    try {
      const data = await post<CreateResult>("/challenges", {
        ...form,
        language,
        originalLanguage: language,
        originalText: form.description,
        inputMethod,
      });
      setResult(data);
      pushToast(`Problem registered as ${data.challenge.complaintCode}`, "success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell role="CITIZEN">
      <SectionTitle title={t("reportProblem")} subtitle="Type it or speak it — AI analyses your problem the moment it is submitted." />

      {result ? (
        <Card className="mb-6 border-emerald-200 bg-emerald-50/40">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-semibold">AI analysis completed for {result.challenge.complaintCode}</h3>
            <Badge tone="slate">{result.analysis.engine}</Badge>
          </div>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Category:</span> <b>{result.analysis.category}</b></p>
              <p><span className="text-slate-500">Subcategory:</span> <b>{result.analysis.subcategory}</b></p>
              <p><span className="text-slate-500">Summary:</span> {result.analysis.summary}</p>
              <p className="flex items-center gap-2"><span className="text-slate-500">AI-assisted priority recommendation:</span> <PriorityBadge level={result.analysis.priorityLevel} score={result.analysis.priorityScore} /></p>
              <p><span className="text-slate-500">Confidence:</span> {(result.analysis.confidence * 100).toFixed(0)}%</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {result.analysis.requiredExpertise.map((x) => (<Badge key={x} tone="indigo">{x}</Badge>))}
              </div>
            </div>
            <div className="space-y-2">
              {result.analysis.factors?.map((f) => (
                <div key={f.label}>
                  <div className="flex justify-between text-xs text-slate-600"><span>{f.label}</span><span>{f.score}/{f.max}</span></div>
                  <div className="h-1.5 rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${(f.score / f.max) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          {result.duplicates.length ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Possible duplicate detected</p>
              {result.duplicates.slice(0, 3).map((d) => (
                <p key={d.relatedChallengeId} className="text-xs">
                  Similarity {d.similarity}% · Related complaint <span className="font-mono">{d.complaintCode}</span> — {d.title}
                </p>
              ))}
              <p className="mt-1 text-[11px]">Duplicates are flagged for review, never deleted automatically.</p>
            </div>
          ) : null}

          <div className="mt-4">
            <p className="text-sm font-semibold">Matched universities</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {result.matches.map((m) => (
                <div key={m.universityId} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-medium">{m.name} <span className="text-indigo-700">{m.score}% match</span></p>
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                    {m.reasons.slice(0, 3).map((r, index) => (<li key={`${m.universityId}-${index}-${r}`}>✓ {r}</li>))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <Link href={`/citizen/problems/${result.challenge.id}`} className="mt-4 inline-block text-sm font-medium text-indigo-700 hover:underline">
            Track this problem →
          </Link>
        </Card>
      ) : null}

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <VoiceInput
            language={language}
            label={t("voiceReport")}
            onTranscript={(text) => {
              setInputMethod("VOICE");
              setForm((prev) => ({ ...prev, description: text, title: prev.title || text.slice(0, 80) }));
            }}
          />
          <Badge tone={inputMethod === "VOICE" ? "violet" : "slate"}>input_method = {inputMethod}</Badge>
          <Badge tone="slate">original_language = {language}</Badge>
        </div>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Title"><input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} required minLength={5} placeholder="Large potholes near our college" /></Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" hint="You can edit the voice transcription before submitting">
              <textarea className={inputClass} rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} required minLength={15}
                placeholder="There are large potholes near our college and students are facing accidents." />
            </Field>
          </div>
          <Field label={t("category")}>
            <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
            </select>
          </Field>
          <Field label="Subcategory (optional)"><input className={inputClass} value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)} placeholder="Road Safety" /></Field>
          <Field label="Location"><input className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} required placeholder="Kukatpally, Hyderabad" /></Field>
          <Field label="Landmark"><input className={inputClass} value={form.landmark} onChange={(e) => set("landmark", e.target.value)} placeholder="Near JNTU main gate" /></Field>
          <Field label="Severity">
            <select className={inputClass} value={form.severity} onChange={(e) => set("severity", e.target.value)}>
              {SEVERITIES.map((s) => (<option key={s}>{s}</option>))}
            </select>
          </Field>
          <Field label="Duration (days the problem exists)"><input className={inputClass} type="number" min={0} value={form.durationDays} onChange={(e) => set("durationDays", Number(e.target.value))} /></Field>
          <Field label="People affected"><input className={inputClass} type="number" min={1} value={form.peopleAffected} onChange={(e) => set("peopleAffected", Number(e.target.value))} /></Field>
          <div className="sm:col-span-2">
            <Field label="Upload photo (optional)" hint="Add a supporting image for the issue.">
              <input
                type="file"
                accept="image/*,.png,.jpg,.jpeg"
                className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800`}
                onChange={(e) => handlePhotoUpload(e.target.files?.[0] ?? null)}
              />
              {photoName ? <p className="mt-2 text-xs text-slate-500">Selected photo: {photoName}</p> : null}
            </Field>
          </div>

          <div className="sm:col-span-2">
            {error ? <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <Button type="submit" disabled={busy}>{busy ? "Submitting & analysing…" : `${t("submit")} & run AI analysis`}</Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
