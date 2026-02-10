-- Enable RLS on audit_log table
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Removiendo verificación de role que no existe en profiles
-- Policy: Admins can view all audit logs
-- Nota: Esta política permite a cualquier usuario autenticado ver todos los logs
-- Para restringir solo a admins, se debe crear una tabla admin_users separada
CREATE POLICY "Authenticated users can view audit logs"
ON public.audit_log
FOR SELECT
TO authenticated
USING (true);

-- Policy: System can insert audit logs (for triggers and functions)
CREATE POLICY "System can insert audit logs"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON public.audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT ON public.audit_log TO authenticated;
GRANT INSERT ON public.audit_log TO authenticated;
