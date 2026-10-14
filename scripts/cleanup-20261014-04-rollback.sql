-- FASE 1: ROLLBACK desde las tablas cleanup_backup_20261014_*
-- Restaura solo las columnas que modifico la limpieza.
begin;

update profiles p
set membership_status = b.membership_status,
    membership_type = b.membership_type,
    identity_verified = b.identity_verified,
    identity_verified_at = b.identity_verified_at
from cleanup_backup_20261014_profiles b
where b.id = p.id
  and (p.membership_status is distinct from b.membership_status
       or p.membership_type is distinct from b.membership_type
       or p.identity_verified is distinct from b.identity_verified
       or p.identity_verified_at is distinct from b.identity_verified_at);

update membership_intents mi
set status = b.status,
    activated_at = b.activated_at,
    canceled_at = b.canceled_at
from cleanup_backup_20261014_intents b
where b.id = mi.id
  and (mi.status is distinct from b.status
       or mi.activated_at is distinct from b.activated_at
       or mi.canceled_at is distinct from b.canceled_at);

commit;
