'use client'

import { photographerLogger } from '@/lib/logger';
import React, { useState } from 'react'
import { PersonalInfoForm } from '@/components/booking/personal-info-form'
import { SuccessScreen } from '@/components/booking/success-screen'
import { createClient } from '@/lib/supabase/client'
import { Toaster, toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, MapPin, Star, Camera } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { sendEmail } from '@/lib/send-email'
import { getSlot } from '@/lib/available-slots'
import type {
  InquiryFormValues,
  MoodKeyword,
  Inquiry,
} from '@/types/inquiry.types'

const EMAIL_TO = [
  "chajimmy1214@gmail.com",
  "mingoyoung809@gmail.com"
]

interface PhotographerBookingPageProps {
  photographer: any
}

export function PhotographerBookingPage({ photographer }: PhotographerBookingPageProps) {
  const [step, setStep] = useState<"personal-info" | "success">("personal-info")
  const [formData, setFormData] = useState<InquiryFormValues | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newInquiry, setNewInquiry] = useState<Inquiry | null>(null)
  // Removed moodKeywords - no longer using keywords table
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [paymentData, setPaymentData] = useState<any>(null)

  const supabase = createClient()

  const initials = photographer.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  const primaryPersonality = photographer.personality_admin_mapping?.find((m: any) => m.is_primary)
  const portfolioCount = photographer.photos?.length || 0
  const experience = Math.floor((new Date().getTime() - new Date(photographer.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)) + 1
  // Generate deterministic rating based on photographer ID to avoid hydration issues
  const rating = portfolioCount > 0 ? 4.5 + (photographer.id.charCodeAt(0) % 5) / 10 : undefined

  // Fetch mood keywords and available dates on component mount
  React.useEffect(() => {
    const fetchData = async () => {
      // Removed mood keywords fetching - no longer using keywords table

      // Fetch available dates for this specific photographer
      const currentDate = new Date()
      const threeMonthsLater = new Date()
      threeMonthsLater.setMonth(currentDate.getMonth() + 3)

      const { data: availableSlots } = await supabase
        .from('available_slots')
        .select('date')
        .eq('admin_id', photographer.id) // Filter by photographer ID
        .eq('is_available', true)
        .gte('date', currentDate.toISOString().split('T')[0])
        .lte('date', threeMonthsLater.toISOString().split('T')[0])
        .order('date')

      if (availableSlots) {
        const dates = [...new Set(availableSlots.map(slot => slot.date))]
        setAvailableDates(dates)
      }
    }

    fetchData()
  }, [supabase, photographer.id])

  const handlePersonalInfoSubmit = async (data: InquiryFormValues) => {
    setFormData(data)
    setIsSubmitting(true)

    try {
      // Submit inquiry directly (payment is handled in the form)
      let retryCount = 0
      let insertResult = null
      let insertError = null

      while (retryCount < 3) {
        try {
          const { data: newInquiry, error } = await supabase
            .from('inquiries')
            .insert({
              name: data.name,
              instagram_id: data.instagram_id || null,
              gender: data.gender,
              phone: data.phone,
              desired_date: format(data.desired_date, 'yyyy-MM-dd'),
              selected_slot_id: data.selected_slot_id || null,
              people_count: data.people_count,
              relationship: data.relationship || null,
              current_mood_keywords: data.current_mood_keywords,
              desired_mood_keywords: data.desired_mood_keywords,
              special_request: data.special_request || null,
              difficulty_note: data.difficulty_note || null,
              conversation_preference: data.conversation_preference || null,
              conversation_topics: data.conversation_topics || null,
              favorite_music: data.favorite_music || null,
              shooting_meaning: data.shooting_meaning || null,
              selected_category_id: null, // No category selection for photographer booking
              selection_path: [photographer.name], // Use photographer name as path
              selection_history: {
                steps: [{
                  type: 'photographer_selection',
                  photographer_id: photographer.id,
                  photographer_name: photographer.name,
                  timestamp: new Date().toISOString()
                }],
                completed_at: new Date().toISOString(),
              },
              matched_admin_id: photographer.id, // Add photographer ID for proper linking
              photographer_id: photographer.id, // Set photographer_id FK for direct filtering
              status: data.paymentKey ? 'reserved' : 'new', // If payment was completed, set as reserved
            } as any)
            .select()
            .single()

          const { data: getSlotData, error: slotError } = await getSlot(data.selected_slot_id || "")

          if (error || slotError) {
            insertError = error
            photographerLogger.info(`Insert attempt ${retryCount + 1} failed:`, error)

            if (error && error.code === "42501") {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * (retryCount + 1))
              )
              retryCount++
              continue
            } else {
              throw error
            }
          }

          const emailBody = `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>새로운 촬영 문의</title>
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f8f9fa;
                }
                .container {
                  background-color: white;
                  border-radius: 12px;
                  padding: 30px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                  text-align: center;
                  border-bottom: 3px solid #e74c3c;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
                }
                .header h1 {
                  color: #2c3e50;
                  margin: 0;
                  font-size: 28px;
                  font-weight: 600;
                }
                .section {
                  margin-bottom: 25px;
                  padding: 20px;
                  background-color: #f8f9fa;
                  border-radius: 8px;
                  border-left: 4px solid #3498db;
                }
                .photographer-info {
                  background-color: #e8f5e8;
                  border-left: 4px solid #28a745;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📸 작가 지정 촬영 문의</h1>
                  <p>새로운 문의가 접수되었습니다</p>
                </div>

                <div class="section photographer-info">
                  <h2>🎯 지정 작가</h2>
                  <p><strong>${photographer.name}</strong> 작가를 지정하여 문의가 접수되었습니다.</p>
                </div>

                <div class="section">
                  <h2>👤 기본 정보</h2>
                  <p><strong>이름:</strong> ${data.name}</p>
                  <p><strong>전화번호:</strong> ${data.phone}</p>
                  ${data.instagram_id ? `<p><strong>인스타그램:</strong> @${data.instagram_id}</p>` : ''}
                  <p><strong>성별:</strong> ${data.gender === 'male' ? '남성' : data.gender === 'female' ? '여성' : '기타'}</p>
                  <p><strong>인원수:</strong> ${data.people_count}명</p>
                  ${data.relationship ? `<p><strong>관계:</strong> ${data.relationship}</p>` : ''}
                </div>

                <div class="section">
                  <h2>📅 예약 정보</h2>
                  <p><strong>희망 날짜:</strong> ${data.desired_date.toLocaleDateString('ko-KR')}</p>
                  ${data.selected_slot_id ? `<p><strong>선택한 시간대:</strong> ${getSlotData?.start_time} - ${getSlotData?.end_time}</p>` : ''}
                </div>

                ${data.special_request || data.difficulty_note ? `
                <div class="section">
                  <h2>📝 추가 정보</h2>
                  ${data.special_request ? `<p><strong>특별 요청사항:</strong> ${data.special_request}</p>` : ''}
                  ${data.difficulty_note ? `<p><strong>촬영 시 어려운 점:</strong> ${data.difficulty_note}</p>` : ''}
                </div>` : ''}

                <div class="footer">
                  <p>이 문의는 ${new Date().toLocaleString('ko-KR')}에 접수되었습니다.</p>
                  <p>빠른 시일 내에 연락드리겠습니다. 감사합니다! 🎉</p>
                </div>
              </div>
            </body>
            </html>
          `

          sendEmail(EMAIL_TO, `[kindt] ${photographer.name} 작가 지정 문의가 접수되었습니다.`, emailBody)

          // 추가 데이터 조회하여 완전한 Inquiry 객체 구성
          let slotData = null
          if (data.selected_slot_id) {
            const { data: slot } = await supabase
              .from('available_slots')
              .select('id, date, start_time, end_time')
              .eq('id', data.selected_slot_id)
              .single()
            slotData = slot
          }

          insertResult = {
            ...newInquiry,
            selected_slot_id: slotData,
            current_mood_keywords: [],
            desired_mood_keywords: [],
            selection_history: {
              steps: [{
                type: 'photographer_selection',
                photographer_id: photographer.id,
                photographer_name: photographer.name,
                timestamp: new Date().toISOString()
              }],
              completed_at: new Date().toISOString(),
            } as any,
            desired_date: newInquiry.desired_date,
          } as Inquiry

          // Move directly to success since payment is handled in the form
          setNewInquiry(insertResult)
          setStep('success')
          break
        } catch (error) {
          insertError = error
          retryCount++
          if (retryCount >= 3) break
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          )
        }
      }

      if (insertError && !insertResult) {
        throw insertError
      }

      // Success message - payment is handled in the form
      const successMessage = data.paymentKey 
        ? '결제가 완료되었습니다! 예약이 확정되었습니다.'
        : '예약 정보가 저장되었습니다.';
      toast.success(successMessage)
    } catch (error: any) {
      photographerLogger.error('Error submitting inquiry:', error)
      
      if (
        error?.code === "42501" ||
        error?.message?.includes("row-level security")
      ) {
        photographerLogger.error("RLS Policy violation detected")
        toast.error(
          "알 수 없는 오류가 발생하였습니다. 페이지를 새로고침합니다."
        )

        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        toast.error("문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.")
      }

      setNewInquiry(null)
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleStartOver = () => {
    setStep('personal-info')
    setFormData(null)
    setNewInquiry(null)
    setPaymentData(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      
      {/* Photographer Hero Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/photographers/${photographer.id}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  작가 프로필로 돌아가기
                </Link>
              </Button>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage src={photographer.profileImage} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {rating && (
                    <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white px-2 py-1 rounded-full flex items-center gap-1 text-sm">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h1 className="text-3xl font-bold mb-2">{photographer.name} 작가</h1>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">서울</span>
                  </div>
                  {primaryPersonality && (
                    <Badge variant="default" className="mb-3">
                      {primaryPersonality.personality_types?.code}: {primaryPersonality.personality_types?.name}
                    </Badge>
                  )}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Camera className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">{experience}년 경력</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{portfolioCount}개 작품</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:ml-auto">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3">📸 작가 지정 예약</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {photographer.name} 작가와 함께하는 특별한 촬영을 예약하세요.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 작가 맞춤형 컨셉 제안</li>
                      <li>• 개인 취향 반영 촬영</li>
                      <li>• 전문적인 포트폴리오</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="container mx-auto py-8 px-4">
        {step === 'personal-info' && (
          <div className="min-h-[100vh] flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <PersonalInfoForm
                onSubmit={handlePersonalInfoSubmit}
                // Removed moodKeywords prop
                availableDates={availableDates}
                photographerId={photographer.id}
                photographer={{
                  id: photographer.id,
                  name: photographer.name
                }}
              />
            </div>
          </div>
        )}


        {step === 'success' && formData && newInquiry && (
          <div className="min-h-[100vh] flex items-center justify-center">
            <SuccessScreen
              formData={newInquiry}
              category={{
                id: photographer.id,
                name: photographer.name,
                path: '',
                parent_id: null,
                depth: 1,
                display_order: 1,
                is_active: true,
                representative_image_url: photographer.profileImage || null,
                representative_image: null,
                male_clothing_recommendation: null,
                female_clothing_recommendation: null,
                accessories_recommendation: null
              }}
              onStartOver={handleStartOver}
            />
          </div>
        )}
      </div>
    </>
  )
}