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
    // Check user type and redirect accordingly
    const userType = session.user.user_metadata?.user_type;
    
    if (userType === 'admin') {
      redirect("/admin");
    } else {
      // Check if user is photographer
      const { data: photographer, error } = await supabase
        .from('photographers')
        .select('id, approval_status')
        .eq('id', session.user.id)
        .single();
        
      if (photographer && !error) {
        // 작가 승인 상태에 따라 다른 경로로 리디렉션
        const redirectPath = photographer.approval_status === 'approved' 
          ? '/photographer-admin' 
          : '/photographer/approval-status';
        redirect(redirectPath);
      } else {
        // No matching user type - just show login form without redirecting
        // This prevents infinite redirect loop
        console.log('User has session but no matching role, showing login form');
      }
    }
  }
  return (
    <>
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
      <Toaster richColors position="top-right" />
    </>
  );
}
