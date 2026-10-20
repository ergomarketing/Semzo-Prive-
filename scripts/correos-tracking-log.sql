-- Registro de lo que Correos responde en cada seguimiento (solo cuando cambia).
-- NO aplicado automaticamente: ejecutar tras revision.

create table if not exists public.correos_tracking_log (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  direction text not null check (direction in ('outbound', 'return')),
  tracking_number text not null,
  raw_status text not null,
  mapped_status text,
  events_count integer not null default 0,
  events jsonb not null default '[]'::jsonb,
  delivered_at text,
  checked_at timestamptz not null default now()
);

create index if not exists correos_tracking_log_shipment_idx
  on public.correos_tracking_log (shipment_id, direction, checked_at desc);

-- Solo accede el service role (cron y rutas admin del servidor).
alter table public.correos_tracking_log enable row level security;

-- Consulta de solo lectura: devoluciones marcadas en transito o entregadas.
-- Sirve para revisar casos como el de Esther tras desplegar el cambio.
-- select id, reservation_id, return_tracking_number, return_status, return_actual_delivery, updated_at
-- from public.shipments
-- where return_tracking_number is not null
--   and return_status in ('in_transit', 'out_for_delivery', 'delivered')
-- order by updated_at desc;
