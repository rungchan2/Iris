'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Mail, Shield, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface ProfileClientProps {
  user: {
    id: string
    email: string | null
    role: string | null
    created_at?: string
  }
}

export function ProfileClient({ user }: ProfileClientProps) {
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

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'superadmin':
      case 'admin':
        return 'bg-purple-100 text-purple-700'
      case 'photographer':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                ← 홈으로
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">내 프로필</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-2xl">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{user.email}</CardTitle>
                  <CardDescription>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>이메일</span>
                </Label>
                <Input id="email" value={user.email || ''} disabled />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>권한</span>
                </Label>
                <Input value={getRoleLabel(user.role)} disabled />
              </div>

              {user.created_at && (
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>가입일</span>
                  </Label>
                  <Input value={format(new Date(user.created_at), 'yyyy년 MM월 dd일')} disabled />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>빠른 메뉴</CardTitle>
              <CardDescription>자주 사용하는 기능에 빠르게 접근하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/payments">
                <Button variant="outline" className="w-full justify-start">
                  결제 내역 보기
                </Button>
              </Link>
              {user.role === 'photographer' && (
                <Link href="/photographer-admin">
                  <Button variant="outline" className="w-full justify-start">
                    작가 대시보드
                  </Button>
                </Link>
              )}
              {(user.role === 'admin' || user.role === 'superadmin') && (
                <Link href="/admin">
                  <Button variant="outline" className="w-full justify-start">
                    관리자 대시보드
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
