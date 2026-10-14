-- FASE 1 / PASO 2: DRY-RUN (solo SELECT, no modifica nada)
-- Muestra exactamente las filas que cambiarian en los puntos 3, 4 y 5.

-- PUNTO 3: profiles.identity_verified / identity_verified_at
with latest as (
  select distinct on (user_id) user_id, status, verified_at
  from identity_verifications
  order by user_id, created_at desc
)
select p.id, p.email,
       p.identity_verified as identity_verified_actual, true as identity_verified_nuevo,
       p.identity_verified_at as at_actual, coalesce(p.identity_verified_at, l.verified_at) as at_nuevo
from latest l
join profiles p on p.id = l.user_id
where l.status = 'verified'
  and (p.identity_verified is distinct from true or p.identity_verified_at is null)
order by p.email;

-- PUNTO 4a: perfiles con user_memberships.status = 'active'
select p.id, p.email,
       p.membership_status as status_actual, 'active' as status_nuevo,
       p.membership_type as type_actual, um.membership_type as type_nuevo
from profiles p
join user_memberships um on um.user_id = p.id and um.status = 'active'
where p.membership_status is distinct from 'active'
   or p.membership_type is distinct from um.membership_type
order by p.email;

-- PUNTO 4b: perfiles 'active' sin ninguna membresia vigente
select p.id, p.email,
       p.membership_status as status_actual, 'free' as status_nuevo,
       p.membership_type as type_actual, 'free' as type_nuevo
from profiles p
where p.membership_status = 'active'
  and not exists (
    select 1 from user_memberships um
    where um.user_id = p.id
      and um.status in ('active','cancelled_active','past_due','paused','limited_access','paid_pending_verification','pending_verification')
  )
order by p.email;

-- PUNTO 5: membership_intents
with activar as (
  select distinct on (mi.user_id) mi.id, um.created_at as um_created
  from membership_intents mi
  join user_memberships um on um.user_id = mi.user_id and um.status = 'active'
  where mi.status = 'paid_pending_verification'
    and mi.membership_type = um.membership_type
  order by mi.user_id, abs(extract(epoch from (mi.created_at - um.created_at)))
)
select mi.id, p.email, mi.membership_type, mi.status as status_actual,
       case
         when mi.id in (select id from activar) then 'active'
         else 'canceled'
       end as status_nuevo,
       case
         when mi.id in (select id from activar) then coalesce(mi.activated_at, (select um_created from activar a where a.id = mi.id))
       end as activated_at_nuevo,
       case
         when mi.id not in (select id from activar) then now()
       end as canceled_at_nuevo
from membership_intents mi
join profiles p on p.id = mi.user_id
where mi.status = 'paid_pending_verification'
  and not exists (
    select 1 from user_memberships um
    where um.user_id = mi.user_id and um.status = 'paid_pending_verification'
  )
order by p.email, mi.created_at;
