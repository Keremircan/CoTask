import { Suspense } from "react";
import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { dayKey, formatDate, formatDateTime, formatTime } from "@/lib/format";
import { extractLinks } from "@/lib/links";
import { kindOfMime } from "@/lib/general-files";
import { Markdown } from "@/components/markdown/markdown";
import { Avatar } from "@/components/ui/avatar";
import { card } from "@/components/ui/styles";
import { TaskLinks } from "@/components/tasks/task-links";
import { ChatScroller } from "@/components/general/chat-scroller";
import { MessageComposer } from "@/components/general/message-composer";
import { DeleteMessageButton } from "@/components/general/delete-message-button";
import {
  downloadUrl,
  GeneralDocuments,
  KIND_UI,
  viewUrl,
  type GeneralDocument,
} from "@/components/general/general-documents";
import { PageHeader } from "../_components/page-header";

export const metadata: Metadata = { title: "Genel · CoTask" };

// Sohbette gösterilen son mesaj sayısı
const MESSAGE_LIMIT = 300;
// Aynı kişinin bu süre içindeki ardışık mesajları tek blokta gösterilir
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export default function GeneralPage() {
  return (
    <>
      <PageHeader
        title="Genel"
        description="Projeden bağımsız ekip sohbeti; paylaşılan linkler ve dokümanlar sağda toplanır."
      />
      <Suspense fallback={<GeneralSkeleton />}>
        <General />
      </Suspense>
    </>
  );
}

async function General() {
  const supabase = await createClient();

  // Kullanıcı, mesajlar ve tüm dokümanlar aynı turda, paralel çekilir
  const [user, messagesRes, filesRes] = await Promise.all([
    getCurrentUser(),
    supabase
      .from("general_messages")
      .select("id, user_id, content, created_at, author:profiles!general_messages_user_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(MESSAGE_LIMIT),
    supabase
      .from("general_files")
      .select(
        "id, message_id, file_name, file_type, file_size, created_at, uploader:profiles!general_files_uploaded_by_fkey(full_name)",
      )
      .order("created_at", { ascending: false }),
  ]);

  const setupMissing = Boolean(messagesRes.error || filesRes.error);
  const messages = [...(messagesRes.data ?? [])].reverse(); // eskiden yeniye
  const files = filesRes.data ?? [];

  const documents: GeneralDocument[] = files.map((f) => ({
    id: f.id,
    file_name: f.file_name,
    file_type: f.file_type,
    file_size: f.file_size,
    created_at: f.created_at,
    uploaderName: f.uploader?.full_name ?? "Eski üye",
  }));
  const filesByMessage = new Map<string, GeneralDocument[]>();
  files.forEach((f, i) => {
    const list = filesByMessage.get(f.message_id) ?? [];
    list.unshift(documents[i]); // mesaj içinde yükleme sırasıyla
    filesByMessage.set(f.message_id, list);
  });

  // En yeni link en üstte
  const links = extractLinks(
    [...messages].reverse().map((m) => ({
      text: m.content,
      source: `${m.author?.full_name ?? "Eski üye"} · ${formatDate(m.created_at)}`,
    })),
  );

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section
        className={`${card} flex h-[calc(100dvh-14rem)] min-h-[460px] flex-col overflow-hidden`}
        aria-label="Ekip sohbeti"
      >
        <ChatScroller messageCount={messages.length}>
          {setupMissing ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Genel sayfası için veritabanı kurulumu eksik: supabase/genel.sql dosyasını
              Supabase SQL Editor&apos;de çalıştırın.
            </p>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                <MessagesSquare className="size-6" />
              </div>
              <p className="mt-4 font-bold text-slate-900">Sohbet henüz sessiz</p>
              <p className="mt-1 text-[15px]">İlk mesajı yazın; link ve doküman da paylaşabilirsiniz.</p>
            </div>
          ) : (
            <ol className="space-y-1">
              {messages.map((m, i) => {
                const prev = messages[i - 1];
                const newDay = !prev || dayKey(prev.created_at) !== dayKey(m.created_at);
                const grouped =
                  !newDay &&
                  prev.user_id === m.user_id &&
                  new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() <
                    GROUP_WINDOW_MS;
                const name = m.author?.full_name ?? "Eski üye";
                const attached = filesByMessage.get(m.id) ?? [];
                return (
                  <li key={m.id}>
                    {newDay && (
                      <div className="my-4 flex items-center gap-3 text-xs font-medium text-slate-400">
                        <span className="h-px flex-1 bg-slate-100" />
                        {formatDate(m.created_at)}
                        <span className="h-px flex-1 bg-slate-100" />
                      </div>
                    )}
                    <div className={`group flex gap-3 rounded-xl px-2 py-1 hover:bg-slate-50/80 ${grouped ? "" : "mt-3"}`}>
                      <div className="w-8 shrink-0">
                        {!grouped && <Avatar name={name} size="sm" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        {!grouped && (
                          <p className="flex items-baseline gap-2">
                            <span className="text-[14.5px] font-bold text-slate-900">{name}</span>
                            <time dateTime={m.created_at} title={formatDateTime(m.created_at)} className="text-xs text-slate-400">
                              {formatTime(m.created_at)}
                            </time>
                          </p>
                        )}
                        {m.content && (
                          <div className="text-[15px] [&_.markdown]:text-[15px]">
                            <Markdown>{m.content}</Markdown>
                          </div>
                        )}
                        {attached.length > 0 && <MessageFiles files={attached} />}
                      </div>
                      {m.user_id === user.id && (
                        <div className="shrink-0 self-start pt-0.5">
                          <DeleteMessageButton messageId={m.id} />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </ChatScroller>
        <MessageComposer authorName={user.name} />
      </section>

      <aside className="space-y-6 xl:sticky xl:top-8">
        <TaskLinks
          links={links}
          title="LİNKLER"
          emptyText="Sohbette paylaşılan linkler burada otomatik listelenir."
        />
        <GeneralDocuments documents={documents} />
      </aside>
    </div>
  );
}

// Mesajın altında: görseller küçük önizleme, diğer dosyalar kart olarak
function MessageFiles({ files }: { files: GeneralDocument[] }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-2">
      {files.map((f) => {
        const kind = kindOfMime(f.file_type);
        if (kind === "image") {
          return (
            <a
              key={f.id}
              href={viewUrl(f.id)}
              target="_blank"
              rel="noopener noreferrer"
              title={f.file_name}
              className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- süreli Storage linki */}
              <img src={viewUrl(f.id)} alt={f.file_name} loading="lazy" className="max-h-56 max-w-72 object-cover" />
            </a>
          );
        }
        const { icon: Icon, tone } = KIND_UI[kind];
        return (
          <a
            key={f.id}
            href={downloadUrl(f.id)}
            className="flex max-w-72 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 transition hover:border-teal-200 hover:bg-teal-50/40"
          >
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 truncate text-sm font-bold text-slate-800">{f.file_name}</span>
          </a>
        );
      })}
    </div>
  );
}

function GeneralSkeleton() {
  return (
    <div className="grid animate-pulse gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className={`${card} h-[calc(100dvh-14rem)] min-h-[460px]`} />
      <div className="space-y-6">
        <div className={`${card} h-40`} />
        <div className={`${card} h-40`} />
      </div>
    </div>
  );
}
