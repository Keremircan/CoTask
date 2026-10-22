-- =====================================================================
-- CoTask — Silme yetkileri ve kaldırılan linkler
-- Kural: herkes kendi yorumunu/mesajını/dokümanını siler; Admin hepsini.
-- Linkler mesajın içinde olduğu için "silmek" = LİNKLER listesinden
-- kaldırmak (mesaj metnine dokunulmaz).
-- genel.sql'den SONRA, Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) GÖREV YORUMLARI: herkes okur/yazar; sahibi veya Admin siler
-- ---------------------------------------------------------------------

drop policy if exists "Authenticated full access" on public.task_comments;
drop policy if exists "Task comments read"   on public.task_comments;
drop policy if exists "Task comments insert" on public.task_comments;
drop policy if exists "Task comments delete" on public.task_comments;

create policy "Task comments read" on public.task_comments
  for select to authenticated using (true);
create policy "Task comments insert" on public.task_comments
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Task comments delete" on public.task_comments
  for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));


-- ---------------------------------------------------------------------
-- 2) GÖREV EKLERİ: yükleyen veya Admin siler
-- (Görev silinince ekler yabancı anahtar ile otomatik silinir.)
-- ---------------------------------------------------------------------

drop policy if exists "Authenticated full access" on public.task_attachments;
drop policy if exists "Task attachments read"   on public.task_attachments;
drop policy if exists "Task attachments insert" on public.task_attachments;
drop policy if exists "Task attachments delete" on public.task_attachments;

create policy "Task attachments read" on public.task_attachments
  for select to authenticated using (true);
create policy "Task attachments insert" on public.task_attachments
  for insert to authenticated with check (uploaded_by = (select auth.uid()));
create policy "Task attachments delete" on public.task_attachments
  for delete to authenticated
  using (uploaded_by = (select auth.uid()) or (select public.is_admin()));


-- ---------------------------------------------------------------------
-- 3) GENEL SOHBET: mesaj ve dosyayı sahibi veya Admin siler
-- ---------------------------------------------------------------------

drop policy if exists "General messages delete" on public.general_messages;
create policy "General messages delete" on public.general_messages
  for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "General files delete" on public.general_files;
create policy "General files delete" on public.general_files
  for delete to authenticated
  using (uploaded_by = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "general-files: authenticated delete" on storage.objects;
create policy "general-files: authenticated delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'general-files'
    and (owner_id = (select auth.uid())::text or (select public.is_admin()))
  );


-- ---------------------------------------------------------------------
-- 4) LİSTEDEN KALDIRILAN LİNKLER
-- scope: 'genel' (Genel sayfası) ya da görevin id'si
-- ---------------------------------------------------------------------

create table if not exists public.removed_links (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null check (char_length(scope) between 1 and 64),
  url         text not null check (char_length(url) between 1 and 2048),
  removed_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (scope, url)
);

create index if not exists removed_links_removed_by_idx on public.removed_links (removed_by);

alter table public.removed_links enable row level security;
grant select, insert on public.removed_links to authenticated;

-- Kimin kaldırabileceği (linki paylaşan ya da Admin) uygulamada kontrol edilir;
-- burada sadece kaldıran kişinin kendisi olması zorunlu tutulur.
drop policy if exists "Removed links read"   on public.removed_links;
drop policy if exists "Removed links insert" on public.removed_links;
create policy "Removed links read" on public.removed_links
  for select to authenticated using (true);
create policy "Removed links insert" on public.removed_links
  for insert to authenticated with check (removed_by = (select auth.uid()));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'removed_links'
  ) then
    alter publication supabase_realtime add table public.removed_links;
  end if;
end;
$$;

-- Kontrol: yeni politikalar (9 satır görmelisiniz)
select tablename, policyname from pg_policies
where policyname in (
  'Task comments read', 'Task comments insert', 'Task comments delete',
  'Task attachments read', 'Task attachments insert', 'Task attachments delete',
  'General messages delete', 'General files delete', 'Removed links insert'
)
order by tablename, policyname;
