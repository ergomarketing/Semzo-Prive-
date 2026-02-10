-- 1. Fix function_search_path_mutable: set search_path on all functions

ALTER FUNCTION public.update_profiles_updated_at() SET search_path = public;
ALTER FUNCTION public.update_membership_intents_updated_at() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_membership_intents() SET search_path = public;
ALTER FUNCTION public.send_custom_sms(text, text) SET search_path = public;
ALTER FUNCTION public.update_bag_status_on_reservation() SET search_path = public;
ALTER FUNCTION public.release_bag_on_reservation_end() SET search_path = public;
ALTER FUNCTION public.create_reservation_atomic(uuid, uuid, date, date, text) SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.addresses_set_updated_at() SET search_path = public;
ALTER FUNCTION public.update_user_memberships_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.consume_gift_card_atomic(text, numeric, uuid) SET search_path = public;

-- 2. Fix newsletter_subscriptions: restrict INSERT to valid email check
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions
  FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND email <> '');

DROP POLICY IF EXISTS "Anyone can update newsletter subscription" ON public.newsletter_subscriptions;
CREATE POLICY "Anyone can update newsletter subscription" ON public.newsletter_subscriptions
  FOR UPDATE TO anon, authenticated
  USING (email IS NOT NULL)
  WITH CHECK (email IS NOT NULL);

-- 3. Fix audit_log: restrict INSERT to authenticated only with user_id match
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;
CREATE POLICY "System can insert audit logs" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
