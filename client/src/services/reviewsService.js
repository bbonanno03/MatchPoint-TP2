import { supabase } from "./supabase";

export async function createReview({ userId, courtId, rating, comment }) {
  const { data, error } = await supabase
    .from("reviews")
    .insert([{ user_id: userId, court_id: courtId, rating, comment }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getCourtReviews(courtId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, profiles(name)")
    .eq("court_id", courtId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
