import { createClient } from "./supabase/client";

export const getCategory = async (id: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .eq("id", id)
    .single();
  return { data, error };
};