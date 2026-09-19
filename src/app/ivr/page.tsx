"use client";

import Link from "next/link";
import { useState } from "react";
import { PhoneCall, PhoneOff } from "lucide-react";
import { apiError, post, put } from "@/lib/api";
import { Badge, Button, Card, Field, inputClass } from "@/components/ui";

type Option = { key: string; value: string; label: string };
type Session = { id: number; sessionCode: string; step: string; complaintCode: string | null };
type Res = { session: Session; prompt: string; options?: Option[]; complaintCode?: string };

export default function IvrPage() {
  const [phone, setPhone] = useState("+919876543210");
  const [session, setSession] = useState<Session | null>(null);
  const [prompt, setPrompt] = useState("Dial *#437 from any phone to report a civic problem without internet.");
  const [options, setOptions] = useState<Option[]>([]);
  const [transcript, setTranscript] = useState("");
  const [location, setLocation] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addLog = (line: string) => setLog((prev) => [...prev, line]);

  async function startCall() {
    setBusy(true); setError("");
    try {
      const res = await post<Res>("/ivr/sessions", { phone });
      setSession(res.session); setPrompt(res.prompt); setOptions(res.options ?? []);
      setLog([`📞 Call connected · session ${res.session.sessionCode}`, `🔊 ${res.prompt}`]);
    } catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  }

  async function step(payload: Record<string, unknown>, pressed: string) {
    if (!session) return;
    setBusy(true); setError("");
    try {
      addLog(`☎️ Caller: ${pressed}`);
      const res = await put<Res>(`/ivr/sessions/${session.id}`, payload);
      setSession(res.session); setPrompt(res.prompt); setOptions(res.options ?? []);
      addLog(`🔊 ${res.prompt}`);
    } catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:underline">← CivicSolve AI</Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Don&apos;t have internet access?</h1>
        <Badge tone="amber">Simulated IVR prototype</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Report through IVR by dialling <span className="font-mono font-semibold">*#437</span>. This prototype simulates the
        telephony flow end to end — every session and complaint is persisted in PostgreSQL. Connect a real telephony
        provider later without changing the workflow.
      </p>

      <Card className="mt-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <Field label="Caller phone number">
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!!session} />
            </Field>
          </div>
          {!session ? (
            <Button onClick={startCall} disabled={busy}><PhoneCall className="h-4 w-4" /> Dial *#437</Button>
          ) : (
            <Button variant="outline" onClick={() => { setSession(null); setOptions([]); setLog([]); setTranscript(""); setPrompt("Call ended."); }}>
              <PhoneOff className="h-4 w-4" /> End call
            </Button>
          )}
        </div>

        <div className="mt-5 rounded-2xl bg-slate-900 p-4 font-mono text-xs text-emerald-300">
          <p className="mb-2 text-slate-400">IVR audio prompt</p>
          <p>{prompt}</p>
        </div>

        {session && options.length > 0 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {options.map((o) => (
              <Button
                key={o.key}
                variant="outline"
                disabled={busy}
                onClick={() =>
                  step(session.step === "LANGUAGE" ? { language: o.value } : { category: o.value }, `pressed ${o.key} (${o.label})`)
                }
              >
                <span className="font-mono">{o.key}</span> {o.label}
              </Button>
            ))}
          </div>
        ) : null}

        {session?.step === "DESCRIPTION" ? (
          <div className="mt-4 space-y-3">
            <Field label="Voice description (transcribed)">
              <textarea className={inputClass} rows={3} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Describe the problem…" />
            </Field>
            <Button disabled={busy} onClick={() => step({ transcript }, "recorded description")}>Press # to finish recording</Button>
          </div>
        ) : null}

        {session?.step === "CONFIRM" ? (
          <div className="mt-4 space-y-3">
            <Field label="Location (spoken)">
              <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Village / street / city" />
            </Field>
            <div className="flex gap-2">
              <Button disabled={busy} onClick={() => step({ confirm: true, location }, "pressed 1 (confirm)")}>Press 1 — Confirm</Button>
              <Button variant="outline" disabled={busy} onClick={() => step({ confirm: false }, "pressed 2 (re-record)")}>Press 2 — Re-record</Button>
            </div>
          </div>
        ) : null}

        {session?.complaintCode ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            ✅ Complaint registered with code <span className="font-mono font-semibold">{session.complaintCode}</span>. The AI
            engine has already analysed, prioritised and matched it with universities.
          </div>
        ) : null}

        {error ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      </Card>

      {log.length ? (
        <Card className="mt-4">
          <h3 className="text-sm font-semibold text-slate-800">Call transcript</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {log.map((l, i) => (<li key={i}>{l}</li>))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
