import { createClient } from "@/lib/supabase/client";
import { adminLogger } from "@/lib/logger";

export async function createUser(id: string, email: string, name: string) {
  try {
    const supabase = createClient();
    adminLogger.info("Creating user with:", { id, email, name });
    
    const { data, error } = await supabase.from("photographers").insert({ id, email, name });
    
    if (error) {
      adminLogger.error("Supabase error creating user:", error);
      throw error;
    }
    
    adminLogger.info("User created successfully:", data);
    return data;
  } catch (error) {
    adminLogger.error("Error in createUser function:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  try {
    const supabase = createClient();
    adminLogger.info("Getting user with id:", id);
    
    const { data, error } = await supabase.from("photographers").select("*").eq("id", id);
    
    if (error) {
      adminLogger.error("Supabase error getting user:", error);
      throw error;
    }
    
    adminLogger.info("User retrieved successfully:", data);
    return data;
  } catch (error) {
    adminLogger.error("Error in getUser function:", error);
    throw error;
  }
}