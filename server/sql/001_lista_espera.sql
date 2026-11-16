-- Ejecutar en Supabase despues de crear courts, profiles y reservations.
-- El servidor usa SUPABASE_KEY (service_role); nunca exponer esa clave al cliente.
begin;

create table if not exists public.waiting_list (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    court_id uuid not null references public.courts(id) on delete cascade,
    reservation_date date not null,
    start_time time(0) without time zone not null,
    created_at timestamptz not null default now(),
    constraint waiting_list_turno_usuario_unique
        unique (user_id, court_id, reservation_date, start_time),
    constraint waiting_list_hora_minutos check (extract(second from start_time) = 0),
    constraint waiting_list_hora_valida check (start_time < time '24:00')
);

create index if not exists waiting_list_turno_idx
    on public.waiting_list (court_id, reservation_date, start_time);

alter table public.waiting_list enable row level security;

-- Todas las operaciones pasan por la API: valida ocupacion, identidad y propiedad.
-- No se habilita escritura directa del cliente que pueda saltarse esas reglas.
revoke all on public.waiting_list from anon, authenticated;
grant all on public.waiting_list to service_role;

commit;
