-- =====================================================================
-- CoTask — Proje linki (isteğe bağlı)
--   Proje oluşturulurken / düzenlenirken girilen link; proje sayfasında
--   proje adının yanında gösterilir. Sadece http(s) adresleri kabul edilir.
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir.
-- =====================================================================

alter table public.projects add column if not exists url text;

alter table public.projects drop constraint if exists projects_url_check;
alter table public.projects
  add constraint projects_url_check
  check (url is null or (url ~* '^https?://' and char_length(url) <= 2048));

-- Kontrol
select count(*) as proje, count(url) as linkli from public.projects;
