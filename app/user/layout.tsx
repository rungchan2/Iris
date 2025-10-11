import type React from "react"
import { redirect } from "next/navigation"
import { UserAppSidebar } from "@/components/user/user-app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { UserBreadcrumb } from "@/components/user/user-breadcrumb"
import { Metadata } from "next"
import { getUserCookie } from "@/lib/auth/cookie"

export const metadata: Metadata = {
  title: "마이페이지 | kindt",
  description: "나의 예약 내역, 결제 내역, 프로필을 관리할 수 있습니다.",
}

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieUser = await getUserCookie()

  if (!cookieUser) {
    redirect("/login?returnUrl=/user")
  }

  // User 정보
  const user = {
    id: cookieUser.id,
    email: cookieUser.email,
    name: cookieUser.name || null,
  }

  return (
    <SidebarProvider>
      <UserAppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <UserBreadcrumb />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
