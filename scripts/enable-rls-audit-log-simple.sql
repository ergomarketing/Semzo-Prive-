-- Enable RLS on audit_log table
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view audit logs
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_log;
CREATE POLICY "Authenticated users can view audit logs"
ON public.audit_log
FOR SELECT
TO authenticated
USING (true);

-- Allow system to insert audit logs
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;
CREATE POLICY "System can insert audit logs"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);
