import { ProfileCompletionForm } from "@/components/profile-completion-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "프로필 완성 | Iris",
  description: "프로필 정보를 완성해주세요",
};

export default async function ProfileCompletePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Not logged in - redirect to login
  if (!session) {
    redirect("/login");
  }

  // Check if profile is already complete
  const { data: userData } = await supabase
    .from('users')
    .select('name, phone')
    .eq('id', session.user.id)
    .single();

  // Profile already complete - redirect to home
  if (userData?.phone) {
    redirect("/");
  }

  return (
    <>
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <ProfileCompletionForm
            userId={session.user.id}
            currentEmail={session.user.email || ""}
            currentName={session.user.user_metadata?.name || userData?.name}
          />
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </>
  );
}
