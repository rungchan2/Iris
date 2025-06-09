import { createClient } from "@/lib/supabase/client";

export async function signUpNewUser(
  email: string,
  password: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
  if (error) {
    throw error;
  }
  return {data, error};
}

export async function login(
  email: string,
  password: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  return {data, error};
}

export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
  return {error};
}

export async function getSession() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return {data, error};
}
