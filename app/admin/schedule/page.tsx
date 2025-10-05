import { createClient } from "@/lib/supabase/server"
import { AdminScheduleOverview } from "@/components/admin/admin-schedule-overview"

export default async function AdminSchedulePage() {
  const supabase = await createClient()

  // Get all photographers
  const { data: photographers } = await supabase
    .from("photographers")
    .select("id, name, email")
    .order("name", { ascending: true })

  // Get current month's slots for all photographers
  const currentDate = new Date()
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const { data: allSlots } = await supabase
    .from("available_slots")
    .select(`
      *,
      photographers:admin_id (
        id,
        name,
        email
      )
    `)
    .gte("date", startOfMonth.toISOString().split("T")[0])
    .lte("date", endOfMonth.toISOString().split("T")[0])
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })

  // Get all inquiries (bookings) for the month
  const { data: inquiries } = await supabase
    .from("inquiries")
    .select(`
      *
    `)
    .gte("created_at", startOfMonth.toISOString())
    .lte("created_at", endOfMonth.toISOString())

  // Calculate statistics by checking which slots have associated inquiries
  const totalSlots = allSlots?.length || 0
  const bookedSlots = allSlots?.filter(slot => 
    inquiries?.some(inquiry => inquiry.selected_slot_id === slot.id)
  ).length || 0
  const availableSlots = totalSlots - bookedSlots
  const bookingRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0

  const photographerStats = photographers?.map(photographer => {
    const photographerSlots = allSlots?.filter(slot => slot.admin_id === photographer.id) || []
    const photographerBooked = photographerSlots.filter(slot =>
      inquiries?.some(inquiry => inquiry.selected_slot_id === slot.id)
    ).length
    const photographerInquiries = inquiries?.filter(inquiry => {
      // Check if the inquiry is related to this photographer's slot
      const inquirySlot = allSlots?.find(s => s.id === inquiry.selected_slot_id)
      return inquirySlot?.admin_id === photographer.id
    }) || []

    return {
      ...photographer,
      totalSlots: photographerSlots.length,
      bookedSlots: photographerBooked,
      availableSlots: photographerSlots.length - photographerBooked,
      inquiries: photographerInquiries.length,
      bookingRate: photographerSlots.length > 0 ? Math.round((photographerBooked / photographerSlots.length) * 100) : 0
    }
  }) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">전체 일정 관리</h1>
        <p className="text-muted-foreground">모든 작가의 일정과 예약 현황을 확인하세요</p>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">전체 슬롯</div>
          <div className="text-2xl font-bold">{totalSlots}</div>
          <div className="text-xs text-muted-foreground">이번 달</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">예약됨</div>
          <div className="text-2xl font-bold text-green-600">{bookedSlots}</div>
          <div className="text-xs text-muted-foreground">{bookingRate}% 예약률</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">예약 가능</div>
          <div className="text-2xl font-bold text-blue-600">{availableSlots}</div>
          <div className="text-xs text-muted-foreground">남은 슬롯</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">총 문의</div>
          <div className="text-2xl font-bold text-orange-600">{inquiries?.length || 0}</div>
          <div className="text-xs text-muted-foreground">이번 달</div>
        </div>
      </div>

      {/* Calendar and Schedule Overview Component */}
      <AdminScheduleOverview
        allSlots={allSlots || []}
        photographers={photographers || []}
        inquiries={(inquiries || []) as any[]}
      />

      {/* Photographer Statistics */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">작가별 예약 통계</h2>
          <p className="text-sm text-muted-foreground">각 작가의 예약 현황을 확인하세요</p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-sm">작가명</th>
                  <th className="text-center p-2 font-medium text-sm">전체 슬롯</th>
                  <th className="text-center p-2 font-medium text-sm">예약됨</th>
                  <th className="text-center p-2 font-medium text-sm">예약 가능</th>
                  <th className="text-center p-2 font-medium text-sm">문의 수</th>
                  <th className="text-center p-2 font-medium text-sm">예약률</th>
                </tr>
              </thead>
              <tbody>
                {photographerStats.map((photographer) => (
                  <tr key={photographer.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{photographer.name}</div>
                        <div className="text-xs text-muted-foreground">{photographer.email}</div>
                      </div>
                    </td>
                    <td className="text-center p-2">{photographer.totalSlots}</td>
                    <td className="text-center p-2 text-green-600 font-medium">{photographer.bookedSlots}</td>
                    <td className="text-center p-2 text-blue-600">{photographer.availableSlots}</td>
                    <td className="text-center p-2 text-orange-600">{photographer.inquiries}</td>
                    <td className="text-center p-2">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${photographer.bookingRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{photographer.bookingRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}