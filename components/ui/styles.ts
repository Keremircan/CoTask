// Panodaki ortak Tailwind sınıfları (tasarım dili tek yerde)

export const card =
  "rounded-xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

export const primaryButton =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-teal-600 px-3.5 " +
  "text-sm font-semibold text-white shadow-sm transition " +
  "hover:bg-teal-700 active:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButton =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-teal-50 px-3.5 " +
  "text-sm font-semibold text-teal-800 transition hover:bg-teal-100";

// Listelerdeki satır içi butonlar (Düzenle, Tamamlandı, Sil, Kabul Et…)
const smallBase =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition " +
  "disabled:cursor-not-allowed disabled:opacity-45";

export const smallPrimaryButton = `${smallBase} bg-teal-600 text-white hover:bg-teal-700`;
export const smallSecondaryButton = `${smallBase} bg-teal-50 text-teal-800 hover:bg-teal-100`;
export const smallGhostButton = `${smallBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
export const smallDangerButton = `${smallBase} border border-rose-200 bg-white text-rose-600 hover:bg-rose-50`;

export const ghostButton =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 " +
  "text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

export const dangerButton =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-rose-600 px-3.5 " +
  "text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60";

export const fieldLabel = "block text-[13px] font-semibold text-slate-700";

export const field =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition " +
  "placeholder:text-slate-400 focus:border-teal-500 focus:ring-3 focus:ring-teal-500/15 " +
  "disabled:opacity-60";
