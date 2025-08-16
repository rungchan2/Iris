import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "로그인 | Iris",
  description: "Iris 로그인 페이지 입니다. 로그인 후 사용자 관리, 통계, 설정 등을 관리할 수 있습니다.",
};

export default async function Page() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect("/admin");
  }
  return (
    <>
      <Toaster position="top-right" richColors />
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Tabs defaultValue="account" className="w-[400px]">
          <TabsList>
            <TabsTrigger value="account">로그인</TabsTrigger>
            <TabsTrigger value="password">회원가입</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <LoginForm />
          </TabsContent>
          <TabsContent value="password">
            <SignupForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}
