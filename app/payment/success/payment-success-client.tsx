"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { confirmTossPayment } from '@/lib/actions/toss-payments';
import { formatAmount } from '@/lib/payments/toss-client';

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
  const [paymentResult, setPaymentResult] = useState<any>(null);
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

        const result = await confirmTossPayment(formData);

        if (result.error) {
          setError(result.error);
        } else {
          setPaymentResult(result);
        }
      } catch (err) {
        console.error('결제 확인 실패:', err);
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
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-green-600">결제가 완료되었습니다!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentResult && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">주문번호</span>
                <span className="font-medium">{paymentResult.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제금액</span>
                <span className="font-medium">{formatAmount(paymentResult.amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제방법</span>
                <span className="font-medium">카드</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제일시</span>
                <span className="font-medium">{new Date().toLocaleString('ko-KR')}</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">다음 단계</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 작가님께서 곧 연락드릴 예정입니다</li>
              <li>• 촬영 일정을 확정하겠습니다</li>
              <li>• 궁금한 점이 있으시면 언제든 문의해주세요</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => router.push('/')} className="w-full">
              홈으로 돌아가기
            </Button>
            <Button variant="outline" onClick={() => router.push('/photographers')} className="w-full">
              다른 작가 둘러보기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
