"use client"

import type * as React from "react"
import { useEffect, useState } from "react"
import {
  Inbox,
  FolderTree,
  ImageIcon,
  User,
  LogOut,
  Calendar,
  Users,
  BarChart3,
  UserPlus,
  MessageSquare,
  CreditCard,
  Zap,
  HelpCircle,
  Camera,
  Settings,
  TrendingUp,
  Package,
  Ticket,
  Heart,
  BookA
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
import { type UserPermissions } from "@/lib/auth/client-permissions"
import { useUserStore } from "@/stores/useUserStore"
import { getUserPermissions } from "@/lib/auth/client-permissions"
import { logout } from "@/app/actions/auth"

interface NavItem {
  title: string
  url: string
  icon: any
  requiredPermission: keyof UserPermissions
  items?: {
    title: string
    url: string
  }[]
}

// Menu items with required permissions and hierarchical structure
const navItems: NavItem[] = [
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
    title: "AI 매칭 시스템",
    url: "/admin/matching",
    icon: Zap,
    requiredPermission: "canAccessUsers",
    items: [
      {
        title: "질문 관리",
        url: "/admin/matching/questions",
      },
      {
        title: "작가 프로필 관리",
        url: "/admin/matching/photographers",
      },
      {
        title: "성능 분석",
        url: "/admin/matching/analytics",
      },
      {
        title: "시스템 설정",
        url: "/admin/matching/settings",
      },
    ],
  },
  {
    title: "상품 관리",
    url: "/admin/products",
    icon: Package,
    requiredPermission: "canAccessPhotos",
  },
  {
    title: "통계 및 분석",
    url: "/admin/analytics",
    icon: BarChart3,
    requiredPermission: "canAccessAnalytics",
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
    title: "쿠폰 관리",
    url: "/admin/coupons",
    icon: Ticket,
    requiredPermission: "canAccessAnalytics",
    items: [
      {
        title: "쿠폰 발급",
        url: "/admin/coupons",
      },
      {
        title: "템플릿 관리",
        url: "/admin/coupon-templates",
      },
    ],
  },
  {
    title: "사연 관리",
    url: "/admin/stories",
    icon: Heart,
    requiredPermission: "canAccessAnalytics",
  },
  {
    title: "내 계정",
    url: "/admin/my-page",
    icon: User,
    requiredPermission: "canAccessMyPage",
  },
  {
    title: "정책 관리",
    url: "/admin/terms",
    icon: BookA,
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
  const [mounted, setMounted] = useState(false)
  const currentUser = useUserStore(state => state.user)
  const permissions = getUserPermissions(currentUser)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await logout()
    router.push("/login")
  }

  // Filter navigation items based on permissions
  const filteredNavItems = navItems.filter(item => permissions?.[item.requiredPermission])

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
        <NavMain items={filteredNavItems} />
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
