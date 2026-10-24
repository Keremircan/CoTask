"use client";

import { useActionState, useState } from "react";
import { CircleAlert, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null, email: "" };

const labelClass = "mb-1.5 block text-[13px] font-medium text-slate-700";
const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-900 outline-none transition " +
  "placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:ring-3 focus:ring-teal-500/15 " +
  "disabled:opacity-60";
const iconClass = "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className={labelClass}>
          E-posta
        </label>
        <div className="relative">
          <Mail className={iconClass} />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            defaultValue={state.email}
            key={state.email}
            disabled={pending}
            placeholder="ornek@em3task.app"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Şifre
        </label>
        <div className="relative">
          <Lock className={iconClass} />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={pending}
            placeholder="••••••••"
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <p
        role="alert"
        aria-live="polite"
        className={
          state.error
            ? "flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700"
            : "sr-only"
        }
      >
        {state.error && <CircleAlert className="mt-0.5 size-4 shrink-0" />}
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
    </form>
  );
}
