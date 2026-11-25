"""Prueba optativa de la migracion 004 con Docker; no usa Supabase ni credenciales.
Ejecutar: python3 scripts/test-concurrencia-postgres.py
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import os
import subprocess
import time
import uuid

env = {k: v for k, v in os.environ.items() if k not in ('DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH')}
docker = ['docker', '--host=unix:///var/run/docker.sock']
nombre = 'matchpoint-sql-' + uuid.uuid4().hex[:10]
def ejecutar(args, entrada=None):
    return subprocess.run(docker + args, input=entrada, text=True, capture_output=True, env=env)
def sql(texto, codigo=None):
    r = ejecutar(['exec', '-i', nombre, 'psql', '-h', '127.0.0.1', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'], texto)
    if codigo:
        assert r.returncode != 0 and codigo in r.stderr, r.stdout + r.stderr
    else:
        assert r.returncode == 0, r.stdout + r.stderr
    return r

def alta(hora='18:00', fin='19:00', estado='active'):
    return f"insert into reservations(court_id,reservation_date,start_time,end_time,status) values ('00000000-0000-0000-0000-000000000001','2027-01-20','{hora}','{fin}','{estado}');"

try:
    r = ejecutar(['run', '--rm', '-d', '--network', 'none', '--name', nombre, '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', 'postgres:17-alpine'])
    assert r.returncode == 0, r.stderr
    for _ in range(100):
        if ejecutar(['exec', nombre, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres']).returncode == 0:
            break
        time.sleep(.1)
    sql('create role anon; create role authenticated; create role service_role; create table reservations(id uuid default gen_random_uuid(), court_id uuid not null, reservation_date date not null, start_time time not null, end_time time not null, status text not null);')
    migracion = (Path(__file__).resolve().parents[1] / 'sql/004_reservas_sin_superposiciones.sql').read_text()
    sql(migracion)
    sql(migracion)  # Idempotente
    sql(alta())
    sql(alta(), '23P01')
    sql(alta('18:30', '19:30'), '23P01')
    sql(alta('19:00', '20:00'))  # Contiguo
    sql(alta(estado='cancelled'))
    sql(alta('21:00', '20:00'), '23514')
    sql("set role authenticated; " + alta('20:00', '21:00'), '42501')
    sql("update reservations set status='cancelled';")
    with ThreadPoolExecutor(max_workers=2) as pool:
        resultados = list(pool.map(lambda _: ejecutar(['exec', '-i', nombre, 'psql', '-h', '127.0.0.1', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1'], 'begin;' + alta() + 'select pg_sleep(0.3);commit;'), range(2)))
    assert sorted(r.returncode == 0 for r in resultados) == [False, True], resultados
    assert sql("select count(*) from reservations where status='active';").stdout.splitlines()[2].strip() == '1'
    print('OK: migracion idempotente, superposiciones, contiguos, cancelados, permisos y escrituras concurrentes.')
finally:
    ejecutar(['rm', '-f', nombre])
