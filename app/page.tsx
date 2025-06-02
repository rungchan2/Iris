"use client"

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/login";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      console.error(error);
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Button onClick={handleLogout}>로그아웃</Button>
        </div>
      </main>
      
    </div>
  );
}
