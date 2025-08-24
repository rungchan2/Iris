'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateAdminProfile } from '@/lib/actions/admin'

interface AdminProfile {
  id: string
  email: string
  name: string
  role: string | null
  created_at?: string | null
  updated_at?: string | null
}

interface AdminProfileSettingsProps {
  admin: AdminProfile | null
}

export function AdminProfileSettings({ admin }: AdminProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: admin?.name || '',
    email: admin?.email || ''
  })

  const handleSave = async () => {
    if (!admin) return
    
    setLoading(true)
    try {
      const result = await updateAdminProfile(formData)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('프로필이 업데이트되었습니다')
        setIsEditing(false)
      }
    } catch (error) {
      toast.error('프로필 업데이트 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (!admin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            관리자 정보를 불러올 수 없습니다
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>관리자 프로필</CardTitle>
            <CardDescription>관리자 계정 정보를 확인하고 수정하세요</CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              수정
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name">이름</Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="이름을 입력하세요"
              />
            ) : (
              <p className="mt-1 text-sm">{admin.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">이메일</Label>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="이메일을 입력하세요"
              />
            ) : (
              <p className="mt-1 text-sm">{admin.email}</p>
            )}
          </div>

          <div>
            <Label>역할</Label>
            <p className="mt-1 text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {admin.role === 'super_admin' ? 'Super Admin' : (admin.role || 'Admin')}
              </span>
            </p>
          </div>

          <div>
            <Label>계정 ID</Label>
            <p className="mt-1 text-sm text-muted-foreground font-mono">{admin.id}</p>
          </div>

          {admin.created_at && (
            <div>
              <Label>가입일</Label>
              <p className="mt-1 text-sm">
                {new Date(admin.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {admin.updated_at && (
            <div>
              <Label>최근 수정일</Label>
              <p className="mt-1 text-sm">
                {new Date(admin.updated_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setFormData({
                  name: admin.name || '',
                  email: admin.email || ''
                })
              }}
              disabled={loading}
            >
              취소
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}