"use client";

import { useEffect, useState } from "react";
import { apiError, get, put } from "@/lib/api";
import { Button, Card, Field, Loading, SectionTitle, inputClass } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { LANGUAGES } from "@/lib/i18n";

type Me = {
  user: { id: number; email: string; role: string; fullName: string; organizationName: string | null; phone: string | null; city: string | null; state: string | null; bio: string | null; language: string };
  universityExpertise: { departments: string[]; skills: string[]; researchAreas: string[]; facultyExpertise: string[]; studentTeams: number } | null;
  industryExpertise: { technologies: string[]; domains: string[]; supportTypes: string[] } | null;
};

export function ProfileView() {
  const { pushToast, setLanguage } = useApp();
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get<Me>("/users/me")
      .then((d) => {
        setMe(d);
        setForm({
          fullName: d.user.fullName,
          organizationName: d.user.organizationName ?? "",
          phone: d.user.phone ?? "",
          city: d.user.city ?? "",
          state: d.user.state ?? "",
          bio: d.user.bio ?? "",
          language: d.user.language,
          departments: d.universityExpertise?.departments.join(", ") ?? "",
          skills: d.universityExpertise?.skills.join(", ") ?? "",
          researchAreas: d.universityExpertise?.researchAreas.join(", ") ?? "",
          facultyExpertise: d.universityExpertise?.facultyExpertise.join(", ") ?? "",
          studentTeams: String(d.universityExpertise?.studentTeams ?? 0),
          technologies: d.industryExpertise?.technologies.join(", ") ?? "",
          domains: d.industryExpertise?.domains.join(", ") ?? "",
          supportTypes: d.industryExpertise?.supportTypes.join(", ") ?? "",
        });
      })
      .catch((e) => pushToast(apiError(e), "error"));
  }, [pushToast]);

  if (!me) return <Loading />;
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await put("/users/me", { ...form, studentTeams: Number(form.studentTeams) || 0 });
      setLanguage(form.language);
      pushToast("Profile updated", "success");
    } catch (err) {
      pushToast(apiError(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SectionTitle title="Profile" subtitle={`${me.user.role} · ${me.user.email}`} />
      <Card>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input className={inputClass} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></Field>
          {me.user.role !== "CITIZEN" ? (
            <Field label="Organisation"><input className={inputClass} value={form.organizationName} onChange={(e) => set("organizationName", e.target.value)} /></Field>
          ) : null}
          <Field label="Phone"><input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Preferred language">
            <select className={inputClass} value={form.language} onChange={(e) => set("language", e.target.value)}>
              {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.native} — {l.label}</option>))}
            </select>
          </Field>
          <Field label="City"><input className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
          <Field label="State"><input className={inputClass} value={form.state} onChange={(e) => set("state", e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="About"><textarea className={inputClass} rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} /></Field></div>

          {me.universityExpertise ? (
            <>
              <Field label="Departments"><input className={inputClass} value={form.departments} onChange={(e) => set("departments", e.target.value)} /></Field>
              <Field label="Research areas"><input className={inputClass} value={form.researchAreas} onChange={(e) => set("researchAreas", e.target.value)} /></Field>
              <Field label="Skills"><input className={inputClass} value={form.skills} onChange={(e) => set("skills", e.target.value)} /></Field>
              <Field label="Faculty expertise"><input className={inputClass} value={form.facultyExpertise} onChange={(e) => set("facultyExpertise", e.target.value)} /></Field>
              <Field label="Student teams"><input className={inputClass} type="number" value={form.studentTeams} onChange={(e) => set("studentTeams", e.target.value)} /></Field>
            </>
          ) : null}

          {me.industryExpertise ? (
            <>
              <Field label="Technologies"><input className={inputClass} value={form.technologies} onChange={(e) => set("technologies", e.target.value)} /></Field>
              <Field label="Domains"><input className={inputClass} value={form.domains} onChange={(e) => set("domains", e.target.value)} /></Field>
              <Field label="Support types"><input className={inputClass} value={form.supportTypes} onChange={(e) => set("supportTypes", e.target.value)} /></Field>
            </>
          ) : null}

          <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button></div>
        </form>
      </Card>
    </div>
  );
}
