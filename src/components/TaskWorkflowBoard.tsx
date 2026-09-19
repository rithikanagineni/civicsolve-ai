"use client";

import { CheckCheck, Clock3, Rocket, ShieldCheck, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { apiError, get } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui";

type TaskItem = {
  id: number;
  title: string;
  owner: string;
  status: string;
};

const iconLookup = {
  "Accept task": Rocket,
  "Start work": Clock3,
  "Submit evidence": Upload,
  "Verify resolution": ShieldCheck,
  Resolved: CheckCheck,
};

export function TaskWorkflowBoard() {
  const { pushToast } = useApp();
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    get<{ items: TaskItem[] }>("/tasks")
      .then((d) => setTasks(d.items))
      .catch((e) => pushToast(apiError(e), "error"));
  }, [pushToast]);

  return (
    <Card className="mt-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Task system</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-900">Accept → start work → evidence → verification → resolved</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {tasks.map(({ title, owner, status }) => {
          const Icon = iconLookup[title as keyof typeof iconLookup] ?? Rocket;
          return (
            <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-indigo-100 p-2 text-indigo-700"><Icon className="h-4 w-4" /></div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{status}</span>
              </div>
              <h4 className="mt-3 text-sm font-semibold text-slate-900">{title}</h4>
              <p className="mt-1 text-xs text-slate-500">{owner}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
