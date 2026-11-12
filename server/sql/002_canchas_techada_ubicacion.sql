-- Tarea 1.6: agrega a las canchas si son techadas y su ubicacion.
-- Lo necesita el caso de uso del clima (solo aplica a canchas al aire libre
-- y consulta el pronostico con la latitud y longitud de la cancha).
-- Ejecutar en Supabase > SQL Editor. Se puede correr mas de una vez.

ALTER TABLE courts ADD COLUMN IF NOT EXISTS covered   boolean NOT NULL DEFAULT false;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS latitude  numeric(9, 6);
ALTER TABLE courts ADD COLUMN IF NOT EXISTS longitude numeric(9, 6);

-- Rangos validos de coordenadas
ALTER TABLE courts DROP CONSTRAINT IF EXISTS courts_latitude_check;
ALTER TABLE courts ADD CONSTRAINT courts_latitude_check CHECK (latitude BETWEEN -90 AND 90);

ALTER TABLE courts DROP CONSTRAINT IF EXISTS courts_longitude_check;
ALTER TABLE courts ADD CONSTRAINT courts_longitude_check CHECK (longitude BETWEEN -180 AND 180);

-- Las canchas existentes son de MatchPoint Club (Villa Sarmiento)
UPDATE courts
SET latitude = -34.632000, longitude = -58.563000
WHERE latitude IS NULL AND location ILIKE '%Villa Sarmiento%';

-- Las de padel quedan techadas; las de tenis, al aire libre
UPDATE courts SET covered = true WHERE sport ILIKE 'p_del';

-- Control
SELECT id, name, sport, covered, latitude, longitude FROM courts ORDER BY name;
