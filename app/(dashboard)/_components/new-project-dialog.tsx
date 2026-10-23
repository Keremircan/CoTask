"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Plus } from "lucide-react";
import { createProject, renameProject } from "@/actions/projects";
import { Modal } from "@/components/ui/modal";
import { field, fieldLabel, ghostButton, primaryButton } from "@/components/ui/styles";

// Yeni proje oluşturma ve mevcut projeyi yeniden adlandırma penceresi
export function NewProjectDialog({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project?: { id: string; name: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const renaming = Boolean(project);

  function close() {
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="sm"
      title={renaming ? "Projeyi yeniden adlandır" : "Yeni proje"}
      description={
        renaming ? undefined : "Projeye bir ad verin; görevleri bu proje altında toplayacaksınız."
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const name = String(new FormData(e.currentTarget).get("name") ?? "");
          setError(null);
          startTransition(async () => {
            const result = project
              ? await renameProject(project.id, name)
              : await createProject(name);
            if (result.error) {
              setError(result.error);
              return;
            }
            close();
            if (!project && result.projectId) router.push(`/projeler/${result.projectId}`);
          });
        }}
      >
        <label htmlFor="project-name" className={fieldLabel}>
          Proje adı
        </label>
        <input
          id="project-name"
          name="name"
          required
          maxLength={80}
          autoFocus
          defaultValue={project?.name}
          disabled={pending}
          placeholder="Örn. E-Evrak Sistemi"
          className={`${field} h-10`}
        />
        {error && (
          <p
            role="alert"
            className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
          >
            <CircleAlert className="size-4 shrink-0" /> {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2.5">
          <button type="button" onClick={close} className={ghostButton}>
            Vazgeç
          </button>
          <button type="submit" disabled={pending} className={`${primaryButton} h-9 px-4 text-sm`}>
            {!renaming && <Plus className="size-4.5" strokeWidth={2.4} />}
            {pending ? "Kaydediliyor…" : renaming ? "Kaydet" : "Oluştur"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
