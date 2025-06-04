"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, TrendingUp, Users } from "lucide-react"
import type { AvailableSlot } from "@/types/schedule.types"

interface ScheduleStatsProps {
  slots: AvailableSlot[]
}

export function ScheduleStats({ slots }: ScheduleStatsProps) {
  // Calculate statistics
  const totalSlots = slots.length
  const bookedSlots = slots.filter((slot) => slot.current_bookings >= slot.max_bookings).length
  const availableSlots = totalSlots - bookedSlots
  const bookingRate = totalSlots > 0 ? ((bookedSlots / totalSlots) * 100).toFixed(1) : "0"

  // Calculate total available hours
  const totalHours = slots.reduce((sum, slot) => sum + slot.duration_minutes, 0) / 60

  // Get current week stats
  const currentWeek = new Date()
  const startOfWeek = new Date(currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay()))
  const endOfWeek = new Date(currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 6))

  const weekSlots = slots.filter((slot) => {
    const slotDate = new Date(slot.date)
    return slotDate >= startOfWeek && slotDate <= endOfWeek
  })

  const weekHours = weekSlots.reduce((sum, slot) => sum + slot.duration_minutes, 0) / 60

  // Find most popular time slots
  const timeSlotCounts = slots.reduce(
    (acc, slot) => {
      const timeKey = `${slot.start_time}-${slot.end_time}`
      acc[timeKey] = (acc[timeKey] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const popularTimeSlot = Object.entries(timeSlotCounts).sort(([, a], [, b]) => b - a)[0]

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const stats = [
    {
      title: "Total Slots",
      value: totalSlots.toString(),
      description: "This month",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Available Hours",
      value: `${totalHours.toFixed(1)}h`,
      description: "Total time available",
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Booking Rate",
      value: `${bookingRate}%`,
      description: "Slots booked",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "This Week",
      value: `${weekHours.toFixed(1)}h`,
      description: "Available hours",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Schedule Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.title} className="flex items-center gap-3 p-3 rounded-lg border">
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Insights */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium">Quick Insights</h4>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Available Slots</span>
              <Badge variant="outline">{availableSlots}</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Booked Slots</span>
              <Badge variant={bookedSlots > 0 ? "default" : "outline"}>{bookedSlots}</Badge>
            </div>

            {popularTimeSlot && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Popular Time</span>
                <Badge variant="secondary">
                  {formatTime(popularTimeSlot[0].split("-")[0])} - {formatTime(popularTimeSlot[0].split("-")[1])}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {totalSlots === 0 && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No schedule set yet. Start by adding some time slots!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
