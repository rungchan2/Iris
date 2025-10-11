'use client';

import { useEffect, useState } from 'react';
import { getTossPayments, formatAmount, getSuccessUrl, getFailUrl, getTossErrorMessage } from '@/lib/payments/toss-client';
import { createPaymentRequest } from '@/lib/actions/toss-payments';
import { createInquiryForPayment } from '@/lib/actions/inquiries';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { paymentLogger } from '@/lib/logger';
import type { TablesInsert } from '@/types/database.types';

interface TossPaymentFormProps {
  inquiryData: {
    name: string;
    phone: string;
    email?: string;
    gender: string;
    desired_date: string;
    selected_slot_id?: string;
    people_count: number;
    relationship?: string;
    special_request?: string;
    difficulty_note?: string;
    conversation_preference?: string;
    conversation_topics?: string;
    favorite_music?: string;
    shooting_meaning?: string;
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

const replaceHyphen = (phone: string) => {
  return phone.replace(/-/g, '');
};

export function TossPaymentForm({
  inquiryData,
  product,
  photographer,
  onPaymentComplete,
  onPaymentError,
}: TossPaymentFormProps) {
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [customerKey, setCustomerKey] = useState<string | null>(null);
  const [inquiryId, setInquiryId] = useState<string | null>(null);

  // TossPayments 초기화
  useEffect(() => {
    async function initTossPayments() {
      try {
        setLoading(true);
        setError(null);

        const tossPaymentsInstance = await getTossPayments();
        // payment 인스턴스 생성 (비회원 결제)
        const guestKey = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCustomerKey(guestKey);

        const paymentInstance = tossPaymentsInstance.payment({
          customerKey: guestKey
        });
        setPayment(paymentInstance);
      } catch (err) {
        paymentLogger.error('TossPayments 초기화 실패', err);
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
      // Step 1: Create inquiry before payment (status='pending_payment')
      paymentLogger.info('Creating inquiry before payment', {
        phone: inquiryData.phone,
        photographerId: photographer.id,
        productId: product.id
      });

      const inquiryResult = await createInquiryForPayment({
        name: inquiryData.name,
        phone: inquiryData.phone,
        gender: inquiryData.gender,
        desired_date: inquiryData.desired_date,
        selected_slot_id: inquiryData.selected_slot_id || null,
        people_count: inquiryData.people_count,
        relationship: inquiryData.relationship || null,
        special_request: inquiryData.special_request || null,
        difficulty_note: inquiryData.difficulty_note || null,
        conversation_preference: inquiryData.conversation_preference || null,
        conversation_topics: inquiryData.conversation_topics || null,
        favorite_music: inquiryData.favorite_music || null,
        shooting_meaning: inquiryData.shooting_meaning || null,
        photographer_id: photographer.id,
        product_id: product.id,
      });

      if (!inquiryResult.success || !inquiryResult.inquiryId) {
        setError(inquiryResult.error || '예약 정보 생성에 실패했습니다.');
        onPaymentError?.(inquiryResult.error || '예약 정보 생성 실패');
        return;
      }

      const createdInquiryId = inquiryResult.inquiryId;
      setInquiryId(createdInquiryId);

      paymentLogger.info('Inquiry created successfully', { inquiryId: createdInquiryId });

      // Step 2: 서버에 결제 준비 요청 (pending 상태로 DB 레코드 생성)
      const formData = new FormData();
      formData.append('inquiryId', createdInquiryId);
      formData.append('productId', product.id);
      formData.append('amount', product.price.toString());
      formData.append('orderName', `${product.name} - ${photographer.name}`);
      formData.append('buyerName', inquiryData.name);
      formData.append('buyerEmail', inquiryData.email || '');
      formData.append('buyerTel', inquiryData.phone);

      paymentLogger.info('결제 준비 요청 (클라이언트)', {
        inquiryId: createdInquiryId,
        productId: product.id,
        amount: product.price
      });

      const prepareResult = await createPaymentRequest(formData);

      if (!prepareResult.success || !prepareResult.orderId) {
        setError(prepareResult.error || '결제 준비에 실패했습니다.');
        onPaymentError?.(prepareResult.error || '결제 준비 실패');
        return;
      }

      const { orderId, paymentId } = prepareResult;

      paymentLogger.info('결제 준비 완료 (클라이언트)', { orderId, paymentId });

      // Step 3: Toss 결제창 호출
      await payment.requestPayment({
        method: 'CARD', // 카드 결제
        amount: {
          currency: 'KRW',
          value: product.price,
        },
        orderId: orderId,  // ✅ 서버에서 받은 orderId 사용
        orderName: `${product.name} - ${photographer.name}`,
        successUrl: getSuccessUrl(orderId),
        failUrl: getFailUrl(orderId),
        customerEmail: inquiryData.email,
        customerName: inquiryData.name,
        customerMobilePhone: replaceHyphen(inquiryData.phone),
        // 카드 결제에 필요한 정보
        card: {
          useEscrow: false,
          flowMode: 'DEFAULT',
          useCardPoint: false,
          useAppCardOnly: false,
        },
      });
    } catch (err: any) {
      paymentLogger.error('결제 요청 실패 (클라이언트)', err);

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
            <span className="font-medium">{inquiryData.name}</span>
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