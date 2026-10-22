"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { ALL_DAYS } from "@/lib/days";

// Konuşmanın üstündeki gün seçici. Seçilen gün adres çubuğunda ?gun=YYYY-MM-DD
// olarak tutulur (sayfa yenilense ya da link paylaşılsa da aynı gün açılır).
// Oklar, mesaj olan bir önceki/sonraki güne atlar.
export function DayFilter({
  selected,
  days,
  today,
  anchor = "",
  total,
  shown,
}: {
  selected: string | null;
  days: string[]; // mesaj olan günler, eskiden yeniye
  today: string;
  anchor?: string; // ör. "#yorumlar"
  total: number;
  shown: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  // Bugün varsayılandır (parametresiz adres); "Tümü" için ?gun=tumu
  function go(day: string | null) {
    const query = day === null ? `?gun=${ALL_DAYS}` : day === today ? "" : `?gun=${day}`;
    startTransition(() => {
      router.replace(`${pathname}${query}${anchor}`, { scroll: false });
    });
  }

  const prev = selected
    ? [...days].reverse().find((d) => d < selected)
    : days[days.length - 1];
  const next = selected ? days.find((d) => d > selected) : undefined;

  const arrow =
    "flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";
  const chip = (active: boolean) =>
    `h-9 rounded-lg px-3 text-sm font-bold transition ${
      active ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CalendarDays className="size-4.5 text-slate-400" aria-hidden />
      <button
        type="button"
        onClick={() => prev && go(prev)}
        disabled={!prev || pending}
        aria-label="Mesaj olan önceki gün"
        title="Mesaj olan önceki gün"
        className={arrow}
      >
        <ChevronLeft className="size-4" />
      </button>
      <label className="sr-only" htmlFor={`gun-${anchor || "sohbet"}`}>
        Gün seçin
      </label>
      <input
        id={`gun-${anchor || "sohbet"}`}
        type="date"
        value={selected ?? ""}
        max={today}
        onChange={(e) => go(e.target.value || today)}
        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
      />
      <button
        type="button"
        onClick={() => next && go(next)}
        disabled={!next || pending}
        aria-label="Mesaj olan sonraki gün"
        title="Mesaj olan sonraki gün"
        className={arrow}
      >
        <ChevronRight className="size-4" />
      </button>
      <button type="button" onClick={() => go(today)} disabled={pending} className={chip(selected === today)}>
        Bugün
      </button>
      <button type="button" onClick={() => go(null)} disabled={pending} className={chip(selected === null)}>
        Tümü
      </button>
      <span className="ml-auto inline-flex items-center gap-1.5 text-sm text-slate-500">
        {pending && <LoaderCircle className="size-3.5 animate-spin" />}
        {selected ? `${shown} / ${total} mesaj` : `${total} mesaj`}
      </span>
    </div>
  );
}
