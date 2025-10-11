"use client"

import type * as React from "react"
import { useEffect, useState } from "react"
import {
  User,
  LogOut,
  Calendar,
  CreditCard,
  UserCircle,
  Home
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { logout } from "@/app/actions/auth"

interface NavItem {
  title: string
  url: string
  icon: any
  items?: {
    title: string
    url: string
  }[]
}

// User navigation items
const navItems: NavItem[] = [
  {
    title: "예약 내역",
    url: "/user/inquiries",
    icon: Calendar,
  },
  {
    title: "결제 내역",
    url: "/user/payments",
    icon: CreditCard,
  },
  {
    title: "내 프로필",
    url: "/user/profile",
    icon: UserCircle,
  },
]

interface UserData {
  id: string
  email: string | null
  name?: string | null
}

export function UserAppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: UserData }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    logout()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Home className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">kindt</span>
                  <span className="truncate text-xs">마이페이지</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
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
                  <span className="truncate font-semibold">{user.name || user.email?.split('@')[0]}</span>
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
