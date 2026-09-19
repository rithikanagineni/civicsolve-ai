"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { apiError, post } from "@/lib/api";
import { Button, Card, Field, SectionTitle, inputClass } from "@/components/ui";
import { useApp } from "@/context/AppContext";

export function FeedbackForm({ challengeId, complaintCode, onDone }: { challengeId: number; complaintCode: string; onDone?: () => void }) {
  const { pushToast } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [resolved, setResolved] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await post(`/challenges/${challengeId}/feedback`, { rating, comment, suggestion, resolved });
      pushToast("Thank you — your validation closes the loop!", "success");
      onDone?.();
    } catch (err) {
      pushToast(apiError(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionTitle title="Was your problem actually solved?" subtitle={`Citizen validation for ${complaintCode}`} />
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" onClick={() => setRating(s)}>
              <Star className={`h-7 w-7 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
            </button>
          ))}
          <span className="ml-2 text-sm text-slate-600">{rating}/5</span>
        </div>
        <div className="flex gap-2">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setResolved(v)}
              className={`rounded-xl border px-4 py-2 text-sm ${resolved === v ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"}`}
            >
              Resolved: {v ? "YES" : "NO"}
            </button>
          ))}
        </div>
        <Field label="Comment"><textarea className={inputClass} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How did the solution change things?" /></Field>
        <Field label="Improvement suggestion"><textarea className={inputClass} rows={2} value={suggestion} onChange={(e) => setSuggestion(e.target.value)} /></Field>
        <Button type="submit" disabled={busy} variant="success">{busy ? "Submitting…" : "Submit feedback"}</Button>
      </form>
    </Card>
  );
}
