import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ScheduleManager } from "@/components/admin/schedule-manager"
import type { AvailableSlot } from "@/types/schedule.types"

export default async function SchedulePage() {
  const supabase = await createClient()

  // Get current user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Check if user is admin
  const { data: adminUser } = await supabase.from("photographers").select("*").eq("id", session.user.id).single()

  if (!adminUser) {
    redirect("/unauthorized")
  }

  // Get current month's slots
  const currentDate = new Date()
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const { data: slots } = await supabase
    .from("available_slots")
    .select("*")
    .eq("admin_id", session.user.id)
    .gte("date", startOfMonth.toISOString().split("T")[0])
    .lte("date", endOfMonth.toISOString().split("T")[0])
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">일정 관리</h1>
        <p className="text-muted-foreground">사진 촬영 예약을 위한 가능한 시간대를 관리하세요</p>
      </div>

      <ScheduleManager initialSlots={slots as AvailableSlot[]} adminId={session.user.id} />
    </div>
  )
}
