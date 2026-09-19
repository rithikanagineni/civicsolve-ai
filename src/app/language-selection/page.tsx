"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { LANGUAGES } from "@/lib/i18n";

export default function LanguageSelectionPage() {
  const { language, setLanguage, t } = useApp();
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-6 text-sm text-slate-500 hover:underline">← CivicSolve AI</Link>
      <h1 className="text-3xl font-semibold text-slate-900">{t("chooseLanguage")}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your language preference is stored with your account in PostgreSQL and used for reports, voice input and IVR.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={`rounded-2xl border p-4 text-left transition ${
              language === l.code ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-400"
            }`}
          >
            <p className="text-lg font-semibold">{l.native}</p>
            <p className={`text-xs ${language === l.code ? "text-slate-300" : "text-slate-500"}`}>{l.label}</p>
          </button>
        ))}
      </div>
      <div className="mt-8 flex gap-3">
        <button onClick={() => router.push("/login")} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
          {t("continue")} → {t("login")}
        </button>
        <button onClick={() => router.push("/register")} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium hover:bg-slate-50">
          {t("register")}
        </button>
      </div>
    </div>
  );
}
