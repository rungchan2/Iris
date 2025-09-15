'use client';

import { useEffect, useState } from 'react';
import { getTossPayments, formatAmount, generateOrderId, getSuccessUrl, getFailUrl, getTossErrorMessage } from '@/lib/payments/toss-client';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TossPaymentFormProps {
  inquiry: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  product: {
    id: string;
    name: string;
    price: number;
    photographer_id: string;
  };
  photographer: {
    id: string;
    name: string;
  };
  onPaymentComplete?: (paymentKey: string, orderId: string) => void;
  onPaymentError?: (error: string) => void;
}

export function TossPaymentForm({
  inquiry,
  product,
  photographer,
  onPaymentComplete,
  onPaymentError,
}: TossPaymentFormProps) {
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [orderId] = useState(generateOrderId());

  // TossPayments 초기화
  useEffect(() => {
    async function initTossPayments() {
      try {
        setLoading(true);
        setError(null);
        
        const tossPaymentsInstance = await getTossPayments();
        // payment 인스턴스 생성 (비회원 결제)
        const paymentInstance = tossPaymentsInstance.payment({
          customerKey: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        setPayment(paymentInstance);
      } catch (err) {
        console.error('TossPayments 초기화 실패:', err);
        setError('결제 시스템 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
        onPaymentError?.('결제 시스템 초기화 실패');
      } finally {
        setLoading(false);
      }
    }
    
    initTossPayments();
  }, [onPaymentError]);

  // 결제 요청
  const handlePayment = async () => {
    if (!payment) {
      setError('결제 시스템이 준비되지 않았습니다.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // 결제창 호출
      await payment.requestPayment({
        method: 'CARD', // 카드 결제
        amount: {
          currency: 'KRW',
          value: product.price,
        },
        orderId: orderId,
        orderName: `${product.name} - ${photographer.name}`,
        successUrl: getSuccessUrl(orderId),
        failUrl: getFailUrl(orderId),
        customerEmail: inquiry.email,
        customerName: inquiry.name,
        customerMobilePhone: inquiry.phone,
        // 카드 결제에 필요한 정보
        card: {
          useEscrow: false,
          flowMode: 'DEFAULT',
          useCardPoint: false,
          useAppCardOnly: false,
        },
      });
    } catch (err: any) {
      console.error('결제 요청 실패:', err);
      
      // 에러 처리
      if (err.code === 'USER_CANCEL') {
        setError('결제를 취소하셨습니다.');
      } else {
        const errorMessage = getTossErrorMessage(err.code) || err.message || '결제 처리 중 오류가 발생했습니다.';
        setError(errorMessage);
        onPaymentError?.(errorMessage);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">결제 시스템을 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 주문 정보 */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">주문 정보</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">상품명</span>
            <span className="font-medium">{product.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">작가</span>
            <span className="font-medium">{photographer.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">예약자</span>
            <span className="font-medium">{inquiry.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">주문번호</span>
            <span className="font-medium text-xs">{orderId}</span>
          </div>
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">결제 금액</span>
              <span className="text-xl font-bold text-blue-600">
                {formatAmount(product.price)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 결제 방법 안내 */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">결제 방법</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>• 카드 결제가 가능합니다</p>
          <p>• 결제 진행 시 토스페이먼츠 결제창으로 이동합니다</p>
          <p>• 안전한 결제를 위해 3D Secure 인증이 필요할 수 있습니다</p>
        </div>
      </div>

      {/* 결제 버튼 */}
      <Button
        onClick={handlePayment}
        disabled={!payment || processing}
        className="w-full h-14 text-lg font-semibold"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            결제 진행 중...
          </>
        ) : (
          `${formatAmount(product.price)} 결제하기`
        )}
      </Button>

      {/* 안내 문구 */}
      <div className="text-center text-sm text-gray-500">
        <p>결제 진행 시 결제 대행사인 토스페이먼츠로 이동합니다.</p>
        <p>결제 완료 후 예약이 확정되며, 작가님께 알림이 전송됩니다.</p>
      </div>
    </div>
  );
}