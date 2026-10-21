"use client";

import { useState, useTransition } from "react";
import { CircleAlert, MessageSquare } from "lucide-react";
import { addComment } from "@/actions/task-details";
import { field, primaryButton } from "@/components/ui/styles";

export function CommentForm({ taskId }: { taskId: string }) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!content.trim() || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await addComment(taskId, content);
      if (result.error) setError(result.error);
      else setContent("");
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-3"
    >
      <label htmlFor="comment" className="sr-only">
        Yorum
      </label>
      <textarea
        id="comment"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          // Ctrl/Cmd + Enter ile gönder
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submit();
          }
        }}
        rows={4}
        disabled={pending}
        placeholder={"Yorumunuzu yazın… Kod paylaşmak için:\n```ts\nconst x = 1;\n```"}
        className={`${field} mt-0 resize-y py-3.5 font-[inherit]`}
      />

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[15px] text-rose-700"
        >
          <CircleAlert className="size-4 shrink-0" /> {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Markdown desteklenir · Göndermek için Ctrl + Enter
        </p>
        <button
          type="submit"
          disabled={pending || !content.trim()}
          className={primaryButton}
        >
          <MessageSquare className="size-5" strokeWidth={2.4} />
          {pending ? "Gönderiliyor…" : "Yorum Yap"}
        </button>
      </div>
    </form>
  );
}
