'use client';

import { useEffect, useRef, useState } from 'react';
import { getTossPayments, formatAmount, generateOrderId, getSuccessUrl, getFailUrl, getTossErrorMessage } from '@/lib/payments/toss-client';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TossPaymentWidgetProps {
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
  customerKey: string;
  onPaymentComplete?: (paymentKey: string, orderId: string) => void;
  onPaymentError?: (error: string) => void;
}

export function TossPaymentWidget({
  inquiry,
  product,
  photographer,
  customerKey,
  onPaymentComplete,
  onPaymentError,
}: TossPaymentWidgetProps) {
  const [widgets, setWidgets] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(product.price);
  
  const paymentMethodsWidgetRef = useRef<any>(null);
  const agreementWidgetRef = useRef<any>(null);
  const orderIdRef = useRef<string>(generateOrderId());

  // 결제위젯 초기화
  useEffect(() => {
    async function initWidgets() {
      try {
        setLoading(true);
        setError(null);
        
        const tossPayments = await getTossPayments();
        const widgetInstance = tossPayments.widgets({ 
          customerKey,
        });
        
        setWidgets(widgetInstance);
      } catch (err) {
        console.error('결제위젯 초기화 실패:', err);
        setError('결제 시스템 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
        onPaymentError?.('결제 시스템 초기화 실패');
      } finally {
        setLoading(false);
      }
    }
    
    initWidgets();
  }, [customerKey, onPaymentError]);

  // 위젯 렌더링
  useEffect(() => {
    if (!widgets) return;

    async function renderWidgets() {
      try {
        // 금액 설정
        await widgets.setAmount({
          currency: 'KRW',
          value: amount,
        });

        // 결제 방법 위젯 렌더링
        if (!paymentMethodsWidgetRef.current) {
          paymentMethodsWidgetRef.current = await widgets.renderPaymentMethods({
            selector: '#payment-methods',
            variantKey: 'DEFAULT',
          });
        } else {
          // 금액 업데이트
          await paymentMethodsWidgetRef.current.updateAmount(amount);
        }

        // 약관 위젯 렌더링
        if (!agreementWidgetRef.current) {
          agreementWidgetRef.current = await widgets.renderAgreement({
            selector: '#agreement',
            variantKey: 'AGREEMENT',
          });
        }

        setReady(true);
      } catch (err) {
        console.error('위젯 렌더링 실패:', err);
        setError('결제 화면 로딩에 실패했습니다.');
      }
    }

    renderWidgets();
  }, [widgets, amount]);

  // 쿠폰/할인 적용
  const applyDiscount = async (discountAmount: number) => {
    const newAmount = Math.max(0, product.price - discountAmount);
    setAmount(newAmount);
  };

  // 결제 요청
  const handlePayment = async () => {
    if (!widgets) {
      setError('결제 시스템이 준비되지 않았습니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 결제 요청
      await widgets.requestPayment({
        orderId: orderIdRef.current,
        orderName: `${product.name} - ${photographer.name}`,
        successUrl: getSuccessUrl(orderIdRef.current),
        failUrl: getFailUrl(orderIdRef.current),
        customerEmail: inquiry.email,
        customerName: inquiry.name,
        customerMobilePhone: inquiry.phone,
        // 메타데이터로 추가 정보 전달
        metadata: {
          inquiryId: inquiry.id,
          productId: product.id,
          photographerId: photographer.id,
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
      setLoading(false);
    }
  };

  if (loading && !widgets) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between">
              <span className="text-gray-900 font-medium">결제 금액</span>
              <span className="text-xl font-bold text-blue-600">
                {formatAmount(amount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 결제 수단 선택 */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">결제 수단</h2>
        <div id="payment-methods" className="min-h-[200px]" />
      </div>

      {/* 약관 동의 */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">이용 약관</h2>
        <div id="agreement" className="min-h-[100px]" />
      </div>

      {/* 결제 버튼 */}
      <Button
        onClick={handlePayment}
        disabled={!ready || loading}
        className="w-full h-14 text-lg font-semibold"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            처리 중...
          </>
        ) : (
          `${formatAmount(amount)} 결제하기`
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