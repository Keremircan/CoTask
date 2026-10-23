-- =====================================================================
-- CoTask — Kişisel yapılacaklar listesi (sadece sahibi görür)
--   Her madde bir kullanıcıya aittir. RLS: tüm işlemler yalnızca
--   user_id = auth.uid() için geçerli. Uygulamadaki Admin rolü dahil
--   kimse başkasının listesini göremez veya değiştiremez.
--   category: serbest başlık ya da seçilen proje adı; boş (null) = başlıksız.
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir.
-- =====================================================================

create table if not exists public.personal_todos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid()
               references auth.users (id) on delete cascade,
  title        text not null,
  category     text,
  is_completed boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint personal_todos_title_check
    check (char_length(btrim(title)) between 1 and 1000),
  constraint personal_todos_category_check
    check (category is null or char_length(btrim(category)) between 1 and 80)
);

create index if not exists personal_todos_user_created_idx
  on public.personal_todos (user_id, created_at);

alter table public.personal_todos enable row level security;

-- Oturumsuz (anon) erişim yok; oturumlu kullanıcı sadece kendi satırları
revoke all on public.personal_todos from anon;
grant select, insert, update, delete on public.personal_todos to authenticated;

drop policy if exists "Personal todos select" on public.personal_todos;
drop policy if exists "Personal todos insert" on public.personal_todos;
drop policy if exists "Personal todos update" on public.personal_todos;
drop policy if exists "Personal todos delete" on public.personal_todos;

create policy "Personal todos select" on public.personal_todos
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Personal todos insert" on public.personal_todos
  for insert to authenticated with check (user_id = (select auth.uid()));
-- with check: madde başka bir kullanıcıya devredilemez
create policy "Personal todos update" on public.personal_todos
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Personal todos delete" on public.personal_todos
  for delete to authenticated using (user_id = (select auth.uid()));

-- Not: Bu tablo bilerek Realtime yayınına eklenmez; değişiklikler kimseye yayınlanmaz.

-- Kontrol: RLS açık mı, kaç politika var?
select relrowsecurity as rls_acik,
       (select count(*) from pg_policies where tablename = 'personal_todos') as politika
from pg_class where oid = 'public.personal_todos'::regclass;
