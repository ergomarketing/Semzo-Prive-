-- SEMZO PRIVE - cierre de seguridad de la base de datos (borrador 2026-10-30)
-- Orden: 1) desplegar el codigo de la rama fix/security-lockdown (ya usa clave de servicio para gift cards),
--        2) aplicar este SQL.  El servidor (service_role) sigue teniendo acceso total; solo se cierra el navegador/anonimo.
-- Cada bloque es independiente. Reversion al final.

begin;

-- 1) profiles: la politica "Service role can do everything" estaba puesta para TODOS (public) con USING (true).
drop policy if exists "Service role can do everything" on public.profiles;

-- 2) gift cards: nadie desde el navegador puede ver todas, ni gestionarlas.
drop policy if exists "Admins can manage gift cards" on public.gift_cards;
drop policy if exists "Anyone can view gift card by code" on public.gift_cards;
drop policy if exists "Admins can manage transactions" on public.gift_card_transactions;
drop policy if exists "Users can insert own transactions" on public.gift_card_transactions;
-- (se mantienen: ver las propias gift cards/transacciones y todo para service_role)

-- 3) membresias y pases: la socia no puede editar su propia membresia ni crearse/modificarse pases (lo hace el servidor).
drop policy if exists "Users can update own membership" on public.user_memberships;
drop policy if exists "Users can insert own passes" on public.bag_passes;
drop policy if exists "Users can update own passes" on public.bag_passes;

-- 4) "admin" por email del perfil era suplantable (la socia edita su email y no es unico): se usa el email del token de sesion.
drop policy if exists "Admins pueden gestionar bolsos" on public.bags;
create policy "Admins pueden gestionar bolsos" on public.bags for all
  using ((auth.jwt() ->> 'email') = 'mailbox@semzoprive.com');
drop policy if exists "Admins pueden ver todas las reservas" on public.reservations;
create policy "Admins pueden ver todas las reservas" on public.reservations for all
  using ((auth.jwt() ->> 'email') = 'mailbox@semzoprive.com');

-- 5) permisos de tabla: el rol anonimo no necesita tocar estas tablas; nadie del navegador necesita TRUNCATE/TRIGGER/REFERENCES.
revoke all on public.profiles, public.gift_cards, public.gift_card_transactions,
              public.bag_passes, public.user_memberships from anon;
revoke truncate, trigger, references on public.profiles, public.gift_cards, public.gift_card_transactions,
              public.bag_passes, public.user_memberships from authenticated;

-- 6) funciones SECURITY DEFINER que el navegador no debe ejecutar (el servidor las usa con service_role).
revoke execute on function public.atomic_gift_card_consume(uuid, numeric) from public, anon, authenticated;
revoke execute on function public.consume_gift_card_atomic(uuid, numeric) from public, anon, authenticated;
revoke execute on function public.consume_gift_card_atomic(uuid, integer, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.purchase_membership_with_gift_card(uuid, uuid, text, text, numeric) from public, anon, authenticated;
revoke execute on function public.expire_stale_membership_intents() from public, anon, authenticated;
revoke execute on function public.sync_profile_membership_type() from public, anon, authenticated;
revoke execute on function public.save_checkout_profile(text, text, text, text, text, text, text, text, text) from public, anon, authenticated;

-- 7) comprobacion de telefono repetido para el alta por SMS: solo devuelve si/no (antes la web leia profiles y mostraba el nombre).
create or replace function public.phone_registered(p_phone text) returns boolean
language sql security definer set search_path = public stable as
$$ select exists (select 1 from public.profiles where phone = p_phone) $$;
revoke execute on function public.phone_registered(text) from public;
grant execute on function public.phone_registered(text) to anon, authenticated, service_role;

commit;

-- REVERSION (solo si algo falla; recrea las politicas antiguas abiertas):
--   create policy "Service role can do everything" on public.profiles for all using (true) with check (true);
--   create policy "Admins can manage gift cards" on public.gift_cards for all using (true);
--   create policy "Anyone can view gift card by code" on public.gift_cards for select using (true);
--   create policy "Admins can manage transactions" on public.gift_card_transactions for all using (true);
--   grant execute on function ... to anon, authenticated;  (las 7 funciones del bloque 6)
