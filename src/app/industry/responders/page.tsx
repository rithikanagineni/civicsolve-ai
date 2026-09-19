"use client";

import { LocateFixed, MapPin, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RoleFeatureHub } from "@/components/RoleFeatureHub";
import { Card, SectionTitle } from "@/components/ui";
import { apiError, get } from "@/lib/api";
import { useApp } from "@/context/AppContext";

type Responder = {
  id: number;
  name: string;
  distanceKm: number;
  skill: string;
  reputation: number;
  status: string;
};

export default function IndustryRespondersPage() {
  const { pushToast } = useApp();
  const [responders, setResponders] = useState<Responder[]>([]);

  useEffect(() => {
    get<{ items: Responder[] }>("/responders")
      .then((d) => setResponders(d.items))
      .catch((e) => pushToast(apiError(e), "error"));
  }, [pushToast]);

  return (
    <AppShell role="INDUSTRY">
      <div className="mb-6 rounded-[28px] border border-amber-100 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 text-white shadow-[0_18px_40px_rgba(249,115,22,0.18)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">Responder matching</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Find the right people and tasks for each civic problem</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionTitle title="Nearby responder matches" subtitle="Sorted by proximity, skill relevance and reputation" />
          <div className="space-y-3">
            {responders.map((person) => (
              <div key={person.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <p className="font-medium text-slate-800">{person.name}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{person.status}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {person.distanceKm.toFixed(1)} km</span>
                  <span className="inline-flex items-center gap-1"><LocateFixed className="h-3 w-3" /> {person.skill}</span>
                  <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {person.reputation.toFixed(1)}/5</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="bg-amber-50/60">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 p-2 text-amber-700"><LocateFixed className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase tracking-wide text-amber-700">Dispatch radius</p>
                <p className="text-lg font-semibold text-slate-900">15 km</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Task verification</p>
                <p className="text-lg font-semibold text-slate-900">3 tasks pending review</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <RoleFeatureHub role="INDUSTRY" />
    </AppShell>
  );
}
