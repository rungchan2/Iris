"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface TimeSlotSelectorProps {
  date: Date
  selectedSlotId?: string
  onSelect: (slotId: string) => void
}

interface AvailableSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
  is_available: boolean
  admin_id: string
  admin_users: {
    name: string
    email: string
  }
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

        const { data, error } = await supabase
          .from("available_slots")
          .select(`
            *,
            admin_users (
              name,
              email
            )
          `)
          .eq("date", formattedDate)
          .eq("is_available", true)
          .order("start_time")

        if (error) throw error

        setSlots(data as AvailableSlot[])
      } catch (error) {
        console.error("Error fetching slots:", error)
        toast.error("시간대를 불러오는 중 오류가 발생했습니다.")
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
        <div className="text-sm text-muted-foreground">시간대를 불러오는 중입니다...</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
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
        {slots.length}개의 가능한 시간대가 있습니다. {format(date, "yyyy년 MM월 dd일")}
      </div>
      <div className="flex flex-wrap gap-3">
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id

          return (
            <Button
              key={slot.id}
              variant={isSelected ? "default" : "outline"}
              className={`p-4 h-auto text-center transition-all hover:scale-105 w-full ${
                isSelected ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
              onClick={() => onSelect(slot.id)}
            >
              <div className="space-y-2">
                <div className="font-semibold">
                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </div>

                <div className="text-xs text-muted-foreground">작가: {slot.admin_users.name}</div>

                <Badge variant="secondary" className="text-xs">
                  {slot.duration_minutes}분
                </Badge>
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
