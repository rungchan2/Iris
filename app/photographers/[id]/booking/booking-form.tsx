'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar } from '@/components/ui/calendar'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Camera,
  Star,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface BookingFormProps {
  photographer: any
}

export function BookingForm({ photographer }: BookingFormProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    instagramId: '',
    gender: '',
    peopleCount: '1',
    relationship: '',
    specialRequest: '',
    personalityCode: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const initials = photographer.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  const primaryPersonality = photographer.personality_admin_mapping?.find((m: any) => m.is_primary)
  const portfolioCount = photographer.admin_portfolio_photos?.length || 0
  const experience = Math.floor((new Date().getTime() - new Date(photographer.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)) + 1
  // Generate deterministic rating based on photographer ID to avoid hydration issues
  const rating = portfolioCount > 0 ? 4.5 + (photographer.id.charCodeAt(0) % 5) / 10 : undefined

  // Mock available time slots
  const timeSlots = [
    '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Mock submission delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">예약 완료!</h1>
              <p className="text-muted-foreground">
                예약이 성공적으로 접수되었습니다. 곧 연락드리겠습니다.
              </p>
            </div>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">작가</span>
                    <span className="font-medium">{photographer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">일시</span>
                    <span className="font-medium">
                      {selectedDate && format(selectedDate, 'yyyy년 M월 d일', { locale: ko })} {selectedTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">신청자</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button className="w-full" onClick={() => router.push('/')}>
                홈으로 돌아가기
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/photographers/${photographer.id}`}>
                  작가 프로필 보기
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/photographers/${photographer.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로가기
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">촬영 예약</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>기본 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">이름 *</Label>
                        <Input
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="성함을 입력해주세요"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">연락처 *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="010-0000-0000"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">이메일</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="example@email.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="instagram">인스타그램 ID</Label>
                        <Input
                          id="instagram"
                          value={formData.instagramId}
                          onChange={(e) => handleInputChange('instagramId', e.target.value)}
                          placeholder="@instagram_id"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="gender">성별</Label>
                        <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">남성</SelectItem>
                            <SelectItem value="female">여성</SelectItem>
                            <SelectItem value="other">기타</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="people">인원수</Label>
                        <Select value={formData.peopleCount} onValueChange={(value) => handleInputChange('peopleCount', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1명</SelectItem>
                            <SelectItem value="2">2명</SelectItem>
                            <SelectItem value="3">3명</SelectItem>
                            <SelectItem value="4">4명</SelectItem>
                            <SelectItem value="5+">5명 이상</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="relationship">관계</Label>
                        <Select value={formData.relationship} onValueChange={(value) => handleInputChange('relationship', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">개인</SelectItem>
                            <SelectItem value="couple">커플</SelectItem>
                            <SelectItem value="family">가족</SelectItem>
                            <SelectItem value="friends">친구</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Date & Time Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>촬영 일정</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-base mb-3 block">날짜 선택</Label>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date() || date.getDay() === 0}
                          className="rounded-md border"
                        />
                      </div>
                      <div>
                        <Label className="text-base mb-3 block">시간 선택</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map((time) => (
                            <Button
                              key={time}
                              type="button"
                              variant={selectedTime === time ? "default" : "outline"}
                              className="h-12"
                              onClick={() => setSelectedTime(time)}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Special Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle>특별 요청사항</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={formData.specialRequest}
                      onChange={(e) => handleInputChange('specialRequest', e.target.value)}
                      placeholder="원하는 컨셉, 장소, 스타일 등을 자유롭게 적어주세요"
                      rows={4}
                    />
                  </CardContent>
                </Card>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={!selectedDate || !selectedTime || !formData.name || !formData.phone || isSubmitting}
                >
                  {isSubmitting ? '예약 중...' : '예약 신청하기'}
                </Button>
              </form>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Photographer Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={photographer.profile_image_url} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {rating && (
                        <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5 text-xs">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>{rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{photographer.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>서울</span>
                      </div>
                      {primaryPersonality && (
                        <Badge variant="default" className="text-xs">
                          {primaryPersonality.personality_types?.code}: {primaryPersonality.personality_types?.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{experience}</div>
                      <div className="text-xs text-muted-foreground">년 경력</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{portfolioCount}</div>
                      <div className="text-xs text-muted-foreground">개 작품</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Summary */}
              {(selectedDate || selectedTime) && (
                <Card>
                  <CardHeader>
                    <CardTitle>예약 요약</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedDate && (
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(selectedDate, 'yyyy년 M월 d일 (E)', { locale: ko })}
                        </span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{selectedTime}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notice */}
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">📋 예약 안내</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 예약 후 24시간 내 연락드립니다</li>
                    <li>• 촬영 3일 전까지 변경 가능합니다</li>
                    <li>• 날씨 등으로 인한 연기 시 협의 후 조정</li>
                    <li>• 결과물은 촬영 후 1-2주 내 전달</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}