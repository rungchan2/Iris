import { getUserCookie } from "@/lib/auth/cookie";
import { redirect } from "next/navigation";

export default async function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserCookie();

  // If user is already logged in, redirect to home
  if (user) {
    redirect("/");
  }

  return <>{children}</>;
}
