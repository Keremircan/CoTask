-- =====================================================================
-- CoTask — Admin atama düzeltmesi
-- revize.sql yanlış e-postayla çalıştığı için Admin rolü kimseye atanmadı.
-- Bu dosyayı SQL Editor'de bir kez çalıştırın. Tekrar çalıştırılabilir.
-- =====================================================================

insert into public.member_roles (profile_id, role_id)
select p.id, r.id
from auth.users u
join public.profiles p on p.id = u.id
cross join public.roles r
where u.email = 'kerem@mail.com'
  and r.is_system and r.name = 'Admin'
on conflict do nothing;

-- Kontrol: Admin rolündeki kişiler (tek satır, Kerem Ercan olmalı)
select p.full_name, r.name as rol
from public.member_roles mr
join public.profiles p on p.id = mr.profile_id
join public.roles r on r.id = mr.role_id
where r.is_system;
