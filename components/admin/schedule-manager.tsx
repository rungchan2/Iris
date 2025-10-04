"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, Plus, Copy, Trash2 } from "lucide-react"
import { SlotManager } from "@/components/admin/slot-manager"
import { BulkScheduleModal } from "@/components/admin/bulk-schedule-modal"
import { ScheduleStats } from "@/components/admin/schedule-stats"
import { useAvailableSlots, useSlotMutations } from "@/lib/hooks/use-available-slots"
import type { AvailableSlot } from "@/types/schedule.types"

interface ScheduleManagerProps {
  initialSlots: AvailableSlot[]
  adminId: string
}

export function ScheduleManager({ initialSlots, adminId }: ScheduleManagerProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() })

  const { data: slots = initialSlots, isLoading, refetch } = useAvailableSlots(
    adminId,
    currentMonth.year,
    currentMonth.month
  )
  const { copySlots, deleteBulkSlots, isCopying, isDeletingBulk } = useSlotMutations(adminId)

  useEffect(() => {
    setMounted(true)
    setSelectedDate(new Date())
  }, [])

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
  const selectedDateStr = mounted && selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
  const selectedDateSlots = selectedDateStr ? (slotsGroupedByDate[selectedDateStr] || []) : []

  // Handle month navigation
  const handleMonthChange = (date: Date) => {
    setCurrentMonth({ year: date.getFullYear(), month: date.getMonth() })
  }

  // Get calendar day modifiers for visual indicators
  const getDateModifiers = (date: Date) => {
    if (!mounted) return {}
    
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
  const handleCopyLastWeek = () => {
    if (!mounted || !selectedDate) return

    const lastWeekDate = new Date(selectedDate)
    lastWeekDate.setDate(lastWeekDate.getDate() - 7)
    const lastWeekStr = format(lastWeekDate, "yyyy-MM-dd")

    copySlots({ fromDate: lastWeekStr, toDate: selectedDateStr })
  }

  const handleClearDay = () => {
    if (!mounted || !selectedDate) return

    if (selectedDateSlots.length === 0) {
      return
    }

    if (!confirm(`${format(selectedDate, "yyyy년 MM월 dd일")}의 모든 슬롯 ${selectedDateSlots.length}개를 삭제하시겠습니까?`)) {
      return
    }

    const slotIds = selectedDateSlots.map((slot) => slot.id)
    deleteBulkSlots(slotIds)
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
              {mounted && selectedDate && (
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
              )}
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
              {mounted && selectedDate ? format(selectedDate, "yyyy년 MM월 dd일") : "날짜 선택"} 시간대
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => setBulkModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                일괄 추가
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopyLastWeek} disabled={isCopying}>
                <Copy className="h-4 w-4 mr-1" />
                {isCopying ? "복사중..." : "지난 주 복사"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearDay} disabled={selectedDateSlots.length === 0 || isDeletingBulk}>
                <Trash2 className="h-4 w-4 mr-1" />
                {isDeletingBulk ? "삭제중..." : "날짜 초기화"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SlotManager
              date={selectedDateStr}
              slots={selectedDateSlots}
              adminId={adminId}
              onSlotsChange={() => refetch()}
            />
          </CardContent>
        </Card>
      </div>

      {/* Bulk Schedule Modal */}
      <BulkScheduleModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        adminId={adminId}
        onScheduleCreated={() => refetch()}
      />
    </div>
  )
}
