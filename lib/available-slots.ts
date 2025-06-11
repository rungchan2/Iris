import { createClient } from "./supabase/client";

export const getSlot = async (id: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("available_slots")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
};