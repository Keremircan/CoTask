-- =====================================================================
-- CoTask — 1. Aşama veritabanı şeması
-- Supabase SQL Editor'e yapıştırıp tek seferde çalıştırın.
-- Betik tekrar çalıştırılabilir (mevcut nesneleri bozmaz).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) TABLOLAR
-- ---------------------------------------------------------------------

-- Profiller: her auth kullanıcısı için bir satır
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Görevler
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(trim(title)) > 0),
  description  text,
  status       text not null default 'todo'
               check (status in ('todo', 'in_progress', 'review', 'done')),
  priority     text not null default 'medium'
               check (priority in ('low', 'medium', 'high', 'urgent')),
  assigned_to  uuid references public.profiles (id) on delete set null,
  created_by   uuid default auth.uid() references public.profiles (id) on delete set null,
  due_date     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Görev yorumları
create table if not exists public.task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  user_id     uuid default auth.uid() references public.profiles (id) on delete set null,
  content     text not null check (char_length(trim(content)) > 0),
  created_at  timestamptz not null default now()
);

-- Görev ekleri (dosyanın kendisi Supabase Storage'da durur)
create table if not exists public.task_attachments (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks (id) on delete cascade,
  file_url     text not null,
  file_name    text not null,
  file_type    text,
  uploaded_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 2) İNDEKSLER (yabancı anahtarlar ve sık filtrelenen alanlar)
-- ---------------------------------------------------------------------

create index if not exists tasks_assigned_to_idx        on public.tasks (assigned_to);
create index if not exists tasks_created_by_idx         on public.tasks (created_by);
create index if not exists tasks_status_idx             on public.tasks (status);
create index if not exists task_comments_task_id_idx    on public.task_comments (task_id);
create index if not exists task_comments_user_id_idx    on public.task_comments (user_id);
create index if not exists task_attachments_task_id_idx on public.task_attachments (task_id);
create index if not exists task_attachments_uploaded_by_idx on public.task_attachments (uploaded_by);


-- ---------------------------------------------------------------------
-- 3) updated_at'i otomatik güncelleyen trigger
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 4) Yeni auth kullanıcısı -> otomatik profil kaydı
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger kurulmadan önce açılmış kullanıcılar varsa onların profillerini de oluştur
insert into public.profiles (id, full_name, avatar_url)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- 5) ROW LEVEL SECURITY
-- Sadece giriş yapmış kullanıcılar her şeyi okuyup yazabilir.
-- (`to authenticated` = auth.role() = 'authenticated' ile aynı etki)
-- ---------------------------------------------------------------------

alter table public.profiles         enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_comments    enable row level security;
alter table public.task_attachments enable row level security;

-- Data API erişimi için açık yetkiler (anon'a hiçbir şey verilmez)
grant select, insert, update, delete on public.profiles         to authenticated;
grant select, insert, update, delete on public.tasks            to authenticated;
grant select, insert, update, delete on public.task_comments    to authenticated;
grant select, insert, update, delete on public.task_attachments to authenticated;

drop policy if exists "Authenticated full access" on public.profiles;
create policy "Authenticated full access" on public.profiles
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access" on public.tasks;
create policy "Authenticated full access" on public.tasks
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access" on public.task_comments;
create policy "Authenticated full access" on public.task_comments
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated full access" on public.task_attachments;
create policy "Authenticated full access" on public.task_attachments
  for all to authenticated using (true) with check (true);
