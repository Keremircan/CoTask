-- =====================================================================
-- CoTask — Üye ekleme/çıkarma yetkisi ayarı
--   app_settings: uygulama genelindeki küçük ayarlar (anahtar → JSON değer).
--   member_management_permission.allow_all_members:
--     false (varsayılan) → sadece Admin üye ekler/çıkarır
--     true               → tüm ekip üyeleri ekler/çıkarır
--   Herkes okur; sadece Admin değiştirir. Hesap oluşturma/silme işlemi
--   sunucuda (service role ile) yapılır ve bu ayarı orada da kontrol eder.
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir.
-- =====================================================================

create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

revoke all on public.app_settings from anon;
grant select, update on public.app_settings to authenticated;

drop policy if exists "App settings read"   on public.app_settings;
drop policy if exists "App settings update" on public.app_settings;

create policy "App settings read" on public.app_settings
  for select to authenticated using (true);
create policy "App settings update" on public.app_settings
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
-- Ekleme/silme politikası yok: ayar satırları sadece bu dosyayla oluşturulur.

-- Güncellenme zamanı otomatik
create or replace function public.touch_app_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists app_settings_touch on public.app_settings;
create trigger app_settings_touch
  before update on public.app_settings
  for each row execute function public.touch_app_settings();

-- Varsayılan: sadece Admin üye ekleyip çıkarabilir (mevcut değer korunur)
insert into public.app_settings (key, value)
values ('member_management_permission', '{"allow_all_members": false}'::jsonb)
on conflict (key) do nothing;

-- Kontrol
select key, value, updated_at from public.app_settings;
