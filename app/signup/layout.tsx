import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If user is already logged in, redirect to home
  if (session) {
    redirect("/");
  }

  return <>{children}</>;
}
