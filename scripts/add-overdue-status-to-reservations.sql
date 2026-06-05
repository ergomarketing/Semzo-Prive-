-- Añade el estado 'overdue' al constraint de reservations.status
-- Flujo: active -> overdue (cron, al vencer end_date sin devolución física)
--        overdue -> completed (logística, al registrar returns.status = received/completed)
-- No se añade 'returned' porque la devolución física ya está modelada en la tabla returns.

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('pending', 'confirmed', 'active', 'overdue', 'completed', 'cancelled'));
