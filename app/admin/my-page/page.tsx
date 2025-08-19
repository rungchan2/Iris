import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccountSettings, AdminUser } from "@/components/admin/account-settings"
import { PhotographerProfileSection } from "@/components/admin/photographer-profile"

export default async function MyAccountPage() {
  const supabase = await createClient()

  // Get current user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get photographer info with extended fields
  const { data: photographer, error: userError } = await supabase
    .from("photographers")
    .select("*")
    .eq("id", session.user.id)
    .single()

  if (userError || !photographer) {
    redirect("/unauthorized")
  }

  // Get photo statistics
  const { data: photoStats } = await supabase
    .from("photos")
    .select("id, size_kb, created_at")
    .eq("uploaded_by", session.user.id)

  // Calculate statistics
  const totalPhotos = photoStats?.length || 0
  const totalSizeKB = photoStats?.reduce((sum, photo) => sum + (photo.size_kb || 0), 0) || 0
  const totalSizeMB = totalSizeKB / 1024
  const averageSizeKB = totalPhotos > 0 ? totalSizeKB / totalPhotos : 0

  // Photos uploaded this month
  const currentMonth = new Date()
  currentMonth.setDate(1)
  currentMonth.setHours(0, 0, 0, 0)

  const photosThisMonth = photoStats?.filter((photo) => new Date(photo.created_at || "") >= currentMonth).length || 0

  const statistics = {
    totalPhotos,
    totalSizeMB,
    averageSizeKB,
    photosThisMonth,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">내 계정</h1>
        <p className="text-muted-foreground">프로필을 관리하고 업로드 통계를 확인하세요</p>
      </div>

      {/* Show extended profile for photographers */}
      <PhotographerProfileSection photographer={photographer} />
      
      {/* Original account settings with statistics */}
      <AccountSettings adminUser={photographer as AdminUser} statistics={statistics} />
    </div>
  )
}
