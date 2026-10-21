-- =====================================================================
-- CoTask — Canlı güncellemeler (Supabase Realtime)
-- Tabloları Realtime yayınına ekler; böylece bir ekip üyesinin yaptığı
-- değişiklik sayfa yenilenmeden diğerlerinin ekranına düşer.
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir.
-- Not: Olaylar RLS'ye tabidir; sadece giriş yapmış ekip üyeleri alır.
-- =====================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'tasks', 'task_comments', 'task_attachments',
    'projects', 'profiles', 'roles', 'member_roles'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- Kontrol: yayındaki tablolar (7 satır görmelisiniz)
select tablename
from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public'
order by tablename;
