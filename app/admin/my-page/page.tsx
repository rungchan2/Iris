import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccountSettings } from "@/components/admin/account-settings"

export default async function MyAccountPage() {
  const supabase = await createClient()

  // Get current user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get admin user info
  const { data: adminUser, error: userError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", session.user.id)
    .single()

  if (userError || !adminUser) {
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

  const photosThisMonth = photoStats?.filter((photo) => new Date(photo.created_at) >= currentMonth).length || 0

  const statistics = {
    totalPhotos,
    totalSizeMB,
    averageSizeKB,
    photosThisMonth,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="text-muted-foreground">Manage your profile and view upload statistics</p>
      </div>

      <AccountSettings adminUser={adminUser} statistics={statistics} />
    </div>
  )
}
