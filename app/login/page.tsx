import { LoginForm } from "@/components/login-form";
import { Metadata } from "next";
import { Toaster } from "sonner";
import { GoogleSignInButton, GoogleOneTap } from "@/components/auth";

export const metadata: Metadata = {
  title: "로그인",
  description: "kindt 로그인 페이지 입니다. 로그인 후 사용자 관리, 통계, 설정 등을 관리할 수 있습니다.",
};

export default async function Page() {
  // Middleware already handles logged-in user redirects
  // No need to check here - if we reach this point, user is not logged in

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <>
      {/* Google One Tap - auto-prompt for quick sign-in */}
      {googleClientId && (
        <GoogleOneTap
          clientId={googleClientId}
          autoSelect={true}
          cancelOnTapOutside={true}
        />
      )}

      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm space-y-4">
          <LoginForm />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <GoogleSignInButton
            mode="signin"
            fullWidth={true}
            variant="outline"
          />
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </>
  );
}
