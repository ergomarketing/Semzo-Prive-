-- ============================================================================
-- TAREA 1: Sincronizacion automatica profiles.membership_type <- user_memberships
-- ============================================================================
-- Objetivo:
--   user_memberships = fuente de verdad
--   profiles.membership_type = espejo legacy mantenido automaticamente
--
-- No toca codigo aplicacion. No elimina columnas. Solo anade trigger + backfill.
-- ============================================================================

-- 1) Funcion de sincronizacion
CREATE OR REPLACE FUNCTION public.sync_profile_membership_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_status TEXT[] := ARRAY[
    'active',
    'cancelled_active',
    'limited_access',
    'past_due',
    'paused'
  ];
  v_target_type TEXT;
BEGIN
  -- En INSERT/UPDATE NEW siempre existe; en DELETE usamos OLD
  IF TG_OP = 'DELETE' THEN
    -- Al borrar membresia, recalcular: buscar otra activa, si no -> free
    SELECT membership_type
      INTO v_target_type
      FROM public.user_memberships
     WHERE user_id = OLD.user_id
       AND status = ANY (v_active_status)
     ORDER BY
       CASE status WHEN 'active' THEN 0 ELSE 1 END,
       updated_at DESC NULLS LAST,
       created_at DESC NULLS LAST
     LIMIT 1;

    UPDATE public.profiles
       SET membership_type = COALESCE(v_target_type, 'free'),
           updated_at = NOW()
     WHERE id = OLD.user_id
       AND COALESCE(membership_type, '') IS DISTINCT FROM COALESCE(v_target_type, 'free');

    RETURN OLD;
  END IF;

  -- INSERT / UPDATE
  -- Si la fila es de un estado activo => copiar membership_type a profiles
  IF NEW.status = ANY (v_active_status) THEN
    UPDATE public.profiles
       SET membership_type = NEW.membership_type,
           updated_at = NOW()
     WHERE id = NEW.user_id
       AND COALESCE(membership_type, '') IS DISTINCT FROM NEW.membership_type;
    RETURN NEW;
  END IF;

  -- Estado no-activo (cancelled, expired, no_membership, ...):
  -- buscar si el usuario tiene OTRA membresia activa antes de degradar
  SELECT membership_type
    INTO v_target_type
    FROM public.user_memberships
   WHERE user_id = NEW.user_id
     AND status = ANY (v_active_status)
     AND id <> NEW.id
   ORDER BY
     CASE status WHEN 'active' THEN 0 ELSE 1 END,
     updated_at DESC NULLS LAST,
     created_at DESC NULLS LAST
   LIMIT 1;

  UPDATE public.profiles
     SET membership_type = COALESCE(v_target_type, 'free'),
         updated_at = NOW()
   WHERE id = NEW.user_id
     AND COALESCE(membership_type, '') IS DISTINCT FROM COALESCE(v_target_type, 'free');

  RETURN NEW;
END;
$$;

-- 2) Trigger sobre user_memberships
DROP TRIGGER IF EXISTS trg_sync_profile_membership_type ON public.user_memberships;

CREATE TRIGGER trg_sync_profile_membership_type
AFTER INSERT OR UPDATE OF membership_type, status OR DELETE
ON public.user_memberships
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_membership_type();

-- 3) BACKFILL: corregir desfases existentes
-- Para cada usuario, calcular la membresia "real" segun user_memberships
-- y actualizar profiles.membership_type si difiere.
WITH ranked AS (
  SELECT
    um.user_id,
    um.membership_type,
    um.status,
    ROW_NUMBER() OVER (
      PARTITION BY um.user_id
      ORDER BY
        CASE
          WHEN um.status = 'active' THEN 0
          WHEN um.status IN ('cancelled_active','limited_access','past_due','paused') THEN 1
          ELSE 2
        END,
        um.updated_at DESC NULLS LAST,
        um.created_at DESC NULLS LAST
    ) AS rn
  FROM public.user_memberships um
),
resolved AS (
  SELECT
    user_id,
    CASE
      WHEN status IN ('active','cancelled_active','limited_access','past_due','paused')
        THEN membership_type
      ELSE 'free'
    END AS resolved_type
  FROM ranked
  WHERE rn = 1
)
UPDATE public.profiles p
   SET membership_type = r.resolved_type,
       updated_at = NOW()
  FROM resolved r
 WHERE p.id = r.user_id
   AND COALESCE(p.membership_type, '') IS DISTINCT FROM r.resolved_type;

-- 4) Verificacion: usuarios con membresia activa cuyo profiles.membership_type
--    sigue desincronizado tras el backfill (debe devolver 0 filas)
SELECT
  p.id,
  p.email,
  p.membership_type AS profiles_type,
  um.membership_type AS memberships_type,
  um.status
FROM public.profiles p
JOIN public.user_memberships um ON um.user_id = p.id
WHERE um.status IN ('active','cancelled_active','limited_access','past_due','paused')
  AND COALESCE(p.membership_type, '') IS DISTINCT FROM um.membership_type;
