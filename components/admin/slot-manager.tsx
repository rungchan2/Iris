"use client"
import { Clock } from "lucide-react" // Import Clock component

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { AvailableSlot, SlotInput } from "@/types/schedule.types"

interface SlotManagerProps {
  date: string
  slots: AvailableSlot[]
  adminId: string
  onSlotsChange: () => void
}

export function SlotManager({ date, slots, adminId, onSlotsChange }: SlotManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingSlot, setEditingSlot] = useState<string | null>(null)
  const [newSlot, setNewSlot] = useState<SlotInput>({
    startTime: "09:00",
    endTime: "10:00",
    duration: 60,
    maxBookings: 1,
  })
  const supabase = createClient()

  // Generate time options (15-minute intervals)
  const generateTimeOptions = () => {
    const times = []
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        times.push(timeStr)
      }
    }
    return times
  }

  const timeOptions = generateTimeOptions()

  const handleAddSlot = async () => {
    try {
      // Validate times
      if (newSlot.startTime >= newSlot.endTime) {
        toast.error("End time must be after start time")
        return
      }

      // Check for overlapping slots
      const hasOverlap = slots.some((slot) => {
        return (
          (newSlot.startTime >= slot.start_time && newSlot.startTime < slot.end_time) ||
          (newSlot.endTime > slot.start_time && newSlot.endTime <= slot.end_time) ||
          (newSlot.startTime <= slot.start_time && newSlot.endTime >= slot.end_time)
        )
      })

      if (hasOverlap) {
        toast.error("This time slot overlaps with an existing slot")
        return
      }

      const { error } = await supabase.from("available_slots").insert({
        date,
        start_time: newSlot.startTime,
        end_time: newSlot.endTime,
        duration_minutes: newSlot.duration,
        max_bookings: newSlot.maxBookings,
        current_bookings: 0,
        is_available: true,
        admin_id: adminId,
      })

      if (error) throw error

      setNewSlot({
        startTime: "09:00",
        endTime: "10:00",
        duration: 60,
        maxBookings: 1,
      })
      setIsAdding(false)
      onSlotsChange()
      toast.success("Time slot added successfully")
    } catch (error) {
      console.error("Error adding slot:", error)
      toast.error("Failed to add time slot")
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Delete this time slot?")) return

    try {
      const { error } = await supabase.from("available_slots").delete().eq("id", slotId)

      if (error) throw error

      onSlotsChange()
      toast.success("Time slot deleted")
    } catch (error) {
      console.error("Error deleting slot:", error)
      toast.error("Failed to delete time slot")
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="space-y-4">
      {/* Existing Slots */}
      {slots.length > 0 && (
        <div className="space-y-2">
          {slots.map((slot) => (
            <Card key={slot.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {slot.duration_minutes}분
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>
                      {slot.current_bookings}/{slot.max_bookings} 예약됨
                    </span>
                    {slot.current_bookings >= slot.max_bookings && (
                      <Badge variant="destructive" className="text-xs">
                        마감
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditingSlot(slot.id)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSlot(slot.id)}
                    disabled={slot.current_bookings > 0}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Slot */}
      {!isAdding ? (
        <Button onClick={() => setIsAdding(true)} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          가능한 시간 추가
        </Button>
      ) : (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">시작 시간</Label>
                <Select
                  value={newSlot.startTime}
                  onValueChange={(value) => setNewSlot({ ...newSlot, startTime: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">종료 시간</Label>
                <Select value={newSlot.endTime} onValueChange={(value) => setNewSlot({ ...newSlot, endTime: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">시간 (분)</Label>
                <Select
                  value={newSlot.duration.toString()}
                  onValueChange={(value) => setNewSlot({ ...newSlot, duration: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30분</SelectItem>
                    <SelectItem value="60">1시간</SelectItem>
                    <SelectItem value="90">1.5시간</SelectItem>
                    <SelectItem value="120">2시간</SelectItem>
                    <SelectItem value="180">3시간</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxBookings">최대 예약 가능 인원</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={newSlot.maxBookings}
                  onChange={(e) => setNewSlot({ ...newSlot, maxBookings: Number.parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddSlot} className="flex-1">
                추가하기
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                취소
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {slots.length === 0 && !isAdding && (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No time slots set for this date</p>
          <p className="text-sm">Click "Add Time Slot" to get started</p>
        </div>
      )}
    </div>
  )
}
