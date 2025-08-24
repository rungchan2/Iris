import type React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PhotographerSidebar } from "@/components/photographer-sidebar";
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

export const metadata: Metadata = {
  title: "사진작가 페이지 | Iris",
  description: "Iris 사진작가 페이지입니다. 포트폴리오, 예약, 리뷰 등을 관리할 수 있습니다.",
};

export default async function PhotographerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Check if user is photographer
  const { data: photographer, error } = await supabase
    .from('photographers')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !photographer) {
    // User is not a photographer, redirect based on their type
    const userType = session.user.user_metadata?.user_type;
    if (userType === 'admin') {
      redirect("/admin");
    } else {
      redirect("/login");
    }
  }

  // Use photographer record as user object for the interface
  const user = {
    id: photographer.id,
    email: photographer.email || session.user.email || '',
    name: photographer.name || 'Photographer User',
    phone: photographer.phone || '',
    bio: photographer.bio || '',
    profile_image_url: photographer.profile_image_url || '',
  };

  return (
    <QueryProvider>
      <SidebarProvider>
        <PhotographerSidebar user={user as any} />
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