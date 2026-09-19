"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BellRing, Check } from "lucide-react";
import { apiError, get, put } from "@/lib/api";
import { Badge, Card, Empty, Loading, SectionTitle } from "@/components/ui";
import { useApp } from "@/context/AppContext";

type Notification = {
  id: number; title: string; message: string; type: string; link: string | null; isRead: boolean; createdAt: string;
};

export function NotificationsView() {
  const { pushToast } = useApp();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    get<{ notifications: Notification[] }>("/notifications")
      .then((d) => setItems(d.notifications))
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  useEffect(load, [load]);

  async function markRead(id: number) {
    try {
      await put(`/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (e) {
      pushToast(apiError(e), "error");
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <SectionTitle title="Notifications" subtitle="Every lifecycle event is persisted and delivered in-app" />
      {items.length === 0 ? <Empty message="No notifications yet." /> : null}
      <div className="space-y-2">
        {items.map((n) => (
          <Card key={n.id} className={n.isRead ? "opacity-70" : "border-l-4 border-l-indigo-500"}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <BellRing className="h-4 w-4 text-indigo-600" />
                  <p className="font-medium text-slate-900">{n.title}</p>
                  <Badge tone="slate">{n.type.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {n.link ? (
                  <Link href={n.link} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50">Open</Link>
                ) : null}
                {!n.isRead ? (
                  <button onClick={() => markRead(n.id)} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800">
                    <Check className="h-3 w-3" /> Mark read
                  </button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
