-- =====================================================================
-- CoTask — Telefon/tarayıcı bildirimleri (Web Push) abonelikleri
--   Her satır bir cihazdaki bir tarayıcıdır. Kullanıcı sadece kendi
--   aboneliklerini görür, ekler ve siler. Bildirim gönderimi sunucuda
--   service role ile yapılır (başkasının aboneliğini sadece sunucu okur).
--   Üye çıkarılınca abonelikleri de silinir (on delete cascade).
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir.
-- =====================================================================

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint   text not null unique check (endpoint ~ '^https://' and length(endpoint) <= 1000),
  p256dh     text not null check (length(p256dh) <= 200),
  auth       text not null check (length(auth) <= 100),
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

revoke all on public.push_subscriptions from anon;
grant select, insert, delete on public.push_subscriptions to authenticated;

drop policy if exists "Push subscriptions read own"   on public.push_subscriptions;
drop policy if exists "Push subscriptions insert own" on public.push_subscriptions;
drop policy if exists "Push subscriptions delete own" on public.push_subscriptions;

create policy "Push subscriptions read own" on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Push subscriptions insert own" on public.push_subscriptions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Push subscriptions delete own" on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));

-- Kontrol
select policyname, cmd from pg_policies where tablename = 'push_subscriptions' order by policyname;
