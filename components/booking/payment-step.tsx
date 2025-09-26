'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CreditCard, Clock, User, Phone, Calendar } from 'lucide-react'
import { TossPaymentWidget } from '@/components/payment/toss-payment-widget'
import { createPaymentRequest } from '@/lib/actions/toss-payments'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PaymentStepProps {
  inquiry: any
  photographer: any
  onPaymentComplete: (paymentKey: string, orderId: string) => void
  onPaymentError: (error: string) => void
  onBack: () => void
}

export function PaymentStep({
  inquiry,
  photographer,
  onPaymentComplete,
  onPaymentError,
  onBack
}: PaymentStepProps) {
  const [paymentData, setPaymentData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentWidget, setShowPaymentWidget] = useState(false)

  // 기본 촬영 가격 (실제로는 photographer.products에서 가져와야 함)
  const basePrice = 150000 // 15만원
  const customerKey = `guest_${inquiry.id}` // 게스트 키

  // 결제 정보 생성
  const initializePayment = async () => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('inquiryId', inquiry.id)
      formData.append('amount', basePrice.toString())
      formData.append('orderName', `${photographer.name} 작가 촬영 예약`)
      formData.append('buyerName', inquiry.name)
      formData.append('buyerEmail', inquiry.email || '')
      formData.append('buyerTel', inquiry.phone)

      const result = await createPaymentRequest(formData)
      
      if (result.success) {
        setPaymentData(result)
        setShowPaymentWidget(true)
      } else {
        toast.error(result.error || '결제 준비 중 오류가 발생했습니다.')
        onPaymentError(result.error || '결제 준비 실패')
      }
    } catch (error) {
      console.error('Payment initialization error:', error)
      toast.error('결제 준비 중 오류가 발생했습니다.')
      onPaymentError('결제 준비 실패')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원'
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        예약 정보 수정
      </Button>

      {!showPaymentWidget ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 예약 정보 확인 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                예약 정보 확인
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">작가</span>
                  <span className="font-medium">{photographer.name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">예약자</span>
                  <span className="font-medium">{inquiry.name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">연락처</span>
                  <span className="font-medium">{inquiry.phone}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">희망 날짜</span>
                  <span className="font-medium">
                    {format(new Date(inquiry.desired_date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                  </span>
                </div>

                {inquiry.selected_slot_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">시간</span>
                    <span className="font-medium">
                      {inquiry.selected_slot_id.start_time} - {inquiry.selected_slot_id.end_time}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">인원</span>
                  <span className="font-medium">{inquiry.people_count}명</span>
                </div>

                {inquiry.special_request && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground block mb-1">특별 요청사항</span>
                    <p className="text-sm">{inquiry.special_request}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 결제 금액 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                결제 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">기본 촬영료</span>
                  <span className="font-medium">{formatPrice(basePrice)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>총 결제 금액</span>
                  <span className="text-blue-600">{formatPrice(basePrice)}</span>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  onClick={initializePayment}
                  disabled={isLoading}
                  className="w-full h-12"
                  size="lg"
                >
                  {isLoading ? '결제 준비 중...' : `${formatPrice(basePrice)} 결제하기`}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground mt-4 space-y-1">
                <p>• 결제 완료 후 예약이 확정됩니다.</p>
                <p>• 취소/환불 정책은 작가별로 상이할 수 있습니다.</p>
                <p>• 결제는 토스페이먼츠를 통해 안전하게 처리됩니다.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>결제하기</CardTitle>
            </CardHeader>
            <CardContent>
              <TossPaymentWidget
                inquiry={{
                  id: inquiry.id,
                  name: inquiry.name,
                  phone: inquiry.phone,
                  email: inquiry.email || undefined
                }}
                product={{
                  id: 'default-photography',
                  name: `${photographer.name} 작가 촬영`,
                  price: basePrice,
                  photographer_id: photographer.id
                }}
                photographer={{
                  id: photographer.id,
                  name: photographer.name
                }}
                customerKey={customerKey}
                orderId={paymentData?.orderId} // createPaymentRequest에서 받은 orderId 전달
                onPaymentComplete={onPaymentComplete}
                onPaymentError={onPaymentError}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}