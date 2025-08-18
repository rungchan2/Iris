"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Inbox, FolderTree, ImageIcon, User, LogOut, Menu, X, Users, Calendar, Shield, BarChart3, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { usePermissions } from "@/lib/rbac"

// 권한별 네비게이션 아이템 정의
const navigationItems = [
  { 
    name: "문의", 
    href: "/admin", 
    icon: Inbox,
    permissions: ['inquiries.read']
  },
  { 
    name: "사진", 
    href: "/admin/photos", 
    icon: ImageIcon,
    permissions: ['photos.read']
  },
  { 
    name: "카테고리", 
    href: "/admin/category", 
    icon: FolderTree,
    permissions: ['categories.read']
  },
  { 
    name: "일정 관리", 
    href: "/admin/schedule", 
    icon: Calendar,
    permissions: ['schedule.read']
  },
  { 
    name: "작가 관리", 
    href: "/admin/admin-users", 
    icon: Users,
    permissions: ['users.read'],
    userTypes: ['admin'] // 관리자만 접근
  },
  { 
    name: "사용자 관리", 
    href: "/admin/users", 
    icon: Shield,
    permissions: ['users.create', 'users.update'],
    roles: ['admin', 'super_admin']
  },
  { 
    name: "리뷰 관리", 
    href: "/admin/reviews", 
    icon: MessageSquare,
    permissions: ['inquiries.read'] // 예약을 관리할 수 있는 사람은 리뷰도 관리 가능
  },
  { 
    name: "통계", 
    href: "/admin/analytics", 
    icon: BarChart3,
    permissions: ['analytics.read']
  },
  { 
    name: "내 계정", 
    href: "/admin/my-account", 
    icon: User,
    permissions: [] // 모든 로그인 사용자 접근 가능
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, hasAnyPermission, isAdmin } = usePermissions()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // 권한 기반 네비게이션 필터링
  const getFilteredNavigationItems = () => {
    if (!user) return []

    return navigationItems.filter(item => {
      // 권한이 없으면 모든 사용자 접근 가능
      if (!item.permissions || item.permissions.length === 0) return true
      
      // 특정 역할 제한이 있는 경우
      if (item.roles && !item.roles.includes(user.role)) return false
      
      // 특정 사용자 타입 제한이 있는 경우
      if (item.userTypes && !item.userTypes.includes(user.userType)) return false
      
      // 권한 확인
      return hasAnyPermission(item.permissions as any[])
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Photo Admin</h2>
            {user && (
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs">
                  {user.userType === 'admin' 
                    ? (user.role === 'super_admin' ? '슈퍼 관리자' : '관리자')
                    : '작가'
                  }
                </p>
              </div>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {getFilteredNavigationItems().map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800",
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
