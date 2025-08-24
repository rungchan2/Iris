import { SignupForm } from "@/components/signup-form";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import Link from "next/link";
import { ArrowLeft, Shield, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "관리자 회원가입 | Iris",
  description: "초대 코드를 이용하여 Iris 관리자 계정을 생성합니다.",
};

export default async function AdminSignupPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Check if user is admin
    const userType = session.user.user_metadata?.user_type;
    
    if (userType === 'admin') {
      redirect("/admin");
    } else {
      // Not an admin, sign out and redirect
      await supabase.auth.signOut();
    }
  }

  return (
    <>
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="w-full max-w-sm">
          {/* Back to admin login link */}
          <div className="mb-6">
            <Link 
              href="/login/admin" 
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              관리자 로그인으로 돌아가기
            </Link>
          </div>

          {/* Admin Signup Card */}
          <div className="bg-white rounded-lg shadow-xl border border-gray-100 p-8">
            {/* Admin Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 회원가입</h1>
              <p className="text-sm text-gray-600">
                초대 코드를 사용하여 관리자 계정을 생성합니다
              </p>
            </div>

            {/* Signup Form */}
            <SignupForm isAdmin={true} />

            {/* Admin Login Link */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 mb-2">
                이미 관리자 계정이 있으신가요?
              </p>
              <Link 
                href="/login/admin" 
                className="text-sm text-green-600 hover:text-green-500 font-medium"
              >
                관리자 로그인
              </Link>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              초대 코드가 필요한 경우 기존 관리자에게 문의하세요
            </p>
          </div>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </>
  );
}