"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"
import { useSlotMutations } from "@/lib/hooks/use-available-slots"
import type { SlotInput, RecurringSchedule } from "@/types/schedule.types"

interface BulkScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adminId: string
  onScheduleCreated: () => void
}

export function BulkScheduleModal({ open, onOpenChange, adminId, onScheduleCreated }: BulkScheduleModalProps) {
  const [schedule, setSchedule] = useState<RecurringSchedule>({
    daysOfWeek: [],
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
    slots: [
      {
        startTime: "09:00",
        endTime: "10:00",
        duration: 60,
        maxBookings: 1,
      },
    ],
  })
  const { createBulkSlotsAsync, isCreatingBulk } = useSlotMutations(adminId)

  const daysOfWeek = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ]

  const timeOptions: string[] = []
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      timeOptions.push(timeStr)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const handleDayToggle = (day: number) => {
    setSchedule((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day) ? prev.daysOfWeek.filter((d) => d !== day) : [...prev.daysOfWeek, day],
    }))
  }

  const handleAddSlot = () => {
    setSchedule((prev) => ({
      ...prev,
      slots: [
        ...prev.slots,
        {
          startTime: "09:00",
          endTime: "10:00",
          duration: 60,
          maxBookings: 1,
        },
      ],
    }))
  }

  const handleRemoveSlot = (index: number) => {
    setSchedule((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }))
  }

  const handleSlotChange = (index: number, field: keyof SlotInput, value: string | number) => {
    setSchedule((prev) => ({
      ...prev,
      slots: prev.slots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)),
    }))
  }

  const handleCreateSchedule = async () => {
    if (schedule.daysOfWeek.length === 0) {
      return
    }

    if (schedule.slots.length === 0) {
      return
    }

    try {
      const startDate = new Date(schedule.startDate)
      const endDate = new Date(schedule.endDate)
      const slotsToCreate = []

      // Generate all dates between start and end that match selected days
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        if (schedule.daysOfWeek.includes(date.getDay())) {
          const dateStr = date.toISOString().split("T")[0]

          // Add all slots for this date
          for (const slot of schedule.slots) {
            slotsToCreate.push({
              date: dateStr,
              start_time: slot.startTime,
              end_time: slot.endTime,
              duration_minutes: slot.duration,
            })
          }
        }
      }

      if (slotsToCreate.length === 0) {
        return
      }

      await createBulkSlotsAsync(slotsToCreate)

      onScheduleCreated()
      onOpenChange(false)

      // Reset form
      setSchedule({
        daysOfWeek: [],
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        slots: [
          {
            startTime: "09:00",
            endTime: "10:00",
            duration: 60,
            maxBookings: 1,
          },
        ],
      })
    } catch (error: any) {
      console.error("Error creating schedule:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>예약 가능 시간 설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Days of Week */}
          <div className="space-y-3">
            <Label>요일</Label>
            <div className="grid grid-cols-4 gap-2">
              {daysOfWeek.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    checked={schedule.daysOfWeek.includes(day.value)}
                    onCheckedChange={() => handleDayToggle(day.value)}
                  />
                  <Label className="text-sm">{day.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>시작일</Label>
              <Input
                type="date"
                value={schedule.startDate}
                onChange={(e) => setSchedule({ ...schedule, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>종료일</Label>
              <Input
                type="date"
                value={schedule.endDate}
                onChange={(e) => setSchedule({ ...schedule, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Time Slots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>시간대</Label>
              <Button size="sm" onClick={handleAddSlot}>
                <Plus className="h-4 w-4 mr-1" />
                시간대 추가
              </Button>
            </div>

            <div className="space-y-3">
              {schedule.slots.map((slot, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 items-end p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs">Start</Label>
                    <Select
                      value={slot.startTime}
                      onValueChange={(value) => handleSlotChange(index, "startTime", value)}
                    >
                      <SelectTrigger className="h-8">
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

                  <div className="space-y-1">
                    <Label className="text-xs">End</Label>
                    <Select value={slot.endTime} onValueChange={(value) => handleSlotChange(index, "endTime", value)}>
                      <SelectTrigger className="h-8">
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

                  <div className="space-y-1">
                    <Label className="text-xs">Duration</Label>
                    <Select
                      value={slot.duration.toString()}
                      onValueChange={(value) => handleSlotChange(index, "duration", Number.parseInt(value))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30min</SelectItem>
                        <SelectItem value="60">1hr</SelectItem>
                        <SelectItem value="90">1.5hr</SelectItem>
                        <SelectItem value="120">2hr</SelectItem>
                        <SelectItem value="180">3hr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Available</Label>
                    <div className="h-8 flex items-center px-3 text-xs bg-green-50 border border-green-200 rounded-md text-green-700">
                      Yes
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveSlot(index)}
                    disabled={schedule.slots.length === 1}
                    className="h-8"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule} disabled={isCreatingBulk}>
              {isCreatingBulk ? "Creating..." : "Create Schedule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
