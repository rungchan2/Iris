'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Mail, Shield, Calendar, Phone, Edit2, X, Check } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import type { Tables } from '@/types/database.types'
import { updateUserProfile } from '@/lib/actions/user-profile'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type UserProfile = Tables<'users'>

interface ProfileClientProps {
  user: UserProfile
}

export function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || '',
  })

  const getRoleLabel = (role: string) => {
    switch (role) {
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700'
      case 'photographer':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    const result = await updateUserProfile({
      name: formData.name,
      phone: formData.phone || undefined,
    })

    setIsSaving(false)

    if (result.success) {
      toast.success('프로필이 성공적으로 업데이트되었습니다')
      setIsEditing(false)
      router.refresh()
    } else {
      toast.error(result.error || '프로필 업데이트에 실패했습니다')
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user.name,
      phone: user.phone || '',
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-2xl">
                  {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} size="sm">
                <Edit2 className="w-4 h-4 mr-2" />
                프로필 수정
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email (읽기 전용) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>이메일</span>
            </Label>
            <Input id="email" value={user.email} disabled />
          </div>

          {/* Name (편집 가능) */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>이름</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          {/* Phone (편집 가능) */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>휴대폰 번호</span>
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="010-1234-5678"
            />
          </div>

          {/* Role (읽기 전용) */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>권한</span>
            </Label>
            <Input value={getRoleLabel(user.role)} disabled />
          </div>

          {/* Created At (읽기 전용) */}
          {user.created_at && (
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>가입일</span>
              </Label>
              <Input value={format(new Date(user.created_at), 'yyyy년 MM월 dd일')} disabled />
            </div>
          )}

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                {isSaving ? '저장 중...' : '저장'}
              </Button>
              <Button onClick={handleCancel} variant="outline" disabled={isSaving} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
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
          <Link href="/user/payments">
            <Button variant="outline" className="w-full justify-start">
              결제 내역 보기
            </Button>
          </Link>
          <Link href="/user/inquiries">
            <Button variant="outline" className="w-full justify-start">
              예약 내역 보기
            </Button>
          </Link>
          {user.role === 'photographer' && (
            <Link href="/photographer-admin">
              <Button variant="outline" className="w-full justify-start">
                작가 대시보드
              </Button>
            </Link>
          )}
          {user.role === 'admin' && (
            <Link href="/admin">
              <Button variant="outline" className="w-full justify-start">
                관리자 대시보드
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
