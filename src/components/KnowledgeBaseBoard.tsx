"use client";

import { BookOpen, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiError, get } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui";

type Article = {
  id: number;
  title: string;
  category: string;
  summary: string;
  tags: string[];
};

export function KnowledgeBaseBoard() {
  const { user, pushToast } = useApp();
  const [articles, setArticles] = useState<Article[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    get<{ items: Article[] }>(`/knowledge?role=${user?.role ?? "CITIZEN"}`)
      .then((d) => setArticles(d.items))
      .catch((e) => pushToast(apiError(e), "error"));
  }, [pushToast, user?.role]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return articles;
    return articles.filter((item) => `${item.title} ${item.category} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(q));
  }, [articles, query]);

  return (
    <Card className="mt-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Knowledge base</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">AI + RAG search for stored civic knowledge</h3>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <Search className="h-4 w-4" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search knowledge…" className="w-52 bg-transparent text-sm outline-none placeholder:text-slate-400" />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {filtered.map((article, index) => (
          <div key={`${article.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-indigo-700">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">{article.category}</span>
            </div>
            <h4 className="mt-3 text-base font-semibold text-slate-900">{article.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">{article.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={`${article.title}-${tag}`} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
