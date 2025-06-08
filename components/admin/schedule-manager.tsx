"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, Plus, Copy, Trash2 } from "lucide-react"
import { SlotManager } from "@/components/admin/slot-manager"
import { BulkScheduleModal } from "@/components/admin/bulk-schedule-modal"
import { ScheduleStats } from "@/components/admin/schedule-stats"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { AvailableSlot } from "@/types/schedule.types"

interface ScheduleManagerProps {
  initialSlots: AvailableSlot[]
  adminId: string
}

export function ScheduleManager({ initialSlots, adminId }: ScheduleManagerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [slots, setSlots] = useState<AvailableSlot[]>(initialSlots)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  // Group slots by date for calendar display
  const slotsGroupedByDate = slots.reduce(
    (acc, slot) => {
      const date = slot.date
      if (!acc[date]) acc[date] = []
      acc[date].push(slot)
      return acc
    },
    {} as Record<string, AvailableSlot[]>,
  )

  // Get slots for selected date (timezone-safe)
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
  const selectedDateSlots = slotsGroupedByDate[selectedDateStr] || []

  // Fetch slots for a specific month
  const fetchSlotsForMonth = async (date: Date) => {
    setIsLoading(true)
    try {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from("available_slots")
        .select("*")
        .eq("admin_id", adminId)
        .gte("date", format(startOfMonth, "yyyy-MM-dd"))
        .lte("date", format(endOfMonth, "yyyy-MM-dd"))
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })

      if (error) throw error

      setSlots(data as AvailableSlot[])
    } catch (error) {
      console.error("Error fetching slots:", error)
      toast.error("일정을 불러오는데 실패했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle month navigation
  const handleMonthChange = (date: Date) => {
    fetchSlotsForMonth(date)
  }

  // Get calendar day modifiers for visual indicators
  const getDateModifiers = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const daySlots = slotsGroupedByDate[dateStr] || []

    if (daySlots.length === 0) return {}

    const totalSlots = daySlots.length
    
    // 실제 데이터베이스 구조에 맞춰 수정
    // is_available이 false면 예약됨, true면 예약 가능
    const bookedSlots = daySlots.filter((slot) => !slot.is_available).length
    const availableSlots = daySlots.filter((slot) => slot.is_available).length

    if (bookedSlots === totalSlots) {
      return { fullyBooked: true }
    } else if (bookedSlots > 0 && availableSlots > 0) {
      return { partiallyBooked: true }
    } else {
      return { available: true }
    }
  }

  // Quick actions
  const handleCopyLastWeek = async () => {
    const lastWeekDate = new Date(selectedDate)
    lastWeekDate.setDate(lastWeekDate.getDate() - 7)
    const lastWeekStr = format(lastWeekDate, "yyyy-MM-dd")
    const lastWeekSlots = slotsGroupedByDate[lastWeekStr] || []

    if (lastWeekSlots.length === 0) {
      toast.error("지난 주 같은 요일에 슬롯이 없습니다")
      return
    }

    try {
      const newSlots = lastWeekSlots.map((slot) => ({
        date: selectedDateStr,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration_minutes: slot.duration_minutes,
        is_available: true,
        admin_id: adminId,
      }))

      const { error } = await supabase.from("available_slots").insert(newSlots)

      if (error) throw error

      await fetchSlotsForMonth(selectedDate)
      toast.success("지난 주 슬롯을 복사했습니다")
    } catch (error) {
      console.error("Error copying slots:", error)
      toast.error("슬롯 복사에 실패했습니다")
    }
  }

  const handleClearDay = async () => {
    if (selectedDateSlots.length === 0) {
      toast.error("삭제할 슬롯이 없습니다")
      return
    }

    if (!confirm(`${format(selectedDate, "yyyy년 MM월 dd일")}의 모든 슬롯 ${selectedDateSlots.length}개를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const slotIds = selectedDateSlots.map((slot) => slot.id)
      const { error } = await supabase.from("available_slots").delete().in("id", slotIds)

      if (error) throw error

      await fetchSlotsForMonth(selectedDate)
      toast.success("해당 날짜의 모든 슬롯을 삭제했습니다")
    } catch (error) {
      console.error("Error clearing slots:", error)
      toast.error("슬롯 삭제에 실패했습니다")
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Section */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              일정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>가능</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>부분 예약</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>예약 마감</span>
                </div>
              </div>

              {/* Calendar */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                onMonthChange={handleMonthChange}
                className="rounded-md border w-full"
                modifiers={{
                  available: (date) => {
                    const modifiers = getDateModifiers(date)
                    return modifiers.available === true
                  },
                  partiallyBooked: (date) => {
                    const modifiers = getDateModifiers(date)
                    return modifiers.partiallyBooked === true
                  },
                  fullyBooked: (date) => {
                    const modifiers = getDateModifiers(date)
                    return modifiers.fullyBooked === true
                  },
                }}
                modifiersStyles={{
                  available: { 
                    backgroundColor: "hsl(142, 76%, 36%)", 
                    color: "white",
                    fontWeight: "bold"
                  },
                  partiallyBooked: { 
                    backgroundColor: "hsl(48, 96%, 53%)", 
                    color: "black",
                    fontWeight: "bold"
                  },
                  fullyBooked: { 
                    backgroundColor: "hsl(0, 84%, 60%)", 
                    color: "white",
                    fontWeight: "bold"
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule Stats */}
        <ScheduleStats slots={slots} />
      </div>

      {/* Slot Management Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {format(selectedDate, "yyyy년 MM월 dd일")} 시간대
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => setBulkModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                일괄 추가
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopyLastWeek}>
                <Copy className="h-4 w-4 mr-1" />
                지난 주 복사
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearDay} disabled={selectedDateSlots.length === 0}>
                <Trash2 className="h-4 w-4 mr-1" />
                날짜 초기화
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SlotManager
              date={selectedDateStr}
              slots={selectedDateSlots}
              adminId={adminId}
              onSlotsChange={() => fetchSlotsForMonth(selectedDate)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Bulk Schedule Modal */}
      <BulkScheduleModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        adminId={adminId}
        onScheduleCreated={() => fetchSlotsForMonth(selectedDate)}
      />
    </div>
  )
}
