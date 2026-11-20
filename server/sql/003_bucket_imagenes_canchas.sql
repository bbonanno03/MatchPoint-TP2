-- Tarea 1.8: bucket de Supabase Storage para las fotos de las canchas.
-- Es publico para que el front pueda mostrar las fotos con la URL guardada en courts.image_url.
-- Solo el servidor sube archivos (usa la service_role key, que no necesita politicas extra).
-- Ejecutar en Supabase > SQL Editor. Se puede correr mas de una vez.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('canchas', 'canchas', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Control
SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'canchas';
