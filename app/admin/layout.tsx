import type React from "react";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { QueryProvider } from "@/components/query-provider";
import { DynamicBreadcrumb } from "@/components/admin/dynamic-breadcrumb";
import { Metadata } from "next";
import { Toaster } from "sonner";
import { getUserCookie } from "@/lib/auth/cookie";

export const metadata: Metadata = {
  title: "어드민 페이지 | kindt",
  description: "kindt 어드민 페이지 입니다. 사용자 관리, 통계, 설정 등을 관리할 수 있습니다.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieUser = await getUserCookie();

  // Middleware가 이미 체크했지만 이중 확인
  if (!cookieUser || cookieUser.role !== 'admin') {
    redirect("/login");
  }

  // Admin 정보
  const user = {
    id: cookieUser.id,
    email: cookieUser.email,
    name: cookieUser.name || 'Admin User',
    user_type: 'admin'
  };

  return (
    <QueryProvider>
      <SidebarProvider>
        <AppSidebar user={user as any} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <DynamicBreadcrumb />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster richColors position="top-right" />
    </QueryProvider>
  );
}
