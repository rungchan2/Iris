import { createClient } from "@/lib/supabase/client";

export async function createUser(id: string, email: string, name: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("admin_users").insert({ id, email, name });
  if (error) {
    throw error;
  }
  return data;
}

export async function getUser(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("admin_users").select("*").eq("id", id);
  if (error) {
    throw error;
  }
  return data;
}