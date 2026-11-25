-- Ejecutar en SQL Editor de Supabase antes de usar el nuevo circuito web.
-- Si existen reservas activas superpuestas, la transaccion falla sin borrar datos.
-- Resolver los conflictos de datos conscientemente y volver a ejecutar.
begin;
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions;

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'reservations_duracion_positiva'
        and conrelid = 'public.reservations'::regclass) then
        alter table public.reservations add constraint reservations_duracion_positiva
            check (end_time > start_time);
    end if;
    if not exists (select 1 from pg_constraint where conname = 'reservations_sin_superposiciones'
        and conrelid = 'public.reservations'::regclass) then
        alter table public.reservations add constraint reservations_sin_superposiciones
            exclude using gist (
                court_id with =,
                tsrange(reservation_date + start_time, reservation_date + end_time, '[)') with &&
            ) where (status in ('active', 'confirmed'));
    end if;
end $$;

-- La API valida identidad, politicas y activa el aviso al cancelar.
-- Impedir que clientes antiguos salteen esas reglas escribiendo directamente.
revoke insert, update, delete on public.reservations from anon, authenticated;
grant select, insert, update, delete on public.reservations to service_role;
commit;
