-- =====================================================================
-- CoTask — 4. Aşama: görev ekleri için Storage
-- Supabase SQL Editor'e yapıştırıp çalıştırın. Tekrar çalıştırılabilir.
-- Bucket zaten varsa sadece ayarlarını günceller.
-- =====================================================================

-- Özel (private) bucket: dosyalara sadece giriş yapmış ekip erişir.
-- Uygulama dosyaları süreli imzalı linklerle (signed URL) gösterir.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-attachments',
  'task-attachments',
  false,
  10485760, -- 10 MB
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Giriş yapmış herkes bu bucket'ta okuyup yazabilir (P2P, eşit yetki)
drop policy if exists "task-attachments: authenticated read"   on storage.objects;
drop policy if exists "task-attachments: authenticated insert" on storage.objects;
drop policy if exists "task-attachments: authenticated update" on storage.objects;
drop policy if exists "task-attachments: authenticated delete" on storage.objects;

create policy "task-attachments: authenticated read" on storage.objects
  for select to authenticated
  using (bucket_id = 'task-attachments');

create policy "task-attachments: authenticated insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'task-attachments');

create policy "task-attachments: authenticated update" on storage.objects
  for update to authenticated
  using (bucket_id = 'task-attachments')
  with check (bucket_id = 'task-attachments');

create policy "task-attachments: authenticated delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'task-attachments');
