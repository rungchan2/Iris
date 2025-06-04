"use client"

import { useState } from "react"
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

  // Get slots for selected date
  const selectedDateStr = selectedDate.toISOString().split("T")[0]
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
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .lte("date", endOfMonth.toISOString().split("T")[0])
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })

      if (error) throw error

      setSlots(data || [])
    } catch (error) {
      console.error("Error fetching slots:", error)
      toast.error("Failed to load schedule")
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
    const dateStr = date.toISOString().split("T")[0]
    const daySlots = slotsGroupedByDate[dateStr] || []

    if (daySlots.length === 0) return {}

    const totalSlots = daySlots.length
    const bookedSlots = daySlots.filter((slot) => slot.current_bookings >= slot.max_bookings).length
    const partiallyBooked = daySlots.filter(
      (slot) => slot.current_bookings > 0 && slot.current_bookings < slot.max_bookings,
    ).length

    if (bookedSlots === totalSlots) {
      return { fullyBooked: true }
    } else if (partiallyBooked > 0 || bookedSlots > 0) {
      return { partiallyBooked: true }
    } else {
      return { available: true }
    }
  }

  // Quick actions
  const handleCopyLastWeek = async () => {
    const lastWeekDate = new Date(selectedDate)
    lastWeekDate.setDate(lastWeekDate.getDate() - 7)
    const lastWeekStr = lastWeekDate.toISOString().split("T")[0]
    const lastWeekSlots = slotsGroupedByDate[lastWeekStr] || []

    if (lastWeekSlots.length === 0) {
      toast.error("No slots found for the same day last week")
      return
    }

    try {
      const newSlots = lastWeekSlots.map((slot) => ({
        date: selectedDateStr,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration_minutes: slot.duration_minutes,
        max_bookings: slot.max_bookings,
        current_bookings: 0,
        is_available: true,
        admin_id: adminId,
      }))

      const { error } = await supabase.from("available_slots").insert(newSlots)

      if (error) throw error

      await fetchSlotsForMonth(selectedDate)
      toast.success("Copied slots from last week")
    } catch (error) {
      console.error("Error copying slots:", error)
      toast.error("Failed to copy slots")
    }
  }

  const handleClearDay = async () => {
    if (selectedDateSlots.length === 0) {
      toast.error("No slots to clear for this date")
      return
    }

    if (!confirm(`Clear all ${selectedDateSlots.length} slots for ${selectedDate.toLocaleDateString('en-US')}?`)) {
      return
    }

    try {
      const slotIds = selectedDateSlots.map((slot) => slot.id)
      const { error } = await supabase.from("available_slots").delete().in("id", slotIds)

      if (error) throw error

      await fetchSlotsForMonth(selectedDate)
      toast.success("Cleared all slots for the day")
    } catch (error) {
      console.error("Error clearing slots:", error)
      toast.error("Failed to clear slots")
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
              Schedule Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Partially Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Fully Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  <span>No Slots</span>
                </div>
              </div>

              {/* Calendar */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                onMonthChange={handleMonthChange}
                className="rounded-md border"
                modifiers={{
                  available: (date) => getDateModifiers(date).available,
                  partiallyBooked: (date) => getDateModifiers(date).partiallyBooked,
                  fullyBooked: (date) => getDateModifiers(date).fullyBooked,
                }}
                modifiersStyles={{
                  available: { backgroundColor: "rgb(34 197 94 / 0.2)" },
                  partiallyBooked: { backgroundColor: "rgb(234 179 8 / 0.2)" },
                  fullyBooked: { backgroundColor: "rgb(239 68 68 / 0.2)" },
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
              {selectedDate.toLocaleDateString('en-US')} Slots
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setBulkModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Bulk Add
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopyLastWeek}>
                <Copy className="h-4 w-4 mr-1" />
                Copy Last Week
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearDay} disabled={selectedDateSlots.length === 0}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Day
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
