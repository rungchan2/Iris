"use client"

import type * as React from "react"
import { useEffect, useState } from "react"
import { Inbox, FolderTree, ImageIcon, User, LogOut, Calendar, Brain, Users, Target, BarChart3, UserPlus, MessageSquare } from "lucide-react"

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

// Menu items
const items = [
  {
    title: "문의",
    url: "/admin",
    icon: Inbox,
  },
  {
    title: "카테고리",
    url: "/admin/category",
    icon: FolderTree,
  },
  {
    title: "사진",
    url: "/admin/photos",
    icon: ImageIcon,
  },
  {
    title: "일정",
    url: "/admin/schedule",
    icon: Calendar,
  },
  {
    title: "사용자 관리",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "초대 코드",
    url: "/admin/invites",
    icon: UserPlus,
  },
  {
    title: "성격유형 매칭",
    url: "/admin/personality-mapping",
    icon: Target,
  },
  {
    title: "통계 및 분석",
    url: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "성향 진단 관리",
    url: "/admin/personality-management",
    icon: Brain,
  },
  {
    title: "리뷰 관리",
    url: "/admin/reviews",
    icon: MessageSquare,
  },
  {
    title: "내 계정",
    url: "/admin/my-page",
    icon: User,
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
                  <span className="truncate font-semibold">사진 관리자</span>
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
              {items.map((item) => {
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
