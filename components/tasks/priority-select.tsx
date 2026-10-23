"use client";

import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import type { TaskPriority } from "@/types/database";
import { PRIORITY_LABELS, TASK_PRIORITIES } from "@/lib/tasks";
import { PriorityIcon } from "./priority";

// Öncelik seçici: simgeli açılır liste; seçilen değer formda "priority" adıyla gider.
// Klavye: Enter/Boşluk açar, oklarla gezinir, Enter seçer, Esc kapatır.
export function PrioritySelect({
  name = "priority",
  defaultValue = "none",
  disabled = false,
  id,
}: {
  name?: string;
  defaultValue?: TaskPriority;
  disabled?: boolean;
  id?: string;
}) {
  const [value, setValue] = useState<TaskPriority>(defaultValue);
  const [open, setOpen] = useState(false);
  // Altta yer yoksa (ör. pencerenin dibinde) liste yukarı doğru açılır
  const [dropUp, setDropUp] = useState(false);
  const [active, setActive] = useState(TASK_PRIORITIES.indexOf(defaultValue));
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function openList() {
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const box = (button.closest(".overflow-y-auto") ?? document.documentElement).getBoundingClientRect();
      const below = Math.min(box.bottom, window.innerHeight) - rect.bottom;
      const above = rect.top - Math.max(box.top, 0);
      setDropUp(below < 250 && above > below);
    }
    setActive(TASK_PRIORITIES.indexOf(value));
    setOpen(true);
  }

  function choose(p: TaskPriority) {
    // Seçim forma anında yazılsın (hemen ardından gönderilse bile doğru değer gitsin)
    flushSync(() => setValue(p));
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      // Pencerenin (modal) kapanmasını engelle; sadece listeyi kapat
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, TASK_PRIORITIES.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(TASK_PRIORITIES[active]);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative mt-2" onKeyDown={onKeyDown}>
      <input type="hidden" name={name} value={value} />
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openList())}
        className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-left text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60"
      >
        <PriorityIcon priority={value} />
        <span className="flex-1">{PRIORITY_LABELS[value]}</span>
        <ChevronDown className="size-5 text-slate-500" aria-hidden />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Öncelik"
          className={`absolute right-0 left-0 z-20 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 ${
            dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {TASK_PRIORITIES.map((p, i) => (
            <li
              key={p}
              role="option"
              aria-selected={p === value}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(p)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] text-slate-800 ${
                i === active ? "bg-slate-100" : ""
              }`}
            >
              <PriorityIcon priority={p} />
              <span className="flex-1">{PRIORITY_LABELS[p]}</span>
              {p === value && <Check className="size-4.5 text-slate-700" strokeWidth={2.4} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
