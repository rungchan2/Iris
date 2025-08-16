import { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "비밀번호 재설정 - Iris",
  description: "비밀번호를 재설정하여 계정에 다시 접근하세요.",
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <ResetPasswordForm />
      </div>
    </div>
  );
}