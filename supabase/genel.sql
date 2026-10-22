-- =====================================================================
-- CoTask — "Genel" sayfası: projeden bağımsız ekip sohbeti
-- Mesajlar, mesajlara eklenen dokümanlar ve canlı güncelleme.
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) TABLOLAR
-- ---------------------------------------------------------------------

-- Sohbet mesajları. Sadece dosya paylaşılan mesajlarda metin boş olabilir.
create table if not exists public.general_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid default auth.uid() references public.profiles (id) on delete set null,
  content     text not null default '' check (char_length(content) <= 20000),
  created_at  timestamptz not null default now()
);

create index if not exists general_messages_created_at_idx on public.general_messages (created_at desc);
create index if not exists general_messages_user_id_idx on public.general_messages (user_id);

-- Mesajlara eklenen dosyalar (dosyanın kendisi 'general-files' bucket'ında)
create table if not exists public.general_files (
  id           uuid primary key default gen_random_uuid(),
  message_id   uuid not null references public.general_messages (id) on delete cascade,
  file_url     text not null,              -- bucket içindeki dosya yolu
  file_name    text not null,
  file_type    text,
  file_size    bigint,
  uploaded_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists general_files_message_id_idx on public.general_files (message_id);
create index if not exists general_files_uploaded_by_idx on public.general_files (uploaded_by);
create index if not exists general_files_created_at_idx on public.general_files (created_at desc);


-- ---------------------------------------------------------------------
-- 2) ROW LEVEL SECURITY
-- Herkes okur ve yazar; mesajı ve dosyasını sadece sahibi siler.
-- ---------------------------------------------------------------------

alter table public.general_messages enable row level security;
alter table public.general_files    enable row level security;

grant select, insert, delete on public.general_messages to authenticated;
grant select, insert, delete on public.general_files    to authenticated;

drop policy if exists "General messages read"   on public.general_messages;
drop policy if exists "General messages insert" on public.general_messages;
drop policy if exists "General messages delete" on public.general_messages;

create policy "General messages read" on public.general_messages
  for select to authenticated using (true);
create policy "General messages insert" on public.general_messages
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "General messages delete" on public.general_messages
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "General files read"   on public.general_files;
drop policy if exists "General files insert" on public.general_files;
drop policy if exists "General files delete" on public.general_files;

create policy "General files read" on public.general_files
  for select to authenticated using (true);
-- Dosya sadece kişinin kendi mesajına eklenebilir
create policy "General files insert" on public.general_files
  for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and exists (
      select 1 from public.general_messages m
      where m.id = message_id and m.user_id = (select auth.uid())
    )
  );
create policy "General files delete" on public.general_files
  for delete to authenticated using (uploaded_by = (select auth.uid()));


-- ---------------------------------------------------------------------
-- 3) DOSYA DEPOSU (özel bucket, en fazla 10 MB)
-- Görseller, PDF, Office dosyaları, metin/CSV ve ZIP.
-- HTML/SVG gibi tarayıcıda kod çalıştırabilen türler bilerek yok.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'general-files',
  'general-files',
  false,
  10485760,
  array[
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'application/zip'
  ]
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "general-files: authenticated read"   on storage.objects;
drop policy if exists "general-files: authenticated insert" on storage.objects;
drop policy if exists "general-files: authenticated delete" on storage.objects;

create policy "general-files: authenticated read" on storage.objects
  for select to authenticated using (bucket_id = 'general-files');
create policy "general-files: authenticated insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'general-files');
-- Dosyayı sadece yükleyen siler
create policy "general-files: authenticated delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'general-files' and owner_id = (select auth.uid())::text);


-- ---------------------------------------------------------------------
-- 4) CANLI GÜNCELLEME
-- ---------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['general_messages', 'general_files']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- Kontrol: 2 satır (general_files, general_messages) görmelisiniz
select tablename from pg_publication_tables
where pubname = 'supabase_realtime' and tablename like 'general_%'
order by tablename;
