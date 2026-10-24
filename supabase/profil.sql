-- =====================================================================
-- CoTask — Profil sayfası
--   1) Profiller: herkes görür, herkes SADECE KENDİ profilini değiştirir.
--      (Önceki kural her üyenin başkasının adını/fotoğrafını değiştirmesine
--      izin veriyordu.) Profil oluşturma/silme veritabanı tetikleyicisi ve
--      sunucu (service role) tarafından yapılır.
--   2) 'avatars' deposu: profil fotoğrafları. Her üye sadece kendi klasörüne
--      (<kullanıcı-id>/...) yükler ve oradan siler. Fotoğraflar ekipte her
--      yerde gösterilebilsin diye depo herkese açık okunur; dosya adları
--      tahmin edilemez (rastgele) olduğu için liste çıkarılamaz.
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir.
-- =====================================================================

-- 1) Profil kuralları
drop policy if exists "Authenticated full access" on public.profiles;
drop policy if exists "Profiles read"       on public.profiles;
drop policy if exists "Profiles update own" on public.profiles;

revoke insert, delete on public.profiles from authenticated;
grant select, update on public.profiles to authenticated;

create policy "Profiles read" on public.profiles
  for select to authenticated using (true);
create policy "Profiles update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Fotoğraf adresi sadece bizim depomuzdan olabilir
alter table public.profiles drop constraint if exists profiles_avatar_url_check;
alter table public.profiles add constraint profiles_avatar_url_check
  check (avatar_url is null or (avatar_url ~ '^https://' and length(avatar_url) <= 500));

-- 2) Profil fotoğrafı deposu (2 MB, sadece resim)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatars insert own" on storage.objects;
drop policy if exists "Avatars delete own" on storage.objects;

create policy "Avatars insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Avatars delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Kontrol
select policyname, cmd from pg_policies where tablename = 'profiles' order by policyname;
