"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { User, Mail, Calendar, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

interface AdminUser {
  id: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

interface ProfileSectionProps {
  adminUser: AdminUser
}

export function ProfileSection({ adminUser }: ProfileSectionProps) {
  const [name, setName] = useState(adminUser.name)
  const [isUpdating, setIsUpdating] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const supabase = createClient()

  const handleNameChange = (value: string) => {
    setName(value)
    setHasChanges(value !== adminUser.name)
  }

  const handleSave = async () => {
    if (!hasChanges || !name.trim()) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("admin_users")
        .update({
          name: name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", adminUser.id)

      if (error) throw error

      toast.success("Profile updated successfully")
      setHasChanges(false)

      // Update the adminUser object for future comparisons
      adminUser.name = name.trim()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && hasChanges) {
      handleSave()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          프로필 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email (Read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            이메일 주소
          </Label>
          <Input id="email" value={adminUser.email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">이메일 주소는 변경할 수 없습니다</p>
        </div>

        {/* Name (Editable) */}
        <div className="space-y-2">
          <Label htmlFor="name">이름</Label>
          <div className="flex gap-2">
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="이름을 입력하세요"
              className={hasChanges ? "border-orange-300 focus:border-orange-500" : ""}
            />
            {hasChanges && (
              <Button onClick={handleSave} disabled={isUpdating || !name.trim()} size="sm">
                {isUpdating ? "저장중..." : "저장"}
              </Button>
            )}
          </div>
          {hasChanges && <p className="text-xs text-orange-600">Enter 키를 누르거나 저장 버튼을 클릭하여 업데이트</p>}
        </div>

        {/* Account Dates */}
        <div className="grid grid-cols-1 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              계정 생성일
            </Label>
            <p className="text-sm text-muted-foreground">{formatDate(adminUser.created_at)}</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              마지막 업데이트
            </Label>
            <p className="text-sm text-muted-foreground">{formatDate(adminUser.updated_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
