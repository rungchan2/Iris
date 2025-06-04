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
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email (Read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address
          </Label>
          <Input id="email" value={adminUser.email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
        </div>

        {/* Name (Editable) */}
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <div className="flex gap-2">
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your display name"
              className={hasChanges ? "border-orange-300 focus:border-orange-500" : ""}
            />
            {hasChanges && (
              <Button onClick={handleSave} disabled={isUpdating || !name.trim()} size="sm">
                {isUpdating ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
          {hasChanges && <p className="text-xs text-orange-600">Press Enter or click Save to update</p>}
        </div>

        {/* Account Dates */}
        <div className="grid grid-cols-1 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Account Created
            </Label>
            <p className="text-sm text-muted-foreground">{formatDate(adminUser.created_at)}</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last Updated
            </Label>
            <p className="text-sm text-muted-foreground">{formatDate(adminUser.updated_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
