"use client";

import { CalendarDays, MapPin, PencilLine, Plus, Trash2, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiError, del, get, post, put } from "@/lib/api";
import { useApp, type Role } from "@/context/AppContext";
import { Button, Card, Field, inputClass, Modal } from "@/components/ui";

type EventItem = {
  id: number;
  title: string;
  date: string;
  location: string;
  seats: number;
  description: string;
  registered: boolean;
  ownerRole: Role;
  role: Role;
  createdBy: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
};

const emptyForm = {
  title: "",
  date: "",
  location: "",
  seats: 20,
  description: "",
  ownerRole: "CITIZEN" as Role,
  status: "PUBLISHED" as "DRAFT" | "PUBLISHED" | "CLOSED",
};

export function EventRegistrationBoard() {
  const { user, pushToast } = useApp();
  const role = user?.role ?? "CITIZEN";
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const canManage = role !== "CITIZEN";

  const visibleEvents = useMemo(() => {
    if (role === "ADMIN") return events;
    if (role === "UNIVERSITY") {
      return events.filter((event) => event.ownerRole === "UNIVERSITY" || event.role === "UNIVERSITY" || event.role === "CITIZEN");
    }
    if (role === "INDUSTRY") {
      return events.filter((event) => event.ownerRole === "INDUSTRY" || event.role === "INDUSTRY" || event.role === "CITIZEN");
    }
    return events.filter((event) => event.role === "CITIZEN");
  }, [events, role]);

  const load = () => {
    get<{ items: EventItem[] }>(`/events?role=${role}`)
      .then((d) => setEvents(d.items))
      .catch((e) => pushToast(apiError(e), "error"));
  };

  useEffect(() => {
    if (user) load();
  }, [user, role, pushToast]);

  const handleRegister = async (eventId: number) => {
    try {
      await post<{ item: EventItem }>("/events", { eventId });
      setEvents((items) => items.map((e) => e.id === eventId ? { ...e, registered: true } : e));
      pushToast("Event registered successfully.", "success");
    } catch (error) {
      pushToast(apiError(error), "error");
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, ownerRole: role === "ADMIN" ? "CITIZEN" : role });
    setIsFormOpen(true);
  };

  const openEdit = (event: EventItem) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      date: event.date,
      location: event.location,
      seats: event.seats,
      description: event.description,
      ownerRole: event.ownerRole,
      status: event.status,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        ownerRole: role === "ADMIN" ? form.ownerRole : role,
      };

      if (editingId) {
        await put<{ item: EventItem }>("/events", { ...payload, id: editingId });
        pushToast("Event updated.", "success");
      } else {
        await post<{ item: EventItem }>("/events", payload);
        pushToast("Event created.", "success");
      }
      setForm({ ...emptyForm, ownerRole: role === "ADMIN" ? "CITIZEN" : role });
      setEditingId(null);
      setIsFormOpen(false);
      load();
    } catch (error) {
      pushToast(apiError(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await del<{ success: boolean }>(`/events?id=${id}`);
      pushToast("Event deleted.", "success");
      load();
    } catch (error) {
      pushToast(apiError(error), "error");
    }
  };

  return (
    <Card className="mt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-2 text-indigo-700"><CalendarDays className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Events</p>
            <h3 className="text-xl font-semibold text-slate-900">{role === "CITIZEN" ? "Collaboration and registration" : "Event management"}</h3>
          </div>
        </div>
        {canManage ? (
          <Button onClick={openCreate} size="sm" variant="primary" className="inline-flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" /> Create event
          </Button>
        ) : null}
      </div>

      {isFormOpen ? (
        <form onSubmit={handleSubmit} className="mb-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} required />
            </Field>
            <Field label="Date">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} required />
            </Field>
            <Field label="Location">
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} required />
            </Field>
            <Field label="Seats">
              <input type="number" min={1} value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value || 0) })} className={inputClass} required />
            </Field>
            {role === "ADMIN" ? (
              <Field label="Portal owner">
                <select value={form.ownerRole} onChange={(e) => setForm({ ...form, ownerRole: e.target.value as Role })} className={inputClass}>
                  <option value="CITIZEN">Citizen</option>
                  <option value="UNIVERSITY">University</option>
                  <option value="INDUSTRY">Industry</option>
                </select>
              </Field>
            ) : null}
          </div>

          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputClass} resize-none`} />
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setIsFormOpen(false); setEditingId(null); setForm({ ...emptyForm, ownerRole: role === "ADMIN" ? "CITIZEN" : role }); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} variant="primary">
              {saving ? "Saving..." : editingId ? "Update event" : "Publish event"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-semibold text-slate-900">{event.title}</h4>
                {event.status !== "PUBLISHED" ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">{event.status}</span> : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(event.date).toLocaleDateString()}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                <span className="inline-flex items-center gap-1"><UsersRound className="h-3 w-3" /> {event.seats} seats</span>
              </div>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {canManage ? (
                <>
                  <Button onClick={() => openEdit(event)} size="sm" variant="outline" className="inline-flex items-center gap-2">
                    <PencilLine className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button onClick={() => handleDelete(event.id)} size="sm" variant="danger" className="inline-flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </>
              ) : (
                <button onClick={() => handleRegister(event.id)} className={`rounded-xl px-4 py-2 text-sm font-medium ${event.registered ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"}`}>
                  {event.registered ? "Registered" : "Register now"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedEvent ? (
        <Modal open={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={selectedEvent.title}>
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-7 text-slate-700">{selectedEvent.description || "No detailed description has been added for this event yet."}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Date</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{new Date(selectedEvent.date).toLocaleDateString()}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Location</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{selectedEvent.location}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Seats</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{selectedEvent.seats}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Portal</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{selectedEvent.ownerRole}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
              <span>Status: <strong>{selectedEvent.status}</strong></span>
              <span>Created by: {selectedEvent.createdBy ?? "System"}</span>
            </div>

            <div className="flex justify-end gap-2">
              {!canManage ? (
                <Button onClick={() => { handleRegister(selectedEvent.id); setSelectedEvent(null); }} variant={selectedEvent.registered ? "success" : "primary"}>
                  {selectedEvent.registered ? "Registered" : "Register now"}
                </Button>
              ) : null}
            </div>
          </div>
        </Modal>
      ) : null}
    </Card>
  );
}
