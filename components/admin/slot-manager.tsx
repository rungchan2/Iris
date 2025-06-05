"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format, addMinutes, parse } from "date-fns"
import type { AvailableSlot } from "@/types/schedule.types"

interface SlotManagerProps {
  date: string
  slots: AvailableSlot[]
  adminId: string
  onSlotsChange: () => void
}

export function SlotManager({ date, slots, adminId, onSlotsChange }: SlotManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingSlot, setEditingSlot] = useState<string | null>(null)
  const [newSlot, setNewSlot] = useState<{ startTime: string }>({
    startTime: "09:00",
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

  // Calculate end time (45 minutes after start)
  const calculateEndTime = (startTime: string) => {
    try {
      const start = parse(startTime, "HH:mm", new Date())
      const end = addMinutes(start, 45)
      return format(end, "HH:mm")
    } catch (error) {
      console.error("Error calculating end time:", error)
      return startTime
    }
  }

  const handleAddSlot = async () => {
    console.log(newSlot)
    try {
      // Calculate end time
      const endTime = calculateEndTime(newSlot.startTime)

      // Validate times
      if (newSlot.startTime >= endTime) {
        toast.error("Invalid time calculation")
        return
      }

      // Check for overlapping slots
      const hasOverlap = slots.some((slot) => {
        return (
          (newSlot.startTime >= slot.start_time && newSlot.startTime < slot.end_time) ||
          (endTime > slot.start_time && endTime <= slot.end_time) ||
          (newSlot.startTime <= slot.start_time && endTime >= slot.end_time)
        )
      })

      if (hasOverlap) {
        toast.error("이 시간대는 기존 슬롯과 겹칩니다")
        return
      }

      const { error } = await supabase.from("available_slots").insert({
        date,
        start_time: newSlot.startTime,
        end_time: endTime,
        duration_minutes: 45, // Fixed to 45 minutes
        is_available: true,
        admin_id: adminId,
      })

      if (error) throw error

      setNewSlot({ startTime: "09:00" })
      setIsAdding(false)
      onSlotsChange()
      toast.success("시간 슬롯이 성공적으로 추가되었습니다")
    } catch (error) {
      console.error("Error adding slot:", error)
      toast.error("시간 슬롯 추가에 실패했습니다")
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("이 시간 슬롯을 삭제하시겠습니까?")) return

    try {
      const { error } = await supabase.from("available_slots").delete().eq("id", slotId)

      if (error) throw error

      onSlotsChange()
      toast.success("시간 슬롯이 삭제되었습니다")
    } catch (error) {
      console.error("Error deleting slot:", error)
      toast.error("시간 슬롯 삭제에 실패했습니다")
    }
  }

  const handleToggleAvailability = async (slotId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("available_slots").update({ is_available: !currentStatus }).eq("id", slotId)

      if (error) throw error

      onSlotsChange()
      toast.success(`슬롯이 ${!currentStatus ? "예약 가능" : "예약 불가"}으로 변경되었습니다`)
    } catch (error) {
      console.error("Error updating slot:", error)
      toast.error("슬롯 상태 변경에 실패했습니다")
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
            <Card key={slot.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-lg">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      45분
                    </Badge>
                    <Badge variant={slot.is_available ? "default" : "destructive"} className="text-xs">
                      {slot.is_available ? "예약 가능" : "예약됨"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {slot.is_available ? "예약 대기 중" : "고객 예약 완료"}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleAvailability(slot.id, slot.is_available || false)}
                    disabled={!slot.is_available} // Can't make booked slots available again
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSlot(slot.id)}
                    disabled={!slot.is_available} // Can't delete booked slots
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
          시간 슬롯 추가
        </Button>
      ) : (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">시작 시간</Label>
              <Select value={newSlot.startTime} onValueChange={(value) => setNewSlot({ startTime: value })}>
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
              <div className="text-sm text-muted-foreground">
                종료 시간: {formatTime(calculateEndTime(newSlot.startTime))} (45분 자동 계산)
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddSlot} className="flex-1">
                슬롯 추가
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
          <p>이 날짜에 설정된 시간 슬롯이 없습니다</p>
          <p className="text-sm">"시간 슬롯 추가"를 클릭하여 시작하세요</p>
        </div>
      )}
    </div>
  )
}
