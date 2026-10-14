-- FASE 1 / PASOS 1, 3, 4, 5: BACKUP + LIMPIEZA
-- NO EJECUTAR hasta dar el OK al listado del dry-run (01).
-- No borra filas, no toca auth.users, ni Stripe, ni user_memberships.

-- PASO 1: copia de seguridad (fuera de la transaccion para que sobreviva a un ROLLBACK)
create table cleanup_backup_20261014_profiles as select * from profiles;
create table cleanup_backup_20261014_intents as select * from membership_intents;
create table cleanup_backup_20261014_user_memberships as select * from user_memberships;

-- RLS sin politicas: solo el service role puede leer los backups
alter table cleanup_backup_20261014_profiles enable row level security;
alter table cleanup_backup_20261014_intents enable row level security;
alter table cleanup_backup_20261014_user_memberships enable row level security;

begin;

-- PUNTO 3: identidad (ultima verificacion = verified)
with latest as (
  select distinct on (user_id) user_id, status, verified_at
  from identity_verifications
  order by user_id, created_at desc
)
update profiles p
set identity_verified = true,
    identity_verified_at = coalesce(p.identity_verified_at, l.verified_at)
from latest l
where l.user_id = p.id
  and l.status = 'verified'
  and (p.identity_verified is distinct from true or p.identity_verified_at is null);

-- PUNTO 4a: perfiles con membresia activa
update profiles p
set membership_status = 'active',
    membership_type = um.membership_type
from user_memberships um
where um.user_id = p.id
  and um.status = 'active'
  and (p.membership_status is distinct from 'active'
       or p.membership_type is distinct from um.membership_type);

-- PUNTO 4b: perfiles 'active' sin membresia vigente
update profiles p
set membership_status = 'free',
    membership_type = 'free'
where p.membership_status = 'active'
  and not exists (
    select 1 from user_memberships um
    where um.user_id = p.id
      and um.status in ('active','cancelled_active','past_due','paused','limited_access','paid_pending_verification','pending_verification')
  );

-- PUNTO 5a: intent que coincide con la membresia activa -> 'active'
with activar as (
  select distinct on (mi.user_id) mi.id, um.created_at as um_created
  from membership_intents mi
  join user_memberships um on um.user_id = mi.user_id and um.status = 'active'
  where mi.status = 'paid_pending_verification'
    and mi.membership_type = um.membership_type
  order by mi.user_id, abs(extract(epoch from (mi.created_at - um.created_at)))
)
update membership_intents mi
set status = 'active',
    activated_at = coalesce(mi.activated_at, a.um_created)
from activar a
where mi.id = a.id;

-- PUNTO 5b: otros paid_pending_verification de usuarios con membresia activa -> 'canceled'
update membership_intents mi
set status = 'canceled',
    canceled_at = now()
where mi.status = 'paid_pending_verification'
  and exists (
    select 1 from user_memberships um
    where um.user_id = mi.user_id and um.status = 'active'
  );

-- PUNTO 5c: usuarios sin membresia activa (pruebas y cortesias), excluye paid_pending_verification (Alfonso)
update membership_intents mi
set status = 'canceled',
    canceled_at = now()
where mi.status = 'paid_pending_verification'
  and not exists (
    select 1 from user_memberships um
    where um.user_id = mi.user_id
      and um.status in ('active','paid_pending_verification')
  );

-- PUNTO 5d: intent 'active' con membresia cancelada y sin membresia activa -> 'canceled'
update membership_intents mi
set status = 'canceled',
    canceled_at = coalesce(mi.canceled_at, um.updated_at)
from user_memberships um
where mi.user_id = um.user_id
  and mi.status = 'active'
  and um.status = 'cancelled'
  and not exists (select 1 from user_memberships a where a.user_id = mi.user_id and a.status = 'active');

commit;
