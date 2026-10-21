import { MessagesSquare } from "lucide-react";
import { Markdown } from "@/components/markdown/markdown";
import { Avatar } from "@/components/ui/avatar";
import { card } from "@/components/ui/styles";
import { formatDateTime } from "@/lib/format";
import { CommentForm } from "./comment-form";

export type TaskComment = {
  id: string;
  content: string;
  created_at: string;
  author: { full_name: string | null } | null;
};

export function TaskComments({
  taskId,
  comments,
  currentUserName,
}: {
  taskId: string;
  comments: TaskComment[];
  currentUserName: string;
}) {
  return (
    <section className={`${card} p-6 sm:p-7`}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[20px] font-bold text-slate-900">
          Yorumlar ve tartışma
        </h2>
        <span className="text-[15px] text-slate-500">
          {comments.length} yorum
        </span>
      </div>

      {comments.length === 0 ? (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 px-5 py-6 text-slate-500">
          <MessagesSquare className="size-5 shrink-0 text-slate-400" />
          Henüz yorum yok. İlk yorumu sen yaz.
        </div>
      ) : (
        <ol className="mb-6 space-y-5">
          {comments.map((comment) => {
            const name = comment.author?.full_name || "Eski üye";
            return (
              <li key={comment.id} className="flex gap-3.5">
                <Avatar name={name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5">
                    <span className="font-bold text-slate-900">{name}</span>
                    <time
                      dateTime={comment.created_at}
                      className="text-sm text-slate-400"
                    >
                      {formatDateTime(comment.created_at)}
                    </time>
                  </div>
                  <div className="mt-1.5 rounded-2xl rounded-tl-md bg-slate-50 px-4 py-3">
                    <Markdown>{comment.content}</Markdown>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <CommentForm taskId={taskId} authorName={currentUserName} />
    </section>
  );
}
