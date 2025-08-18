import { createClient } from "@/lib/supabase/client";

export async function createUser(id: string, email: string, name: string) {
  try {
    const supabase = createClient();
    console.log("Creating user with:", { id, email, name });
    
    const { data, error } = await supabase.from("photographers").insert({ id, email, name });
    
    if (error) {
      console.error("Supabase error creating user:", error);
      throw error;
    }
    
    console.log("User created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in createUser function:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  try {
    const supabase = createClient();
    console.log("Getting user with id:", id);
    
    const { data, error } = await supabase.from("photographers").select("*").eq("id", id);
    
    if (error) {
      console.error("Supabase error getting user:", error);
      throw error;
    }
    
    console.log("User retrieved successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in getUser function:", error);
    throw error;
  }
}