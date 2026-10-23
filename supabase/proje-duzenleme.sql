-- =====================================================================
-- CoTask — Proje düzenleme ve silme tüm ekibe açık
--   Proje adını, linkini değiştirmek ve projeyi silmek oturum açmış her
--   ekip üyesine açıktır. İçinde görev olan proje yine silinemez
--   (görevlerin proje bağı "on delete restrict").
--   Oluşturan kişi (created_by) ve oluşturulma zamanı değiştirilemez.
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir.
-- =====================================================================

drop policy if exists "Projects update" on public.projects;
create policy "Projects update" on public.projects
  for update to authenticated using (true) with check (true);

drop policy if exists "Projects delete" on public.projects;
create policy "Projects delete" on public.projects
  for delete to authenticated using (true);

create or replace function public.keep_project_creator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- SQL Editor gibi oturumsuz bağlantılarda (auth.uid() boş) kural atlanır
  if auth.uid() is not null then
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists projects_keep_creator on public.projects;
create trigger projects_keep_creator
  before update on public.projects
  for each row execute function public.keep_project_creator();

-- Kontrol: güncelleme politikası
select policyname, cmd, qual from pg_policies
where tablename = 'projects' order by policyname;
