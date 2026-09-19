"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Empty, Field, Loading, Modal, SectionTitle, inputClass } from "@/components/ui";
import { apiError, del, get, post, put } from "@/lib/api";
import { useApp } from "@/context/AppContext";

type Person = {
  id: number;
  fullName: string;
  photoUrl: string | null;
  mobile: string | null;
  email: string | null;
  role: string | null;
  department: string | null;
  organization: string | null;
  employeeId: string | null;
  skills: string[];
  expertise: string[];
  experienceYears: number;
  registeredLocation: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
  languages: string[];
  availabilityStatus: string;
};

const emptyForm = {
  id: null as number | null,
  fullName: "",
  photoUrl: "",
  mobile: "",
  email: "",
  role: "Field Engineer",
  department: "Electrical & Utilities",
  organization: "CivicSolve Field Team",
  employeeId: "",
  skills: "",
  expertise: "",
  experienceYears: "4",
  languages: "English, Telugu",
  registeredLocation: "Jeedimetla Industrial Area, Hyderabad",
  latitude: "17.4930",
  longitude: "78.4050",
  serviceRadiusKm: "25",
  availabilityStatus: "AVAILABLE",
};

export default function UniversityFieldPersonsPage() {
  const { pushToast } = useApp();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetPerson, setTargetPerson] = useState<Person | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    get<{ fieldPersons: Person[] }>("/university/field-persons")
      .then((x) => setPeople(x.fieldPersons || []))
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Person) => {
    setForm({
      id: p.id,
      fullName: p.fullName,
      photoUrl: p.photoUrl || "",
      mobile: p.mobile || "",
      email: p.email || "",
      role: p.role || "Field Engineer",
      department: p.department || "",
      organization: p.organization || "",
      employeeId: p.employeeId || "",
      skills: (p.skills || []).join(", "),
      expertise: (p.expertise || []).join(", "),
      experienceYears: String(p.experienceYears || 0),
      languages: (p.languages || []).join(", "),
      registeredLocation: p.registeredLocation || "",
      latitude: p.latitude !== null ? String(p.latitude) : "",
      longitude: p.longitude !== null ? String(p.longitude) : "",
      serviceRadiusKm: String(p.serviceRadiusKm || 25),
      availabilityStatus: p.availabilityStatus || "AVAILABLE",
    });
    setModalOpen(true);
  };

  const openDelete = (p: Person) => {
    setTargetPerson(p);
    setDeleteModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      pushToast("Full name is required", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        photoUrl: form.photoUrl.trim() || null,
        mobile: form.mobile.trim() || null,
        email: form.email.trim() || null,
        role: form.role.trim() || "Field Engineer",
        department: form.department.trim() || null,
        organization: form.organization.trim() || null,
        employeeId: form.employeeId.trim() || null,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        expertise: form.expertise.split(",").map((e) => e.trim()).filter(Boolean),
        experienceYears: Number(form.experienceYears) || 0,
        languages: form.languages.split(",").map((l) => l.trim()).filter(Boolean),
        registeredLocation: form.registeredLocation.trim() || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        serviceRadiusKm: Number(form.serviceRadiusKm) || 25,
        availabilityStatus: form.availabilityStatus,
      };

      if (form.id) {
        await put(`/university/field-persons/${form.id}`, payload);
        pushToast("Field person updated successfully", "success");
      } else {
        await post("/university/field-persons", payload);
        pushToast("Field person added successfully", "success");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      pushToast(apiError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!targetPerson) return;
    setSaving(true);
    try {
      await del(`/university/field-persons/${targetPerson.id}`);
      pushToast(`${targetPerson.fullName} removed from university field team`, "success");
      setDeleteModalOpen(false);
      setTargetPerson(null);
      load();
    } catch (err) {
      pushToast(apiError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell role="UNIVERSITY">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Field Persons Directory</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage field engineers, on-ground inspection personnel, and domain specialists used by the AI recommendation engine.
            </p>
          </div>
          <Button onClick={openAdd} variant="primary" className="bg-slate-900 hover:bg-slate-800 text-white">
            + Add Field Person
          </Button>
        </div>

        {loading ? (
          <Loading label="Loading field persons…" />
        ) : people.length === 0 ? (
          <Empty message="No field persons registered yet. Click '+ Add Field Person' to register field personnel." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {people.map((p) => (
              <Card key={p.id} className="flex flex-col justify-between border-slate-200 p-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.fullName}
                          className="h-12 w-12 rounded-full object-cover border border-slate-200 shadow-sm"
                        />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg">
                          {p.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900">{p.fullName}</h3>
                        <p className="text-xs text-slate-500">
                          {p.role || "Field Engineer"} · {p.department ?? "Engineering"}
                        </p>
                        {p.organization ? (
                          <p className="text-[11px] text-slate-400">{p.organization}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        tone={
                          p.availabilityStatus === "AVAILABLE"
                            ? "emerald"
                            : p.availabilityStatus === "BUSY"
                            ? "amber"
                            : "rose"
                        }
                      >
                        {p.availabilityStatus}
                      </Badge>
                      {p.employeeId ? (
                        <span className="text-[10px] font-mono text-slate-400">ID: {p.employeeId}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">📍 Registered Base:</span>
                      <span className="font-medium text-slate-800">
                        {p.registeredLocation ?? "Hyderabad"}
                      </span>
                      {p.latitude && p.longitude ? (
                        <span className="text-slate-400">
                          ({p.latitude.toFixed(4)}, {p.longitude.toFixed(4)})
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <span>Experience: <strong>{p.experienceYears} yrs</strong></span>
                      <span>Radius: <strong>{p.serviceRadiusKm} km</strong></span>
                      {p.languages?.length ? (
                        <span>Languages: <strong>{p.languages.join(", ")}</strong></span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>📞 {p.mobile ?? "No phone"}</span>
                      <span>✉️ {p.email ?? "No email"}</span>
                    </div>
                  </div>

                  {/* Skills & Expertise */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.skills.map((s) => (
                      <Badge key={s} tone="slate">
                        {s}
                      </Badge>
                    ))}
                    {p.expertise.map((e) => (
                      <Badge key={e} tone="indigo">
                        {e}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    ✏️ Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => openDelete(p)}>
                    🗑️ Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add / Edit Modal */}
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={form.id ? `Edit Field Person: ${form.fullName}` : "Add New Field Person"}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full Name *">
                <input
                  className={inputClass}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Rahul Kumar"
                  required
                />
              </Field>

              <Field label="Role / Designation">
                <input
                  className={inputClass}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. Field Engineer"
                />
              </Field>

              <Field label="Mobile Number">
                <input
                  className={inputClass}
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </Field>

              <Field label="Email Address">
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="rahul.field@civicsolve.in"
                />
              </Field>

              <Field label="Department">
                <input
                  className={inputClass}
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g. Electrical Engineering"
                />
              </Field>

              <Field label="Organization / Agency">
                <input
                  className={inputClass}
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  placeholder="e.g. CivicSolve Field Team"
                />
              </Field>

              <Field label="Employee / Student ID (Optional)">
                <input
                  className={inputClass}
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  placeholder="e.g. FP-2026-004"
                />
              </Field>

              <Field label="Profile Photo URL">
                <input
                  type="url"
                  className={inputClass}
                  value={form.photoUrl}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </Field>

              <Field label="Years of Experience">
                <input
                  type="number"
                  min="0"
                  max="50"
                  className={inputClass}
                  value={form.experienceYears}
                  onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                />
              </Field>

              <Field label="Availability Status">
                <select
                  className={inputClass}
                  value={form.availabilityStatus}
                  onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })}
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="BUSY">BUSY</option>
                  <option value="UNAVAILABLE">UNAVAILABLE</option>
                </select>
              </Field>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Location & Service Radius (Not Live GPS)
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <Field label="Registered Base Location">
                    <input
                      className={inputClass}
                      value={form.registeredLocation}
                      onChange={(e) => setForm({ ...form, registeredLocation: e.target.value })}
                      placeholder="e.g. Jeedimetla Industrial Area, Hyderabad"
                    />
                  </Field>
                </div>

                <Field label="Latitude">
                  <input
                    type="number"
                    step="0.0001"
                    className={inputClass}
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    placeholder="17.4930"
                  />
                </Field>

                <Field label="Longitude">
                  <input
                    type="number"
                    step="0.0001"
                    className={inputClass}
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    placeholder="78.4050"
                  />
                </Field>

                <Field label="Service Radius (km)">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className={inputClass}
                    value={form.serviceRadiusKm}
                    onChange={(e) => setForm({ ...form, serviceRadiusKm: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Skills, Expertise & Languages
              </p>
              <Field label="Skills (Comma-separated)">
                <input
                  className={inputClass}
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  placeholder="e.g. Electrical Engineering, IoT, Street Lighting, Solar Systems"
                />
              </Field>

              <Field label="Domain Expertise (Comma-separated)">
                <input
                  className={inputClass}
                  value={form.expertise}
                  onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                  placeholder="e.g. Electrical, Smart Grid, Infrastructure"
                />
              </Field>

              <Field label="Languages Spoken (Comma-separated)">
                <input
                  className={inputClass}
                  value={form.languages}
                  onChange={(e) => setForm({ ...form, languages: e.target.value })}
                  placeholder="e.g. English, Telugu, Hindi"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} variant="primary" className="bg-slate-900 text-white">
                {saving ? "Saving…" : form.id ? "Update Field Person" : "Save Field Person"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Remove Field Person"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to remove <strong>{targetPerson?.fullName}</strong> ({targetPerson?.role ?? "Field Person"}) from your university team?
            </p>
            <p className="text-xs text-slate-400">
              This field person will be deactivated and will no longer appear for new AI verification assignments.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={saving} onClick={handleDelete}>
                {saving ? "Removing…" : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
