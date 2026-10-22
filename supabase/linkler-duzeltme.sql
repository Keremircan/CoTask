-- =====================================================================
-- CoTask — Kaldırılan link yeniden paylaşılınca listeye geri dönsün
-- Kaldırma artık sadece o ana kadarki paylaşımları kapsar (zamana göre).
-- Aynı link tekrar kaldırılırsa kaldırılma zamanı güncellenebilsin diye
-- güncelleme izni eklenir. silme.sql'den SONRA çalıştırın. Tekrar çalıştırılabilir.
-- =====================================================================

grant update on public.removed_links to authenticated;

drop policy if exists "Removed links update" on public.removed_links;
create policy "Removed links update" on public.removed_links
  for update to authenticated
  using (true)
  with check (removed_by = (select auth.uid()));

-- Kontrol: 1 satır görmelisiniz
select policyname from pg_policies
where tablename = 'removed_links' and policyname = 'Removed links update';
