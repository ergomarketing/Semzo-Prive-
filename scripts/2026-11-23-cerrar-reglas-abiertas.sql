-- 2026-11-23 — Cerrar reglas de acceso (RLS) abiertas a cualquiera.
--
-- Contexto: varias politicas se crearon pensando en "service role" pero estaban asignadas al rol PUBLICO con
-- condicion `true`, lo que da lectura y escritura a cualquier visitante que tenga la clave publica de la web
-- (esa clave va en el codigo de la pagina). La clave de servidor (SUPABASE_SERVICE_ROLE_KEY) salta RLS por si
-- sola, asi que estas politicas nunca hicieron falta para el funcionamiento normal.
--
-- ORDEN: aplicar DESPUES de desplegar el codigo de la rama fix/cerrar-reglas-abiertas (las rutas de blog y
-- resume-onboarding pasan a la conexion de servidor; sin ese cambio, cerrar estas reglas las romperia).
--
-- Reversible: cada politica eliminada se puede recrear (definiciones originales en los comentarios).

-- 1) Verificaciones de identidad (DNI, nombre, estado): cualquiera podia leer y escribir todas.
--    Original: "Service role can manage verifications" FOR ALL TO public USING (true)
--    Se mantiene "Users can view own verifications" (cada socia ve la suya).
drop policy if exists "Service role can manage verifications" on public.identity_verifications;

-- 2) Historial de pagos: cualquiera podia leer y modificar todo.
--    Original: "Service role full access payment_history" FOR ALL TO public USING (true)
--    Se mantiene "Users can view own payment history".
drop policy if exists "Service role full access payment_history" on public.payment_history;

-- 3) Pagos: cualquiera podia insertar filas.
--    Original: "Service role can insert payments" FOR INSERT TO public WITH CHECK (true)
drop policy if exists "Service role can insert payments" on public.payments;

-- 4) Suscripciones: cualquiera podia leer y modificar todo.
--    Original: "Service role full access subscriptions" FOR ALL TO public USING (true)
drop policy if exists "Service role full access subscriptions" on public.subscriptions;

-- 5) Intenciones de membresia: cualquiera podia leer y modificar las de todas.
--    Original: "System can manage membership intents" FOR ALL TO public USING (true) WITH CHECK (true)
--    Se mantienen las politicas de "propias" (ver, insertar, actualizar, borrar con auth.uid() = user_id)
--    y la de service_role.
drop policy if exists "System can manage membership intents" on public.membership_intents;

-- 6) Articulos del blog: cualquiera podia crear, editar y borrar articulos.
--    Original: "blog_posts_admin_all" FOR ALL TO public USING (true) WITH CHECK (true)
--    Se mantiene "blog_posts_public_read" (solo publicados). La edicion va por la API de administracion.
drop policy if exists "blog_posts_admin_all" on public.blog_posts;
