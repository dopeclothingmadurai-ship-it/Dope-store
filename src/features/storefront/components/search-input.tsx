"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Search, X } from "lucide-react";

const RECENT_KEY = "dope-recent-search";

export function SearchInput() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
      if (Array.isArray(stored)) setRecent(stored.slice(0, 6));
    } catch {
      setRecent([]);
    }
  }, []);

  function run(query: string) {
    const term = query.trim();
    if (!term) return;
    const next = [term, ...recent.filter((item) => item !== term)].slice(0, 6);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    run(value);
  }

  function clearRecent() {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          placeholder="Search for pieces, categories…"
          aria-label="Search"
          className="border-input bg-secondary/60 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 h-14 w-full border pr-4 pl-12 text-base transition-colors outline-none"
        />
      </form>

      {recent.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground/70 text-[11px] font-medium tracking-[0.16em] uppercase">
            Recent
          </span>
          {recent.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => run(term)}
              className="border-border text-foreground/80 hover:border-foreground hover:text-foreground rounded-full border px-3 py-1 text-xs transition-colors"
            >
              {term}
            </button>
          ))}
          <button
            type="button"
            onClick={clearRecent}
            aria-label="Clear recent searches"
            className="text-muted-foreground hover:text-foreground ml-1 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
