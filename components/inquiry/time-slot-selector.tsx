"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { AvailableSlot } from "@/types/inquiry.types"

interface TimeSlotSelectorProps {
  date: Date
  selectedSlotId?: string
  onSelect: (slotId: string) => void
}

export function TimeSlotSelector({ date, selectedSlotId, onSelect }: TimeSlotSelectorProps) {
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!date) return

    const fetchSlots = async () => {
      setLoading(true)
      try {
        const formattedDate = format(date, "yyyy-MM-dd")
        console.log("Fetching slots for date:", formattedDate)
        
        const { data, error } = await supabase
          .from("available_slots")
          .select(
            `
            *,
            admin_users (
              name,
              email
            )
          `,
          )
          .eq("date", formattedDate)
          .eq("is_available", true)
          .gt("max_bookings", 0) // Only show slots with available spots
          .order("start_time")

        if (error) throw error
        
        // Filter out fully booked slots
        const availableSlots = (data || []).filter((slot) => {
          const currentBookings = slot.current_bookings || 0
          const maxBookings = slot.max_bookings || 0
          return maxBookings > 0 && currentBookings < maxBookings
        })
        
        console.log("Filtered available slots:", availableSlots)
        console.log("Number of available slots:", availableSlots.length)
        setSlots(availableSlots as AvailableSlot[])
      } catch (error) {
        console.error("Error fetching slots:", error)
        setSlots([])
      } finally {
        setLoading(false)
      }
    }

    fetchSlots()
  }, [date, supabase])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">Loading available times...</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No available slots</p>
        <p className="text-sm">Please select a different date</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        {slots.length} 시간대{slots.length !== 1 ? "s" : ""} 가능 for {format(date, "MMMM d, yyyy")}
      </div>
      <div className="flex flex-wrap gap-3 flex-1-1-150px">
        {slots.map((slot) => {
          const spotsLeft = slot.max_bookings - slot.current_bookings
          const isSelected = selectedSlotId === slot.id

          return (
            <Button
              key={slot.id}
              variant={isSelected ? "default" : "outline"}
              className={`p-4 h-auto text-left transition-all hover:scale-105 ${
                isSelected ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
              onClick={() => onSelect(slot.id)}
            >
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">
                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                  </span>
                </div>

                {slot.admin_users && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>작가: {slot.admin_users.name}</span>
                  </div>
                )}

                <div className="text-xs">
                  <span
                    className={`inline-block px-2 py-1 rounded-full ${
                      spotsLeft <= 2
                        ? "bg-orange-100 text-orange-800"
                        : spotsLeft <= 5
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {spotsLeft}자리 남았습니다
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">{slot.duration_minutes}분</div>
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
