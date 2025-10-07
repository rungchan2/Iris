"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle, Receipt, User, Calendar, Package, CreditCard, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { confirmTossPayment } from '@/lib/actions/toss-payments';
import { getPaymentByOrderId, type PaymentWithDetails } from '@/lib/actions/user-payments';
import { formatAmount } from '@/lib/payments/toss-client';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

export default function PaymentSuccessClient({
  paymentKey,
  orderId,
  amount,
}: {
  paymentKey?: string;
  orderId?: string;
  amount?: string;
}) {
  const [isConfirming, setIsConfirming] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<PaymentWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function confirmPayment() {
      if (!paymentKey || !orderId || !amount) {
        setError('결제 정보가 누락되었습니다.');
        setIsConfirming(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.append('paymentKey', paymentKey);
        formData.append('orderId', orderId);
        formData.append('amount', amount);

        // 1. Confirm payment with Toss
        const result = await confirmTossPayment(formData);

        if (result.error) {
          setError(result.error);
        } else {
          // 2. Fetch detailed payment information
          const detailsResult = await getPaymentByOrderId(orderId);
          if (detailsResult.success) {
            setPaymentDetails(detailsResult.data);
          }
        }
      } catch (err) {
        setError('결제 확인 중 오류가 발생했습니다.');
      } finally {
        setIsConfirming(false);
      }
    }

    confirmPayment();
  }, [paymentKey, orderId, amount]);

  if (isConfirming) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
          <h2 className="text-xl font-semibold mb-2">결제를 확인하고 있습니다</h2>
          <p className="text-gray-600">잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">결제 확인 실패</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push('/')} className="w-full">
                홈으로 돌아가기
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Success Header */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-green-900 mb-2">
                결제가 완료되었습니다!
              </h1>
              <p className="text-green-700">
                예약이 성공적으로 접수되었습니다
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              결제 정보
            </CardTitle>
            <CardDescription>결제가 정상적으로 처리되었습니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="text-sm text-purple-700 mb-1">결제 금액</div>
              <div className="text-3xl font-bold text-purple-900">
                {paymentDetails ? formatAmount(paymentDetails.amount) : amount ? formatAmount(parseInt(amount)) : '0원'}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  주문번호
                </span>
                <span className="font-mono text-sm">{orderId}</span>
              </div>

              {paymentDetails?.payment_method && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">결제 수단</span>
                  <span className="font-medium">{paymentDetails.payment_method}</span>
                </div>
              )}

              {paymentDetails?.paid_at && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    결제 일시
                  </span>
                  <span className="font-medium">
                    {format(new Date(paymentDetails.paid_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                  </span>
                </div>
              )}

              {paymentDetails?.receipt_url && (
                <div className="pt-2">
                  <a
                    href={paymentDetails.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Receipt className="w-4 h-4 mr-2" />
                      영수증 보기
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        {paymentDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                예약 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentDetails.product && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">상품명</div>
                  <div className="font-semibold text-lg">{paymentDetails.product.name}</div>
                </div>
              )}

              {paymentDetails.photographer && (
                <div>
                  <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    작가
                  </div>
                  <div className="font-medium">{paymentDetails.photographer.name}</div>
                  {paymentDetails.photographer.email && (
                    <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" />
                      {paymentDetails.photographer.email}
                    </div>
                  )}
                </div>
              )}

              {paymentDetails.inquiry && (
                <>
                  {paymentDetails.inquiry.desired_date && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        촬영 희망일
                      </div>
                      <div className="font-medium">
                        {format(new Date(paymentDetails.inquiry.desired_date), 'yyyy년 M월 d일', { locale: ko })}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm text-gray-600 mb-1">예약자명</div>
                    <div className="font-medium">{paymentDetails.inquiry.name}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              다음 단계
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>작가님께서 1-2일 내에 연락을 드립니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>촬영 일정과 장소를 확정합니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>촬영 당일 멋진 추억을 남기세요!</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-white rounded-md text-sm text-gray-700">
              궁금한 점이 있으시면 작가님께 직접 문의하시거나 고객센터로 연락주세요.
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/payments" className="flex-1">
            <Button variant="outline" className="w-full">
              <Receipt className="w-4 h-4 mr-2" />
              결제 내역 보기
            </Button>
          </Link>
          <Button onClick={() => router.push('/')} className="flex-1">
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
