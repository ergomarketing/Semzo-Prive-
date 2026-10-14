-- FASE 1 / PASO 6: VERIFICACION (solo lectura)
select 'user_memberships' as tabla, status::text as valor, count(*) from user_memberships group by 2
union all select 'profiles.membership_status', membership_status::text, count(*) from profiles group by 2
union all select 'profiles.identity_verified', identity_verified::text, count(*) from profiles group by 2
union all select 'membership_intents', status::text, count(*) from membership_intents group by 2
order by 1, 2;

select email, membership_status, membership_type, identity_verified, identity_verified_at
from profiles
where email in ('irene.dealvaro@gmail.com', 'mariahurtadosanchez5@gmail.com', 'alfonsohurtadomauricio@gmail.com')
order by email;
