import { ChevronDown, ChevronsUp, ChevronUp, CircleAlert, Minus, type LucideIcon } from "lucide-react";
import type { TaskPriority } from "@/types/database";
import { PRIORITY_LABELS } from "@/lib/tasks";

// Simgeler ve renkler öncelik seçim listesiyle aynı
export const PRIORITY_UI: Record<TaskPriority, { icon: LucideIcon; color: string; chip: string }> = {
  none: { icon: Minus, color: "text-slate-400", chip: "bg-slate-100 text-slate-600" },
  low: { icon: ChevronDown, color: "text-blue-600", chip: "bg-blue-50 text-blue-700" },
  medium: { icon: ChevronUp, color: "text-amber-600", chip: "bg-amber-50 text-amber-700" },
  high: { icon: ChevronsUp, color: "text-orange-600", chip: "bg-orange-50 text-orange-700" },
  urgent: { icon: CircleAlert, color: "text-red-600", chip: "bg-red-50 text-red-700" },
};

export function PriorityIcon({ priority, className = "size-4" }: { priority: TaskPriority; className?: string }) {
  const { icon: Icon, color } = PRIORITY_UI[priority];
  return <Icon aria-hidden className={`shrink-0 ${color} ${className}`} strokeWidth={2.4} />;
}

// Kartlarda ve listelerde gösterilen öncelik rozeti
export function PriorityBadge({
  priority,
  size = "sm",
}: {
  priority: TaskPriority;
  size?: "xs" | "sm";
}) {
  const { chip } = PRIORITY_UI[priority];
  return (
    <span
      title={`Öncelik: ${PRIORITY_LABELS[priority]}`}
      className={`inline-flex shrink-0 items-center gap-1 rounded-md font-bold whitespace-nowrap ${chip} ${
        size === "xs" ? "px-1.5 py-0.5 text-[11.5px]" : "px-2 py-0.5 text-xs"
      }`}
    >
      <PriorityIcon priority={priority} className={size === "xs" ? "size-3.5" : "size-3.5"} />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
