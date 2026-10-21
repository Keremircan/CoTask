// Panodaki ortak Tailwind sınıfları (tasarım dili tek yerde)

export const card =
  "rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-12px_rgba(15,23,42,0.10)]";

export const primaryButton =
  "inline-flex h-13 items-center justify-center gap-2.5 rounded-xl bg-linear-to-br from-[#46bba2] to-[#2a8577] px-6 " +
  "text-[17px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(42,133,119,0.6)] transition " +
  "hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButton =
  "inline-flex h-13 items-center justify-center gap-2.5 rounded-xl bg-teal-50 px-6 " +
  "text-[17px] font-bold text-teal-800 transition hover:bg-teal-100";

// Listelerdeki satır içi butonlar (Düzenle, Tamamlandı, Sil, Kabul Et…)
const smallBase =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold transition " +
  "disabled:cursor-not-allowed disabled:opacity-45";

export const smallPrimaryButton = `${smallBase} bg-teal-600 text-white hover:bg-teal-700`;
export const smallSecondaryButton = `${smallBase} bg-teal-50 text-teal-800 hover:bg-teal-100`;
export const smallGhostButton = `${smallBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
export const smallDangerButton = `${smallBase} border border-rose-200 bg-white text-rose-600 hover:bg-rose-50`;

export const ghostButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 " +
  "text-[15px] font-bold text-slate-700 transition hover:bg-slate-50";

export const dangerButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 " +
  "text-[15px] font-bold text-white transition hover:bg-rose-700 disabled:opacity-60";

export const fieldLabel = "block text-[15px] font-bold text-slate-900";

export const field =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-[16px] text-slate-900 outline-none transition " +
  "placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 " +
  "disabled:opacity-60";
