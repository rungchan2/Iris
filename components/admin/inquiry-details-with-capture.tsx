"use client"

import { useRef } from "react"
import { format } from "date-fns"
import html2canvas from "html2canvas-pro"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Calendar, Clock, User, Phone, Instagram, Users, Heart } from "lucide-react"
import { toast } from "sonner"

interface InquiryDetailsWithCaptureProps {
  inquiry: any
  currentKeywords: any[]
  desiredKeywords: any[]
  photos: any[]
}

export function InquiryDetailsWithCapture({
  inquiry,
  currentKeywords,
  desiredKeywords,
  photos,
}: InquiryDetailsWithCaptureProps) {
  const captureRef = useRef<HTMLDivElement>(null)

  const handleCapture = async () => {
    if (!captureRef.current) return

    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        width: 1200,
        height: 800,
        useCORS: true,
      })

      const dataUrl = canvas.toDataURL("image/png", 0.95)

      // Download the image
      const link = document.createElement("a")
      link.download = `inquiry-${inquiry.name}-${format(new Date(), "yyyyMMdd")}.png`
      link.href = dataUrl
      link.click()

      toast.success("Screenshot downloaded successfully!")
    } catch (error) {
      console.error("Error capturing screenshot:", error)
      toast.error("Failed to capture screenshot")
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy년 MM월 dd일")
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "오후" : "오전"
    const displayHour = hour % 12 || 12
    return `${ampm} ${displayHour}:${minutes}`
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      new: { label: "신규", variant: "default" as const },
      contacted: { label: "연락완료", variant: "secondary" as const },
      completed: { label: "완료", variant: "outline" as const },
    }
    return statusMap[status as keyof typeof statusMap] || statusMap.new
  }

  const getGenderLabel = (gender: string) => {
    const genderMap = {
      male: "남성",
      female: "여성",
      other: "기타",
    }
    return genderMap[gender as keyof typeof genderMap] || gender
  }

  return (
    <div className="space-y-6">
      {/* Capture Button */}
      <div className="flex justify-end">
        <Button onClick={handleCapture} className="gap-2">
          <Download className="h-4 w-4" />
          Download as Image
        </Button>
      </div>

      {/* Capturable Content */}
      <div ref={captureRef} className="bg-white p-8 space-y-8">
        {/* Header */}
        <div className="text-center border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">촬영 문의 상세</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span>문의번호: {inquiry.id.slice(0, 8)}</span>
            <span>•</span>
            <span>접수일: {format(new Date(inquiry.created_at), "yyyy.MM.dd")}</span>
            <Badge {...getStatusBadge(inquiry.status)}>{getStatusBadge(inquiry.status).label}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Customer & Booking Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  고객 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">이름</p>
                    <p className="text-lg font-semibold">{inquiry.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">성별</p>
                    <p className="text-lg">{inquiry.gender ? getGenderLabel(inquiry.gender) : "-"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    연락처
                  </p>
                  <p className="text-lg font-mono">{inquiry.phone}</p>
                </div>

                {inquiry.instagram_id && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Instagram className="h-4 w-4" />
                      인스타그램
                    </p>
                    <p className="text-lg">@{inquiry.instagram_id}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      인원수
                    </p>
                    <p className="text-lg">{inquiry.people_count}명</p>
                  </div>
                  {inquiry.relationship && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">관계</p>
                      <p className="text-lg">{inquiry.relationship}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Booking Information */}
            {inquiry.available_slots && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    예약 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">촬영 날짜</p>
                    <p className="text-xl font-semibold">{formatDate(inquiry.available_slots.date)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      시간
                    </p>
                    <p className="text-lg">
                      {formatTime(inquiry.available_slots.start_time)} - {formatTime(inquiry.available_slots.end_time)}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      45분
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">담당 작가</p>
                    <p className="text-lg font-semibold">{inquiry.available_slots.admin_users?.name}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mood Keywords */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  분위기 키워드
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentKeywords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">현재 분위기</p>
                    <div className="flex flex-wrap gap-2">
                      {currentKeywords.map((keyword) => (
                        <Badge key={keyword.id} variant="outline" className="bg-blue-50">
                          {keyword.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {desiredKeywords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">원하는 분위기</p>
                    <div className="flex flex-wrap gap-2">
                      {desiredKeywords.map((keyword) => (
                        <Badge key={keyword.id} variant="outline" className="bg-green-50">
                          {keyword.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Special Requests & Notes */}
            {(inquiry.special_request || inquiry.difficulty_note || inquiry.admin_notes) && (
              <Card>
                <CardHeader>
                  <CardTitle>요청사항 및 메모</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {inquiry.special_request && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">특별 요청사항</p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">{inquiry.special_request}</p>
                    </div>
                  )}

                  {inquiry.difficulty_note && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">어려운 점</p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">{inquiry.difficulty_note}</p>
                    </div>
                  )}

                  {inquiry.admin_notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">작가 메모</p>
                      <p className="text-gray-700 bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                        {inquiry.admin_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Photo Gallery */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>선택된 카테고리</CardTitle>
              </CardHeader>
              <CardContent>
                {inquiry.categories ? (
                  <div>
                    <p className="text-lg font-semibold">{inquiry.categories.name}</p>
                    <p className="text-sm text-gray-500">{inquiry.categories.path}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">카테고리가 선택되지 않았습니다</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>참고 사진</CardTitle>
              </CardHeader>
              <CardContent>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.slice(0, 9).map((photo) => (
                      <div key={photo.id} className="aspect-square overflow-hidden rounded">
                        <img
                          src={photo.storage_url || "/placeholder.svg"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">참고 사진이 없습니다</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
