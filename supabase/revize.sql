-- =====================================================================
-- CoTask — Revize: projeler, roller ve görev onay akışı
-- schema.sql ve storage.sql'den SONRA, Supabase SQL Editor'de çalıştırın.
-- Tekrar çalıştırılabilir.
--
-- Görev akışı:
--   pending (Onay Bekliyor) --kabul: atanan kişi--> in_progress (Yapılıyor)
--   in_progress --sadece sorumlu--> review (Kontrol)
--   in_progress | review --sadece atayan--> done (Tamamlandı)
--   assigned_to boş (null) = "Herkes": ilk kabul eden görevi üstlenir.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) PROJELER
-- ---------------------------------------------------------------------

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 1 and 80),
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create unique index if not exists projects_name_key on public.projects (lower(trim(name)));
create index if not exists projects_created_by_idx on public.projects (created_by);


-- ---------------------------------------------------------------------
-- 2) ROLLER
-- ---------------------------------------------------------------------

create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 1 and 40),
  is_system   boolean not null default false, -- Admin: değiştirilemez, silinemez
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create unique index if not exists roles_name_key on public.roles (lower(trim(name)));
create index if not exists roles_created_by_idx on public.roles (created_by);

create table if not exists public.member_roles (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  role_id     uuid not null references public.roles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (profile_id, role_id)
);

create index if not exists member_roles_role_id_idx on public.member_roles (role_id);

-- Giriş yapan kullanıcı Admin mi? (RLS politikalarında kullanılır)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.member_roles mr
    join public.roles r on r.id = mr.role_id
    where mr.profile_id = (select auth.uid())
      and r.is_system
      and r.name = 'Admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Sabit Admin rolü ve tek Admin: Kerem Ercan
insert into public.roles (name, is_system, created_by)
select 'Admin', true, null
where not exists (select 1 from public.roles where is_system and name = 'Admin');

insert into public.member_roles (profile_id, role_id)
select p.id, r.id
from auth.users u
join public.profiles p on p.id = u.id
cross join public.roles r
where u.email = 'kerem@mail.com'
  and r.is_system and r.name = 'Admin'
on conflict do nothing;

update public.profiles p
set full_name = 'Kerem Ercan'
from auth.users u
where u.id = p.id
  and u.email = 'kerem@mail.com'
  and coalesce(p.full_name, '') not ilike '%ercan%';


-- ---------------------------------------------------------------------
-- 3) GÖREVLER: proje bağlantısı ve yeni durumlar
-- ---------------------------------------------------------------------

alter table public.tasks
  add column if not exists project_id uuid references public.projects (id) on delete restrict;
alter table public.tasks
  add column if not exists accepted_at timestamptz;

create index if not exists tasks_project_id_idx on public.tasks (project_id);

alter table public.tasks drop constraint if exists tasks_status_check;
update public.tasks set status = 'pending' where status = 'todo';
alter table public.tasks
  add constraint tasks_status_check
  check (status in ('pending', 'in_progress', 'review', 'done'));
alter table public.tasks alter column status set default 'pending';


-- ---------------------------------------------------------------------
-- 4) GÖREV AKIŞI KURALLARI (arayüzü atlayan isteklere karşı da korur)
-- SQL Editor gibi oturumsuz bağlantılarda (auth.uid() boş) kurallar atlanır.
-- ---------------------------------------------------------------------

create or replace function public.enforce_task_workflow()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  is_creator boolean;
begin
  if uid is null then
    return new;
  end if;

  -- Yeni görev her zaman "Onay Bekliyor" olarak başlar
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.accepted_at := null;
    return new;
  end if;

  is_creator := old.created_by is not distinct from uid;

  if new.created_by is distinct from old.created_by then
    raise exception 'Görevi oluşturan kişi değiştirilemez.' using errcode = '42501';
  end if;

  -- Başlık, açıklama, proje vb. alanları sadece görevi atayan düzenler
  if (new.title, new.description, new.project_id, new.priority, new.due_date)
     is distinct from
     (old.title, old.description, old.project_id, old.priority, old.due_date)
     and not is_creator then
    raise exception 'Görevi sadece atayan kişi düzenleyebilir.' using errcode = '42501';
  end if;

  -- Sorumlu kişi değişikliği
  if new.assigned_to is distinct from old.assigned_to then
    if is_creator and new.status = old.status then
      -- Atayan kişi görevi başkasına devrederse görev yeniden onaya düşer
      if old.status = 'done' then
        raise exception 'Tamamlanan görevin sorumlusu değiştirilemez.' using errcode = '42501';
      end if;
      new.status := 'pending';
      new.accepted_at := null;
      return new;
    elsif old.assigned_to is null
      and new.assigned_to = uid
      and old.status = 'pending'
      and new.status = 'in_progress' then
      null; -- "Herkes"e atanmış görevi üstlenme; durum kontrolü aşağıda
    else
      raise exception 'Görevin sorumlusunu sadece atayan kişi değiştirebilir.' using errcode = '42501';
    end if;
  end if;

  -- Durum geçişleri
  if new.status is distinct from old.status then
    if old.status = 'pending' and new.status = 'in_progress' then
      if new.assigned_to is distinct from uid then
        raise exception 'Görevi sadece atanan kişi kabul edebilir.' using errcode = '42501';
      end if;
      new.accepted_at := now();
    elsif old.status = 'in_progress' and new.status = 'review' then
      if old.assigned_to is distinct from uid then
        raise exception 'Görevi sadece sorumlusu kontrole gönderebilir.' using errcode = '42501';
      end if;
    elsif old.status in ('in_progress', 'review') and new.status = 'done' then
      if not is_creator then
        raise exception 'Görevi sadece atayan kişi tamamlayabilir.' using errcode = '42501';
      end if;
    else
      raise exception 'Bu durum değişikliğine izin verilmiyor.' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_enforce_workflow on public.tasks;
