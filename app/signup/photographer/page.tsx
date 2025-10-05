import { SignupForm } from "@/components/signup-form";
import { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "작가 회원가입 | Iris",
  description: "Iris 작가 회원가입 페이지입니다.",
};

export default function PhotographerSignupPage() {
  return (
    <>
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-4xl">
          <SignupForm />
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </>
  );
}
