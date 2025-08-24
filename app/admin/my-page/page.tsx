import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminProfileSettings } from "@/components/admin/admin-profile-settings"

export default async function AdminMyAccountPage() {
  const supabase = await createClient()

  // Get current user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Check if user is admin
  const isAdmin = session.user.user_metadata?.user_type === 'admin'
  if (!isAdmin) {
    redirect("/unauthorized")
  }

  // Get or create admin record
  let { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("id", session.user.id)
    .single()

  // If admin record doesn't exist, create it
  if (!admin) {
    const { data: newAdmin } = await supabase
      .from("admins")
      .insert({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || 'Admin',
        role: 'admin'
      })
      .select()
      .single()
    
    admin = newAdmin
  }

  // Get system statistics for admin
  const { data: photographerCount } = await supabase
    .from("photographers")
    .select("id", { count: 'exact', head: true })

  const { data: inquiryCount } = await supabase
    .from("inquiries")
    .select("id", { count: 'exact', head: true })

  const { data: reviewCount } = await supabase
    .from("reviews")
    .select("id", { count: 'exact', head: true })

  const { data: photoCount } = await supabase
    .from("photos")
    .select("id", { count: 'exact', head: true })

  const statistics = {
    photographers: typeof photographerCount === 'number' ? photographerCount : 0,
    inquiries: typeof inquiryCount === 'number' ? inquiryCount : 0,
    reviews: typeof reviewCount === 'number' ? reviewCount : 0,
    photos: typeof photoCount === 'number' ? photoCount : 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">내 계정</h1>
        <p className="text-muted-foreground">관리자 프로필을 관리하고 시스템 통계를 확인하세요</p>
      </div>

      {/* System Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">작가 수</div>
          <div className="text-2xl font-bold">{statistics.photographers}</div>
          <div className="text-xs text-muted-foreground">등록된 작가</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">문의 수</div>
          <div className="text-2xl font-bold">{statistics.inquiries}</div>
          <div className="text-xs text-muted-foreground">전체 문의</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">리뷰 수</div>
          <div className="text-2xl font-bold">{statistics.reviews}</div>
          <div className="text-xs text-muted-foreground">전체 리뷰</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">사진 수</div>
          <div className="text-2xl font-bold">{statistics.photos}</div>
          <div className="text-xs text-muted-foreground">업로드된 사진</div>
        </div>
      </div>

      {/* Admin Profile Settings */}
      <AdminProfileSettings admin={admin} />
    </div>
  )
}