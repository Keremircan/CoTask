-- =====================================================================
-- CoTask — Revize akışı
--   Kontrol aşamasındaki görev, atayan kişi "Revize Ver" deyince tekrar
--   "Yapılıyor"a döner; görevi alan kişi düzeltip yeniden kontrole gönderir.
--   tasks.revision_count: görevin kaç kez revize edildiği (kartlarda gösterilir).
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir.
-- =====================================================================

alter table public.tasks
  add column if not exists revision_count integer not null default 0;

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
    new.revision_count := 0;
    return new;
  end if;

  -- Revize sayacı elle değiştirilemez; sadece "Revize Ver" geçişinde artar
  new.revision_count := old.revision_count;

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
    elsif old.status = 'review' and new.status = 'in_progress' then
      -- Revize Ver: kontroldeki görev, atayan kişi tarafından "Yapılıyor"a geri döner
      if not is_creator then
        raise exception 'Revizeyi sadece görevi atayan kişi verebilir.' using errcode = '42501';
      end if;
      new.revision_count := old.revision_count + 1;
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

-- Kontrol: sütun eklendi mi?
select count(*) as gorev, max(revision_count) as en_cok_revize from public.tasks;
