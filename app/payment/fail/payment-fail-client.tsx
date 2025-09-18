"use client";

import { useRouter } from 'next/navigation';
import { XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getTossErrorMessage } from '@/lib/payments/toss-client';

export default function PaymentFailClient({
  code,
  message,
  orderId,
}: {
  code?: string;
  message?: string;
  orderId?: string;
}) {
  const router = useRouter();

  const errorMessage = code
    ? getTossErrorMessage(code)
    : message || '결제 처리 중 오류가 발생했습니다.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-red-600">결제가 실패했습니다</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
          </Alert>

          {orderId && (
            <div className="text-center text-sm text-gray-600">
              <p>주문번호: {orderId}</p>
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">결제 실패 시 확인사항</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 카드 한도 및 잔액을 확인해주세요</li>
              <li>• 카드 정보가 정확한지 확인해주세요</li>
              <li>• 해외결제 차단 설정을 확인해주세요</li>
              <li>• 다른 결제수단을 시도해보세요</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => router.back()} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 결제하기
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              홈으로 돌아가기
            </Button>
            <Button variant="ghost" onClick={() => router.push('/photographers')} className="w-full">
              다른 작가 둘러보기
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 pt-2">
            <p>문제가 지속될 경우 고객센터로 문의해주세요.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

