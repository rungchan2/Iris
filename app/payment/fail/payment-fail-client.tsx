"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getTossErrorMessage } from '@/lib/payments/toss-client';
import { paymentLogger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';

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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(true);

  const errorMessage = code
    ? getTossErrorMessage(code)
    : message || '결제 처리 중 오류가 발생했습니다.';

  // 결제 실패 상태 업데이트
  useEffect(() => {
    async function updateFailureStatus() {
      if (!orderId || !code || !message) {
        setIsUpdatingStatus(false);
        return;
      }

      try {
        paymentLogger.error('결제 실패 페이지 진입', { code, message, orderId });

        const supabase = createClient();

        // 결제 정보 조회
        const { data: payment } = await supabase
          .from('payments')
          .select('id, status, inquiry_id')
          .eq('order_id', orderId)
          .single();

        if (!payment) {
          paymentLogger.error('결제 정보 없음 (실패 처리)', { orderId });
          setIsUpdatingStatus(false);
          return;
        }

        // 이미 실패 처리된 경우
        if (payment.status === 'failed') {
          paymentLogger.info('이미 실패 처리된 결제', { orderId, paymentId: payment.id });
          setIsUpdatingStatus(false);
          return;
        }

        // 실패한 결제 정보 업데이트
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'failed',
            error_message: `${code}: ${message}`,
            failed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId)
          .in('status', ['pending', 'processing']);  // pending 또는 processing만 failed로 변경

        if (updateError) {
          paymentLogger.error('결제 실패 상태 업데이트 오류', { orderId, error: updateError });
        } else {
          paymentLogger.info('결제 실패 상태 업데이트 성공', { orderId, paymentId: payment.id });
        }

        // 연결된 inquiry 상태를 payment_failed로 업데이트
        if (payment.inquiry_id) {
          const { error: inquiryUpdateError } = await supabase
            .from('inquiries')
            .update({
              status: 'payment_failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.inquiry_id)
            .eq('status', 'pending_payment');  // pending_payment만 payment_failed로 변경

          if (inquiryUpdateError) {
            paymentLogger.error('문의 상태 업데이트 실패', {
              inquiryId: payment.inquiry_id,
              error: inquiryUpdateError
            });
          } else {
            paymentLogger.info('문의 상태를 payment_failed로 업데이트', {
              inquiryId: payment.inquiry_id,
              orderId
            });
          }
        }

        // 결제 실패 로그 기록
        await supabase
          .from('payment_logs')
          .insert({
            payment_id: payment.id,
            event_type: 'payment_failed',
            provider: 'toss',
            request_data: { code, message, orderId },
            error_message: `${code}: ${message}`,
            created_at: new Date().toISOString()
          });

        paymentLogger.info('결제 실패 로그 기록 완료', { orderId, paymentId: payment.id });
      } catch (err) {
        paymentLogger.error('결제 실패 처리 중 오류', err);
      } finally {
        setIsUpdatingStatus(false);
      }
    }

    updateFailureStatus();
  }, [code, message, orderId]);

  // 상태 업데이트 중일 때 로딩 표시
  if (isUpdatingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">결제 상태를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

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

