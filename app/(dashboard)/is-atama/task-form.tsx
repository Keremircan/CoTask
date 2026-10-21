"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, SendHorizontal } from "lucide-react";
import { createTask, type CreateTaskState } from "../actions";
import type { TeamMember } from "@/lib/team";
import { field, fieldLabel, primaryButton } from "../_components/ui";
import { SelectField } from "../_components/select-field";

const initialState: CreateTaskState = {
  status: "idle",
  message: null,
  submissionId: 0,
};

export function TaskForm({ members }: { members: TeamMember[] }) {
  const [state, formAction, pending] = useActionState(createTask, initialState);

  return (
    // key: başarılı kayıttan sonra form alanlarını sıfırlar
    <form key={state.submissionId} action={formAction} className="space-y-6">
      <div>
        <label htmlFor="title" className={fieldLabel}>
          İş başlığı
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          disabled={pending}
          placeholder="Örn. Haftalık rapor"
          className={`${field} h-14`}
        />
      </div>

      <div>
        <label htmlFor="description" className={fieldLabel}>
          İş açıklaması
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          disabled={pending}
          placeholder="Görevin detaylarını yazın"
          className={`${field} resize-y py-3.5`}
        />
      </div>

      <div>
        <label htmlFor="assigned_to" className={fieldLabel}>
          Sorumlu kişi
        </label>
        <SelectField
          id="assigned_to"
          name="assigned_to"
          required
          defaultValue=""
          disabled={pending}
        >
          <option value="" disabled>
            Seçiniz
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </SelectField>
      </div>

      {state.message && (
        <div
          role="status"
          className={
            state.status === "success"
              ? "flex items-center gap-2.5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-[15px] text-teal-800"
              : "flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[15px] text-rose-700"
          }
        >
          {state.status === "success" ? (
            <CircleCheck className="size-5 shrink-0" />
          ) : (
            <CircleAlert className="size-5 shrink-0" />
          )}
          <span>
            {state.message}
            {state.status === "success" && (
              <>
                {" "}
                <Link href="/is-takip" className="font-bold underline">
                  Takipte gör
                </Link>
              </>
            )}
          </span>
        </div>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        <SendHorizontal className="size-5" strokeWidth={2.4} />
        {pending ? "Atanıyor…" : "İş ata"}
      </button>
    </form>
  );
}
