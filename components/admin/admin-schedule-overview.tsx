'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Photographer {
  id: string
  name: string | null
  email: string | null
}

interface Slot {
  id: string
  admin_id: string | null
  date: string
  start_time: string
  end_time: string
  is_available: boolean | null
  duration_minutes: number | null
  created_at: string | null
  updated_at: string | null
  photographers?: Photographer | null
}

interface Inquiry {
  id: string
  name: string | null
  matched_admin_id?: string | null
  selected_slot_id?: string | null
  desired_date?: string | null
  status: string | null
  photographers?: Photographer | null
}

interface AdminScheduleOverviewProps {
  allSlots: Slot[]
  photographers: Photographer[]
  inquiries: Inquiry[]
}

export function AdminScheduleOverview({ 
  allSlots, 
  photographers, 
  inquiries 
}: AdminScheduleOverviewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Helper function to check if a slot is booked
  const isSlotBooked = (slotId: string) => {
    return inquiries.some(inquiry => inquiry.selected_slot_id === slotId)
  }

  // Get slots for selected date
  const selectedDateSlots = selectedDate 
    ? allSlots.filter(slot => slot.date === format(selectedDate, 'yyyy-MM-dd'))
    : []

  // Get inquiries for selected date
  const selectedDateInquiries = selectedDate
    ? inquiries.filter(inquiry => 
        inquiry.desired_date === format(selectedDate, 'yyyy-MM-dd') ||
        allSlots.some(slot => slot.id === inquiry.selected_slot_id && slot.date === format(selectedDate, 'yyyy-MM-dd'))
      )
    : []

  // Group slots by photographer
  const slotsByPhotographer = selectedDateSlots.reduce((acc, slot) => {
    const photographerId = slot.admin_id || 'unassigned'
    if (!acc[photographerId]) {
      acc[photographerId] = []
    }
    acc[photographerId].push(slot)
    return acc
  }, {} as Record<string, Slot[]>)

  // Dates with slots (for calendar highlighting)
  const datesWithSlots = allSlots.map(slot => new Date(slot.date))
  const datesWithBookings = allSlots
    .filter(slot => isSlotBooked(slot.id))
    .map(slot => new Date(slot.date))

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>캘린더</CardTitle>
          <CardDescription>날짜를 선택하여 해당일의 예약 현황을 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ko}
            className="rounded-md border"
            modifiers={{
              hasSlots: datesWithSlots,
              hasBookings: datesWithBookings
            }}
            modifiersStyles={{
              hasSlots: { backgroundColor: '#e3f2fd' },
              hasBookings: { backgroundColor: '#c8e6c9', fontWeight: 'bold' }
            }}
          />
          <div className="mt-4 flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#e3f2fd] border rounded" />
              <span>예약 가능</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#c8e6c9] border rounded" />
              <span>예약 있음</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, 'yyyy년 MM월 dd일', { locale: ko }) : '날짜 선택'}
          </CardTitle>
          <CardDescription>
            {selectedDateSlots.length > 0 
              ? `${selectedDateSlots.length}개 슬롯 • ${selectedDateSlots.filter(s => isSlotBooked(s.id)).length}개 예약`
              : '예약 정보가 없습니다'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {Object.entries(slotsByPhotographer).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(slotsByPhotographer).map(([photographerId, slots]) => {
                  const photographer = photographers.find(p => p.id === photographerId)
                  return (
                    <div key={photographerId} className="border rounded-lg p-4">
                      <div className="font-medium mb-2">
                        {photographer?.name || 'Unknown'}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({photographer?.email})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {slots.map(slot => (
                          <div key={slot.id} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {slot.start_time} - {slot.end_time}
                              </span>
                              {isSlotBooked(slot.id) ? (
                                <Badge variant="default" className="text-xs">예약됨</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">예약 가능</Badge>
                              )}
                            </div>
                            {isSlotBooked(slot.id) && (
                              <span className="text-xs text-muted-foreground">
                                예약 슬롯
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {selectedDate 
                  ? '이 날짜에는 예약 슬롯이 없습니다'
                  : '날짜를 선택해주세요'}
              </div>
            )}

            {/* Related Inquiries */}
            {selectedDateInquiries.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">관련 문의</h4>
                <div className="space-y-2">
                  {selectedDateInquiries.map(inquiry => (
                    <div key={inquiry.id} className="border rounded p-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{inquiry.name || '이름 없음'}</span>
                        <Badge variant={
                          inquiry.status === 'confirmed' ? 'default' :
                          inquiry.status === 'pending' ? 'secondary' : 'outline'
                        }>
                          {inquiry.status || '상태 없음'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {inquiry.photographers?.name || '미지정'} • {inquiry.desired_date || '날짜 미정'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}