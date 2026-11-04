import { supabase } from "../supabase"; // Asegurate de que la ruta a tu cliente de supabase sea correcta

/**
 * Trae todas las canchas ordenadas por nombre
 */
export const getCourts = async () => {
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Inserta una nueva cancha
 */
export const createCourt = async (courtData) => {
  const { data, error } = await supabase
    .from("courts")
    .insert([courtData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Modifica una cancha existente por ID
 */
export const updateCourt = async (id, courtData) => {
  const { data, error } = await supabase
    .from("courts")
    .update(courtData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Elimina una cancha de la base de datos
 */
export const deleteCourt = async (id) => {
  const { error } = await supabase.from("courts").delete().eq("id", id);

  if (error) throw new Error(error.message);
  return true;
};
