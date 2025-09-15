"use client"

import type * as React from "react"
import { useEffect, useState } from "react"
import { Inbox, FolderTree, ImageIcon, User, LogOut, Calendar, Brain, Users, Target, BarChart3, UserPlus, MessageSquare, CreditCard } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { type UserPermissions } from "@/lib/auth/permissions"
import { usePermissions } from "@/lib/hooks/use-permissions"

interface MenuItem {
  title: string
  url: string
  icon: any
  requiredPermission: keyof UserPermissions
}

// Menu items with required permissions
const items: MenuItem[] = [
  {
    title: "문의",
    url: "/admin",
    icon: Inbox,
    requiredPermission: "canAccessInquiries",
  },
  {
    title: "카테고리",
    url: "/admin/category",
    icon: FolderTree,
    requiredPermission: "canAccessCategories",
  },
  {
    title: "사진",
    url: "/admin/photos",
    icon: ImageIcon,
    requiredPermission: "canAccessPhotos",
  },
  {
    title: "일정",
    url: "/admin/schedule",
    icon: Calendar,
    requiredPermission: "canAccessSchedule",
  },
  {
    title: "사용자 관리",
    url: "/admin/users",
    icon: Users,
    requiredPermission: "canAccessUsers",
  },
  {
    title: "성격유형 매칭",
    url: "/admin/personality-mapping",
    icon: Target,
    requiredPermission: "canAccessPersonalityMapping",
  },
  {
    title: "통계 및 분석",
    url: "/admin/analytics",
    icon: BarChart3,
    requiredPermission: "canAccessAnalytics",
  },
  {
    title: "성향 진단 관리",
    url: "/admin/personality-management",
    icon: Brain,
    requiredPermission: "canAccessUsers",
  },
  {
    title: "리뷰 관리",
    url: "/admin/reviews",
    icon: MessageSquare,
    requiredPermission: "canAccessReviews",
  },
  {
    title: "정산 관리",
    url: "/admin/settlements",
    icon: CreditCard,
    requiredPermission: "canAccessAnalytics",
  },
  {
    title: "결제 관리",
    url: "/admin/payments",
    icon: CreditCard,
    requiredPermission: "canAccessAnalytics",
  },
  {
    title: "내 계정",
    url: "/admin/my-page",
    icon: User,
    requiredPermission: "canAccessMyPage",
  },
]

interface AdminUser {
  id: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: AdminUser }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const { permissions } = usePermissions()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ImageIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">어드민 관리자</span>
                  <span className="truncate text-xs">대시보드</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>관리자 페이지</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.filter(item => permissions?.[item.requiredPermission]).map((item) => {
                const isActive = mounted ? (pathname === item.url || (item.url !== "/admin" && pathname.startsWith(item.url))) : false
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                  <User className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut />
              <span>로그아웃</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