create trigger tasks_enforce_workflow
  before insert or update on public.tasks
  for each row execute function public.enforce_task_workflow();


-- ---------------------------------------------------------------------
-- 5) ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table public.projects     enable row level security;
alter table public.roles        enable row level security;
alter table public.member_roles enable row level security;

grant select, insert, update, delete on public.projects     to authenticated;
grant select, insert, update, delete on public.roles        to authenticated;
grant select, insert, update, delete on public.member_roles to authenticated;

-- Projeler: herkes görür ve oluşturur; oluşturan ya da Admin düzenler/siler
drop policy if exists "Projects read"   on public.projects;
drop policy if exists "Projects insert" on public.projects;
drop policy if exists "Projects update" on public.projects;
drop policy if exists "Projects delete" on public.projects;

create policy "Projects read" on public.projects
  for select to authenticated using (true);
create policy "Projects insert" on public.projects
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "Projects update" on public.projects
  for update to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()))
  with check (created_by = (select auth.uid()) or (select public.is_admin()));
create policy "Projects delete" on public.projects
  for delete to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()));

-- Görevler: herkes görür; oluşturan kendisi olmalı; kurallar trigger'da;
-- sadece atayan siler
drop policy if exists "Authenticated full access" on public.tasks;
drop policy if exists "Tasks read"   on public.tasks;
drop policy if exists "Tasks insert" on public.tasks;
drop policy if exists "Tasks update" on public.tasks;
drop policy if exists "Tasks delete" on public.tasks;

create policy "Tasks read" on public.tasks
  for select to authenticated using (true);
create policy "Tasks insert" on public.tasks
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "Tasks update" on public.tasks
  for update to authenticated using (true) with check (true);
create policy "Tasks delete" on public.tasks
  for delete to authenticated using (created_by = (select auth.uid()));

-- Roller: herkes görür; sadece Admin oluşturur/siler; Admin rolüne dokunulamaz
drop policy if exists "Roles read"   on public.roles;
drop policy if exists "Roles insert" on public.roles;
drop policy if exists "Roles update" on public.roles;
drop policy if exists "Roles delete" on public.roles;

create policy "Roles read" on public.roles
  for select to authenticated using (true);
create policy "Roles insert" on public.roles
  for insert to authenticated
  with check ((select public.is_admin()) and not is_system);
create policy "Roles update" on public.roles
  for update to authenticated
  using ((select public.is_admin()) and not is_system)
  with check ((select public.is_admin()) and not is_system);
create policy "Roles delete" on public.roles
  for delete to authenticated
  using ((select public.is_admin()) and not is_system);

-- Rol atamaları: herkes görür; sadece Admin atar/kaldırır; Admin rolü sabittir
drop policy if exists "Member roles read"   on public.member_roles;
drop policy if exists "Member roles insert" on public.member_roles;
drop policy if exists "Member roles delete" on public.member_roles;

create policy "Member roles read" on public.member_roles
  for select to authenticated using (true);
create policy "Member roles insert" on public.member_roles
  for insert to authenticated
  with check (
    (select public.is_admin())
    and not exists (select 1 from public.roles r where r.id = role_id and r.is_system)
  );
create policy "Member roles delete" on public.member_roles
  for delete to authenticated
  using (
    (select public.is_admin())
    and not exists (select 1 from public.roles r where r.id = role_id and r.is_system)
  );
