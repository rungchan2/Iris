import { UserSignupForm } from "@/components/user-signup-form";
import { GoogleSignInButton } from "@/components/auth";
import { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "회원가입 | kindt",
  description: "kindt 회원가입 페이지입니다.",
};

export default function SignupPage() {
  return (
    <>
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm space-y-4">
          <UserSignupForm />

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

          {/* Google Sign Up Button */}
          <GoogleSignInButton
            mode="signup"
            fullWidth={true}
            variant="outline"
          />
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </>
  );
}
