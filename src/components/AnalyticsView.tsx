"use client";

import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { apiError, get } from "@/lib/api";
import { Card, Loading, SectionTitle, StatCard } from "@/components/ui";
import { useApp } from "@/context/AppContext";

type Analytics = {
  totals: {
    challenges: number; projects: number; solved: number; inProgress: number; universities: number; industries: number;
    citizens: number; votes: number; peopleBenefited: number; avgResolutionDays: number; avgSatisfaction: number; avgPriority: number;
  };
  byCategory: { name: string; value: number }[];
  byPriority: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  universityParticipation: { name: string; projects: number }[];
  industryParticipation: { name: string; supports: number }[];
  satisfactionDistribution: { name: string; value: number }[];
  monthly: { name: string; reported: number; solved: number }[];
  topVoted: { name: string; votes: number; title: string }[];
};

const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#14b8a6", "#eab308"];

export function AnalyticsView() {
  const { pushToast } = useApp();
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    get<Analytics>("/analytics").then(setData).catch((e) => pushToast(apiError(e), "error"));
  }, [pushToast]);

  if (!data) return <Loading label="Crunching analytics…" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Problems reported" value={data.totals.challenges} hint={`${data.totals.votes} community votes`} />
        <StatCard label="Problems solved" value={data.totals.solved} tone="emerald" hint={`${data.totals.inProgress} in progress`} />
        <StatCard label="Avg resolution" value={`${data.totals.avgResolutionDays}d`} tone="amber" hint={`Avg priority ${data.totals.avgPriority}/100`} />
        <StatCard label="Citizen satisfaction" value={`${data.totals.avgSatisfaction}/5`} tone="sky" hint={`${data.totals.peopleBenefited.toLocaleString("en-IN")} people benefited`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Problems by category" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Problems by priority" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byPriority} dataKey="value" nameKey="name" outerRadius={95} label>
                  {data.byPriority.map((entry, i) => (<Cell key={entry.name} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Reported vs solved" subtitle="Monthly trend" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reported" stroke="#4f46e5" strokeWidth={2} />
                <Line type="monotone" dataKey="solved" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Lifecycle status distribution" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle title="University participation" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.universityParticipation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="projects" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Industry participation" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.industryParticipation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="supports" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Citizen satisfaction" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.satisfactionDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Most supported problems" subtitle="Community votes" />
          <div className="space-y-2">
            {data.topVoted.map((t) => (
              <div key={t.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="truncate"><span className="font-mono text-xs">{t.name}</span> · {t.title}</span>
                <span className="font-semibold text-indigo-700">{t.votes}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
