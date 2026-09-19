"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { homeFor, useApp, type Role } from "@/context/AppContext";
import { Button, Field, inputClass } from "@/components/ui";
import { LANGUAGES } from "@/lib/i18n";

const MAX_VERIFICATION_FILE_SIZE = 800 * 1024;

const ROLES: { value: Exclude<Role, "ADMIN">; label: string; hint: string }[] = [
  { value: "CITIZEN", label: "Citizen", hint: "Report and validate civic problems" },
  { value: "UNIVERSITY", label: "University", hint: "Accept challenges, run projects" },
  { value: "INDUSTRY", label: "Industry", hint: "Provide technology and mentorship" },
  { value: "FIELD_PERSON", label: "Field person", hint: "Verify assigned locations on the ground" },
];

export default function RegisterPage() {
  const { register, t, language, setLanguage, pushToast } = useApp();
  const router = useRouter();
  const [role, setRole] = useState<Role>("CITIZEN");
  const [form, setForm] = useState<Record<string, string>>({
    fullName: "", email: "", password: "", organizationName: "", phone: "", city: "", state: "",
    departments: "", skills: "", researchAreas: "", facultyExpertise: "", studentTeams: "3",
    technologies: "", domains: "", supportTypes: "Mentorship, Technology",
    verificationDocuments: "",
  });
  const [documentName, setDocumentName] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleDocumentUpload = (file: File | null) => {
    if (!file) {
      set("verificationDocuments", "");
      setDocumentName("");
      setDocumentError("");
      return;
    }

    if (file.size > MAX_VERIFICATION_FILE_SIZE) {
      set("verificationDocuments", "");
      setDocumentName(file.name);
      setDocumentError("Please upload a smaller verification document (under 800 KB). Large files can time out on Vercel.");
      return;
    }

    setDocumentError("");
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      set("verificationDocuments", value);
      setDocumentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    if (documentError || !form.verificationDocuments?.trim()) {
      setError(documentError || "Please upload a verification document before creating your account.");
      setBusy(false);
      return;
    }

    try {
      const user = await register({ ...form, role, language, studentTeams: Number(form.studentTeams) || 0 });
      pushToast("Account created — welcome to CivicSolve AI", "success");
      router.push(homeFor(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.12),_transparent_25%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white/80 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6 lg:p-8">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 transition hover:text-slate-900">← CivicSolve AI</Link>
        <div className="mt-6 rounded-[28px] bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">Create account</p>
          <h1 className="mt-2 text-3xl font-bold">{t("register")}</h1>
          <p className="mt-2 text-sm text-slate-300">Create your account and pick the role you represent.</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={`rounded-2xl border p-3 text-left text-sm transition ${
                role === r.value ? "border-indigo-200 bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <p className="font-semibold">{r.label}</p>
              <p className={`mt-1 text-xs ${role === r.value ? "text-indigo-100" : "text-slate-500"}`}>{r.hint}</p>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 grid gap-4 rounded-[28px] border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Full name / Contact person">
            <input className={inputClass} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
          </Field>
          <Field label={t("email")}>
            <input className={inputClass} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </Field>
          <Field label={t("password")} hint="Minimum 6 characters">
            <input className={inputClass} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required />
          </Field>
          <Field label={t("chooseLanguage")}>
            <select className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.native} — {l.label}</option>))}
            </select>
          </Field>
          {role !== "CITIZEN" ? (
            <Field label="Organisation name">
              <input className={inputClass} value={form.organizationName} onChange={(e) => set("organizationName", e.target.value)} />
            </Field>
          ) : null}
          <Field label="Phone"><input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="City"><input className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
          <Field label="State"><input className={inputClass} value={form.state} onChange={(e) => set("state", e.target.value)} /></Field>

          {role === "CITIZEN" ? (
            <div className="sm:col-span-2">
              <Field label="Verification documents" hint="Upload proof such as Aadhaar card or ration card for verification">
                <input
                  type="file"
                  accept="*/*"
                  required
                  className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800`}
                  onChange={(e) => handleDocumentUpload(e.target.files?.[0] ?? null)}
                />
                {documentName ? <p className="mt-2 text-xs text-slate-500">Selected file: {documentName}</p> : null}
                {documentError ? <p className="mt-2 text-xs text-amber-700">{documentError}</p> : null}
              </Field>
            </div>
          ) : null}

          {role === "UNIVERSITY" ? (
            <>
              <Field label="Departments" hint="Comma separated"><input className={inputClass} value={form.departments} onChange={(e) => set("departments", e.target.value)} placeholder="Civil Engineering, Computer Science" /></Field>
              <Field label="Research areas" hint="Comma separated"><input className={inputClass} value={form.researchAreas} onChange={(e) => set("researchAreas", e.target.value)} placeholder="Road Safety, Water Management" /></Field>
              <Field label="Skills" hint="Comma separated"><input className={inputClass} value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="GIS, IoT, Data Science" /></Field>
              <Field label="Student teams"><input className={inputClass} type="number" value={form.studentTeams} onChange={(e) => set("studentTeams", e.target.value)} /></Field>
              <div className="sm:col-span-2">
                <Field label="University verification documents" hint="Upload university ID, registration certificate, affiliation or authorization documents">
                  <input
                    type="file"
                    accept="*/*"
                    required
                    className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800`}
                    onChange={(e) => handleDocumentUpload(e.target.files?.[0] ?? null)}
                  />
                  {documentName ? <p className="mt-2 text-xs text-slate-500">Selected file: {documentName}</p> : null}
                </Field>
              </div>
            </>
          ) : null}

          {role === "INDUSTRY" ? (
            <>
              <Field label="Technologies" hint="Comma separated"><input className={inputClass} value={form.technologies} onChange={(e) => set("technologies", e.target.value)} placeholder="IoT, Sensors, Data Analytics" /></Field>
              <Field label="Domains" hint="Comma separated"><input className={inputClass} value={form.domains} onChange={(e) => set("domains", e.target.value)} placeholder="Smart Cities, Water" /></Field>
              <Field label="Support types" hint="Comma separated"><input className={inputClass} value={form.supportTypes} onChange={(e) => set("supportTypes", e.target.value)} /></Field>
              <div className="sm:col-span-2">
                <Field label="Industry verification documents" hint="Upload GST, registration certificate, company ID, or other verification documents required for approval">
                  <input
                    type="file"
                    accept="*/*"
                    required
                    className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800`}
                    onChange={(e) => handleDocumentUpload(e.target.files?.[0] ?? null)}
                  />
                  {documentName ? <p className="mt-2 text-xs text-slate-500">Selected file: {documentName}</p> : null}
                  {documentError ? <p className="mt-2 text-xs text-amber-700">{documentError}</p> : null}
                </Field>
              </div>
            </>
          ) : null}
          {role === "FIELD_PERSON" ? (
            <div className="sm:col-span-2">
              <Field label="Field person verification documents" hint="Upload an organization authorization letter or identity document">
                <input type="file" className={inputClass} onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => set("verificationDocuments", String(reader.result ?? "")); reader.readAsDataURL(file); }} />
              </Field>
            </div>
          ) : null}

          <div className="sm:col-span-2">
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {role === "CITIZEN" && "Citizen accounts will be activated only after admin verification of the Aadhaar/Ration card document."}
              {role === "UNIVERSITY" && "University accounts will be activated only after admin verification of the university ID and registration documents."}
              {role === "INDUSTRY" && "Industry accounts will be activated only after admin verification of the company registration and related documents."}
              {role === "FIELD_PERSON" && "Field-person accounts require identity or organization authorization verification before they can be linked to a university."}
            </div>
            {error ? <p className="mb-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <Button type="submit" disabled={busy} className="w-full rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-700 to-violet-600 px-4 py-3 text-base font-semibold shadow-lg shadow-indigo-200 hover:brightness-110">
              {busy ? "Creating account…" : t("register")}
            </Button>
            <p className="mt-3 text-center text-sm text-slate-500">
              Already registered? <Link href="/login" className="font-medium text-indigo-700 hover:underline">{t("login")}</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
