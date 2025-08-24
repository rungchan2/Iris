"use client"

import type * as React from "react"
import { useEffect, useState } from "react"
import { Camera, User, LogOut, Calendar, MessageSquare, BarChart3, Inbox, Image, Star } from "lucide-react"
import NextImage from "next/image"

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

interface MenuItem {
  title: string
  url: string
  icon: any
}

// Photographer menu items
const items: MenuItem[] = [
  {
    title: "대시보드",
    url: "/photographer-admin/dashboard",
    icon: BarChart3,
  },
  {
    title: "문의",
    url: "/photographer-admin/inquiries",
    icon: Inbox,
  },
  {
    title: "사진",
    url: "/photographer-admin/photos",
    icon: Image,
  },
  {
    title: "일정",
    url: "/photographer-admin/schedule",
    icon: Calendar,
  },
  {
    title: "리뷰 관리",
    url: "/photographer-admin/reviews",
    icon: Star,
  },
  {
    title: "내 계정",
    url: "/photographer-admin/my-page",
    icon: User,
  },
]

interface PhotographerUser {
  id: string
  email: string
  name: string
  phone?: string
  bio?: string
  profile_image_url?: string
}

export function PhotographerSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: PhotographerUser }) {
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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                  <Camera className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">포토그래퍼</span>
                  <span className="truncate text-xs">대시보드</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>작가 관리</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = mounted ? (pathname === item.url || (item.url !== "/photographers" && pathname.startsWith(item.url))) : false
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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 overflow-hidden">
                  {user.profile_image_url ? (
                    <NextImage
                      src={user.profile_image_url}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <User className="size-4" />
                  )}
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