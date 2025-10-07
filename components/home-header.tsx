'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Receipt, UserCircle } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import { getUserCookie } from '@/lib/auth/cookie'

interface HomeHeaderProps {
  serverUser?: {
    id: string
    email: string | null
    role: string | null
  } | null
}

export function HomeHeader({ serverUser }: HomeHeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState(serverUser)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Refresh user data if needed
    const refreshUser = async () => {
      const userData = await getUserCookie()
      setUser(userData)
    }
    refreshUser()
  }, [])

  const handleLogout = async () => {
    await logout()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  if (!mounted) {
    return null
  }

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'superadmin':
        return '최고 관리자'
      case 'admin':
        return '관리자'
      case 'photographer':
        return '사진작가'
      case 'user':
        return '일반 사용자'
      default:
        return '게스트'
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo & Main Nav */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center">
              <Image
                src="/main-logo.png"
                alt="kindt"
                width={100}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </Link>

            <nav className="hidden md:flex items-center space-x-4">
              <Link href="/matching">
                <Button variant="ghost" size="sm" className="text-sm">
                  성향 진단하기 <span className="ml-1 text-xs text-blue-600">beta</span>
                </Button>
              </Link>
              <Link href="/photographers">
                <Button variant="ghost" size="sm" className="text-sm">
                  작가 둘러보기
                </Button>
              </Link>
            </nav>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {getRoleLabel(user.role)}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>내 프로필</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/payments" className="flex items-center cursor-pointer">
                      <Receipt className="mr-2 h-4 w-4" />
                      <span>결제 내역</span>
                    </Link>
                  </DropdownMenuItem>
                  {(user.role === 'admin' || user.role === 'superadmin') && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>관리자 대시보드</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'photographer' && (
                    <DropdownMenuItem asChild>
                      <Link href="/photographer-admin" className="flex items-center cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>작가 대시보드</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button size="sm" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>로그인</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden flex items-center space-x-2 mt-3">
          <Link href="/matching" className="flex-1">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              성향 진단 <span className="ml-1 text-xs text-blue-600">beta</span>
            </Button>
          </Link>
          <Link href="/photographers" className="flex-1">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              작가 둘러보기
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
