import { initials } from "@/lib/tasks";

// Ada göre sabit bir renk seçer; aynı kişi her yerde aynı renkte görünür
const TONES = [
  "bg-teal-100 text-teal-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
];

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const tone = TONES[hash % TONES.length];

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${tone} ${
        size === "sm" ? "size-7 text-[11px]" : "size-10 text-sm"
      }`}
    >
      {initials(name)}
    </span>
  );
}
