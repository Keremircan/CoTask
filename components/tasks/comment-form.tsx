"use client";

import { useState, useTransition } from "react";
import { CircleAlert, LoaderCircle, MessageSquare } from "lucide-react";
import { addComment } from "@/actions/task-details";
import { Avatar } from "@/components/ui/avatar";
import { field, primaryButton } from "@/components/ui/styles";

export function CommentForm({
  taskId,
  authorName,
}: {
  taskId: string;
  authorName: string;
}) {
  const [content, setContent] = useState("");
  // Sunucu cevabını beklemeden gösterilen yorum (iyimser güncelleme)
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const text = content.trim();
    if (!text || pending) return;
    setError(null);
    setSending(text);
    setContent("");
    startTransition(async () => {
      const result = await addComment(taskId, text);
      if (result.error) {
        setError(result.error);
        setContent(text); // yazılanı kaybetme
      }
      // Başarılıysa sunucudan gelen asıl yorum aynı anda listeye düşer
      setSending(null);
    });
  }

  return (
    <>
      {sending && (
        <div className="mb-6 flex gap-3.5 opacity-70" aria-live="polite">
          <Avatar name={authorName} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-slate-900">{authorName}</span>
              <span className="inline-flex items-center gap-1 text-sm text-slate-400">
                <LoaderCircle className="size-3.5 animate-spin" /> Gönderiliyor…
              </span>
            </div>
            <div className="mt-1.5 rounded-2xl rounded-tl-md bg-slate-50 px-4 py-3 text-[16px] leading-relaxed whitespace-pre-wrap text-slate-700 [overflow-wrap:anywhere]">
              {sending}
            </div>
          </div>
        </div>
      )}

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
            Yorum Yap
          </button>
        </div>
      </form>
    </>
  );
}
