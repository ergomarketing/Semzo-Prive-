-- Crea la tabla users enlazada a auth.users -------------------------------
create table if not exists public.users (
  id                uuid primary key references auth.users on delete cascade,
  email             text unique not null,
  first_name        text,
  last_name         text,
  phone             text,
  membership_status text default 'free',
  created_at        timestamp with time zone default now()
);

-- Activa RLS (requerido por Supabase) -------------------------------------
alter table public.users enable row level security;

-- Política: permitir al usuario insertar/seleccionar SU propio registro ---
create policy "Users can manage their own row"
on public.users
for all
using ( auth.uid() = id )
with check ( auth.uid() = id );
