"use client"

import { motion } from "framer-motion"
import { format } from "date-fns"
import { CheckCircle, Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { InquiryFormValues, Category, Inquiry } from "@/types/inquiry.types"

interface SuccessScreenProps {
  formData: Inquiry
  category: Category
  onStartOver: () => void
}

export function SuccessScreen({ formData, category, onStartOver }: SuccessScreenProps) {
  const addToCalendar = () => {
    const date = formData.desired_date
    const title = `Sunset Cinema - ${formData.name}`
    const details = `Sunset Cinema for ${formData.name}.`

    const startDate = format(date, "yyyyMMdd")
    const endDate = format(date, "yyyyMMdd")

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}`

    window.open(googleCalendarUrl, "_blank")
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto text-center space-y-8 w-full"
      >
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold">감사합니다!</h2>
          <p className="text-xl">예약이 완료되었습니다.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">예약 요약</h3>

            <div className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground">이름:</div>
                <div className="font-medium">{formData.name}</div>

                <div className="text-muted-foreground">전화번호:</div>
                <div className="font-medium">{formData.phone}</div>

                <div className="text-muted-foreground">예약 날짜:</div>
                <div className="font-medium">{format(formData.desired_date, "yyyy년 MM월 dd일")}</div>

                <div className="text-muted-foreground">예약 시간:</div>
                <div className="font-medium">{formData.selected_slot_id.start_time} - {formData.selected_slot_id.end_time}</div>

                <div className="text-muted-foreground">인원:</div>
                <div className="font-medium">{formData.people_count}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2 text-muted-foreground">
          <p>신청 후 영업일 기준 2-3일 이내에 예약 연락을 드립니다. (카카오톡 메시지 확인)</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button onClick={addToCalendar} variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            캘린더에 추가
          </Button>

          <Button onClick={onStartOver} className="flex items-center gap-2">
            다른 예약 하기
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
