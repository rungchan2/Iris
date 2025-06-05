"use client"
import { ProfileSection } from "@/components/admin/profile-section"
import { UploadStatistics } from "@/components/admin/upload-statistics"

export interface AdminUser {
  id: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

interface Statistics {
  totalPhotos: number
  totalSizeMB: number
  averageSizeKB: number
  photosThisMonth: number
}

interface AccountSettingsProps {
  adminUser: AdminUser
  statistics: Statistics
}

export function AccountSettings({ adminUser, statistics }: AccountSettingsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <ProfileSection adminUser={adminUser} />
      </div>
      <div className="space-y-6">
        <UploadStatistics statistics={statistics} />
      </div>
    </div>
  )
}
