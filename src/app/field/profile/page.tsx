"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Field, Loading, SectionTitle, inputClass } from "@/components/ui";
import { apiError, get, put } from "@/lib/api";
import { useApp } from "@/context/AppContext";

type ProfileData = {
  user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
    phone: string | null;
    city: string | null;
    state: string | null;
  };
  person: {
    id: number;
    fullName: string;
    mobile: string | null;
    email: string | null;
    skills: string[];
    expertise: string[];
    department: string | null;
    organization: string | null;
    experienceYears: number | null;
    registeredLocation: string | null;
    latitude: number | null;
    longitude: number | null;
    serviceRadiusKm: number | null;
    languages: string[];
    availabilityStatus: string;
  } | null;
};

export default function FieldProfilePage() {
  const { pushToast } = useApp();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    department: "",
    organization: "",
    experienceYears: "5",
    registeredLocation: "",
    latitude: "17.4930",
    longitude: "78.4050",
    serviceRadiusKm: "25",
    availabilityStatus: "AVAILABLE",
    skills: [] as string[],
    expertise: [] as string[],
    newSkill: "",
    newExpertise: "",
  });

  const load = useCallback(() => {
    get<ProfileData>("/field/profile")
      .then((res) => {
        setData(res);
        if (res.person) {
          setForm({
            fullName: res.person.fullName || res.user.fullName || "",
            mobile: res.person.mobile || res.user.phone || "",
            department: res.person.department || "",
            organization: res.person.organization || "",
            experienceYears: String(res.person.experienceYears || 5),
            registeredLocation: res.person.registeredLocation || "",
            latitude: String(res.person.latitude ?? "17.4930"),
            longitude: String(res.person.longitude ?? "78.4050"),
            serviceRadiusKm: String(res.person.serviceRadiusKm || 25),
            availabilityStatus: res.person.availabilityStatus || "AVAILABLE",
            skills: res.person.skills || [],
            expertise: res.person.expertise || [],
            newSkill: "",
            newExpertise: "",
          });
        }
      })
      .catch((e) => pushToast(apiError(e), "error"))
      .finally(() => setLoading(false));
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAddSkill = () => {
    if (!form.newSkill.trim()) return;
    const item = form.newSkill.trim();
    if (!form.skills.includes(item)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, item], newSkill: "" }));
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const handleAddExpertise = () => {
    if (!form.newExpertise.trim()) return;
    const item = form.newExpertise.trim();
    if (!form.expertise.includes(item)) {
      setForm((prev) => ({ ...prev, expertise: [...prev.expertise, item], newExpertise: "" }));
    }
  };

  const handleRemoveExpertise = (exp: string) => {
    setForm((prev) => ({ ...prev, expertise: prev.expertise.filter((e) => e !== exp) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await put("/field/profile", {
        fullName: form.fullName,
        mobile: form.mobile,
        department: form.department,
        organization: form.organization,
        experienceYears: Number(form.experienceYears) || 0,
        registeredLocation: form.registeredLocation,
        latitude: Number(form.latitude) || 0,
        longitude: Number(form.longitude) || 0,
        serviceRadiusKm: Number(form.serviceRadiusKm) || 25,
        availabilityStatus: form.availabilityStatus,
        skills: form.skills,
        expertise: form.expertise,
      });
      pushToast("Field engineer profile updated successfully", "success");
      load();
    } catch (e) {
      pushToast(apiError(e), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell role="FIELD_PERSON">
        <Loading label="Loading field profile…" />
      </AppShell>
    );
  }

  return (
    <AppShell role="FIELD_PERSON">
      <div className="max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Field Engineer Profile</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your verified skills, expertise domains, registered service location, and availability status.
            </p>
          </div>
          {data?.person?.availabilityStatus && (
            <Badge tone={data.person.availabilityStatus === "AVAILABLE" ? "emerald" : "amber"}>
              Status: {data.person.availabilityStatus.replaceAll("_", " ")}
            </Badge>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-slate-200">
            <SectionTitle title="Personal & Organizational Info" subtitle="Identity verified with university partners." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name">
                <input
                  type="text"
                  className={inputClass}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </Field>

              <Field label="Mobile Number">
                <input
                  type="text"
                  className={inputClass}
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </Field>

              <Field label="Department">
                <input
                  type="text"
                  className={inputClass}
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g. Electrical & Utilities"
                />
              </Field>

              <Field label="Organization / Agency">
                <input
                  type="text"
                  className={inputClass}
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  placeholder="e.g. Municipal Engineering Division"
                />
              </Field>

              <Field label="Years of Field Experience">
                <input
                  type="number"
                  className={inputClass}
                  value={form.experienceYears}
                  onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                  min={0}
                  max={50}
                />
              </Field>

              <Field label="Current Availability Status">
                <select
                  className={inputClass}
                  value={form.availabilityStatus}
                  onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })}
                >
                  <option value="AVAILABLE">AVAILABLE (Accepting new assignments)</option>
                  <option value="ON_FIELD_VISIT">ON FIELD VISIT (Currently on site)</option>
                  <option value="BUSY">BUSY (Active commitments)</option>
                  <option value="UNAVAILABLE">UNAVAILABLE (Off-duty / Leave)</option>
                </select>
              </Field>
            </div>
          </Card>

          {/* Registered Location & Service Radius */}
          <Card className="border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle
                title="Service Base & Operating Radius"
                subtitle="Used for the 6-factor algorithmic proximity calculations."
              />
              <Badge tone="slate">Registered Location (Not Live GPS)</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <Field label="Registered Base Location">
                  <input
                    type="text"
                    className={inputClass}
                    value={form.registeredLocation}
                    onChange={(e) => setForm({ ...form, registeredLocation: e.target.value })}
                    placeholder="e.g. Jeedimetla Industrial Area, Hyderabad"
                  />
                </Field>
              </div>

              <Field label="Latitude (Base Coordinates)">
                <input
                  type="number"
                  step="0.0001"
                  className={inputClass}
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="17.4930"
                />
              </Field>

              <Field label="Longitude (Base Coordinates)">
                <input
                  type="number"
                  step="0.0001"
                  className={inputClass}
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="78.4050"
                />
              </Field>

              <Field label="Operating Service Radius (km)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.serviceRadiusKm}
                  onChange={(e) => setForm({ ...form, serviceRadiusKm: e.target.value })}
                  min={1}
                  max={100}
                />
              </Field>
            </div>
          </Card>

          {/* Skills & Domain Expertise */}
          <Card className="border-slate-200">
            <SectionTitle
              title="Technical Skills & Domain Expertise"
              subtitle="Matched against problem categories and AI required expertise."
            />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Technical Skills (40% Weight)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a skill (e.g. Electrical, Smart Grid, Wiring)"
                    value={form.newSkill}
                    onChange={(e) => setForm({ ...form, newSkill: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className={inputClass}
                  />
                  <Button variant="outline" onClick={handleAddSkill}>
                    + Add
                  </Button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Specialized Domains & Expertise (20% Weight)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.expertise.map((exp) => (
                    <span
                      key={exp}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-medium text-indigo-800"
                    >
                      {exp}
                      <button
                        type="button"
                        onClick={() => handleRemoveExpertise(exp)}
                        className="text-indigo-400 hover:text-indigo-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an expertise domain (e.g. Street Lighting, IoT Sensors)"
                    value={form.newExpertise}
                    onChange={(e) => setForm({ ...form, newExpertise: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddExpertise();
                      }
                    }}
                    className={inputClass}
                  />
                  <Button variant="outline" onClick={handleAddExpertise}>
                    + Add
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="bg-slate-900 text-white px-8 py-2.5 shadow-sm hover:bg-slate-800"
            >
              {saving ? "Saving Profile…" : "Save Profile Changes"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
