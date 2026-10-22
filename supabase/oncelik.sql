-- =====================================================================
-- CoTask — Görev önceliği: 5 seviye
--   none (Önceliksiz) · low (Düşük) · medium (Orta) · high (Yüksek) · urgent (Acil)
-- Varsayılan "Önceliksiz". Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir.
-- =====================================================================

alter table public.tasks drop constraint if exists tasks_priority_check;
alter table public.tasks
  add constraint tasks_priority_check
  check (priority in ('none', 'low', 'medium', 'high', 'urgent'));
alter table public.tasks alter column priority set default 'none';

-- Şimdiye kadar formda öncelik seçimi yoktu; tüm görevler kendiliğinden
-- "medium" kaydedildi. Bunlar kimsenin seçmediği değerler olduğu için
-- "Önceliksiz"e çevrilir. (Sadece bu dosya ilk kez çalıştırılırken anlamlı.)
do $$
begin
  if not exists (select 1 from public.tasks where priority = 'none') then
    -- Görev akışı kuralları (trigger) SQL Editor'de devre dışıdır (oturum yok)
    update public.tasks set priority = 'none' where priority = 'medium';
  end if;
end;
$$;

-- Kontrol: önceliklere göre görev sayısı
select priority, count(*) from public.tasks group by priority order by priority;
