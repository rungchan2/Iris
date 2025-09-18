import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/payments/toss-server';
import type { TossWebhookEvent } from '@/lib/payments/toss-types';

/**
 * TossPayments 웹훅 처리 엔드포인트
 * 
 * 지원하는 이벤트:
 * - PAYMENT.DONE: 결제 완료
 * - PAYMENT.CANCELED: 결제 취소
 * - PAYMENT.PARTIAL_CANCELED: 부분 취소
 * - PAYMENT.ABORTED: 결제 실패
 * - PAYMENT.EXPIRED: 결제 만료
 * - VIRTUAL_ACCOUNT.DEPOSIT: 가상계좌 입금 완료
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-toss-signature') || '';
    
    // 웹훅 시크릿 키로 서명 검증
    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('TossPayments 웹훅 시크릿 키가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // 서명 검증
    const isValidSignature = verifyWebhookSignature(body, signature, webhookSecret);
    if (!isValidSignature) {
      console.error('TossPayments 웹훅 서명 검증 실패');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 웹훅 이벤트 파싱
    const webhookEvent: TossWebhookEvent = JSON.parse(body);
    const { eventType, data } = webhookEvent;

    console.log(`TossPayments 웹훅 수신: ${eventType}`, {
      eventId: webhookEvent.eventId,
      timestamp: webhookEvent.timestamp
    });

    const supabase = await createClient();

    // 이벤트 타입별 처리
    switch (eventType) {
      case 'PAYMENT.DONE':
        await handlePaymentDone(supabase, data);
        break;
        
      case 'PAYMENT.CANCELED':
      case 'PAYMENT.PARTIAL_CANCELED':
        await handlePaymentCanceled(supabase, data);
        break;
        
      case 'PAYMENT.ABORTED':
        await handlePaymentAborted(supabase, data);
        break;
        
      case 'PAYMENT.EXPIRED':
        await handlePaymentExpired(supabase, data);
        break;
        
      case 'VIRTUAL_ACCOUNT.DEPOSIT':
        await handleVirtualAccountDeposit(supabase, data);
        break;
        
      default:
        console.log(`처리되지 않은 웹훅 이벤트: ${eventType}`);
    }

    // 웹훅 로그 저장
    await logWebhookEvent(supabase, webhookEvent);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('TossPayments 웹훅 처리 오류:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * 결제 완료 처리 (PAYMENT.DONE)
 */
async function handlePaymentDone(supabase: any, data: any) {
  const { paymentKey, orderId } = data;

  try {
    // 결제 정보 업데이트
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        provider_transaction_id: paymentKey,
        status: 'paid',
        paid_at: new Date().toISOString(),
        raw_response: data,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (paymentError) {
      throw new Error(`결제 정보 업데이트 실패: ${paymentError.message}`);
    }

    // 관련 문의 상태 업데이트
    const { error: inquiryError } = await supabase
      .from('inquiries')
      .update({
        status: 'reserved',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.metadata?.inquiryId);

    if (inquiryError) {
      console.error('문의 상태 업데이트 실패:', inquiryError);
    }

    console.log(`결제 완료 처리됨: ${orderId} (${paymentKey})`);
  } catch (error) {
    console.error('결제 완료 처리 오류:', error);
    throw error;
  }
}

/**
 * 결제 취소 처리 (PAYMENT.CANCELED, PAYMENT.PARTIAL_CANCELED)
 */
async function handlePaymentCanceled(supabase: any, data: any) {
  const { paymentKey, orderId, cancels } = data;
  const isPartialCancel = data.status === 'PARTIAL_CANCELED';

  try {
    // 결제 상태 업데이트
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: isPartialCancel ? 'partial_refunded' : 'refunded',
        raw_response: data,
        updated_at: new Date().toISOString()
      })
      .eq('provider_transaction_id', paymentKey);

    if (paymentError) {
      throw new Error(`결제 상태 업데이트 실패: ${paymentError.message}`);
    }

    // 환불 정보 처리
    if (cancels && cancels.length > 0) {
      const latestCancel = cancels[cancels.length - 1];
      
      // 결제 정보 조회
      const { data: payment } = await supabase
        .from('payments')
        .select('id')
        .eq('provider_transaction_id', paymentKey)
        .single();

      if (payment) {
        // 환불 레코드 생성
        const { error: refundError } = await supabase
          .from('refunds')
          .insert({
            payment_id: payment.id,
            refund_type: isPartialCancel ? 'partial' : 'full',
            refund_category: 'webhook_notification',
            refund_reason: latestCancel.cancelReason || '웹훅을 통한 취소 알림',
            original_amount: data.totalAmount,
            refund_amount: latestCancel.cancelAmount,
            remaining_amount: data.balanceAmount,
            provider: 'toss',
            provider_refund_id: latestCancel.transactionKey,
            refund_response: latestCancel,
            status: 'completed',
            processed_at: new Date(latestCancel.canceledAt).toISOString(),
            created_at: new Date().toISOString()
          });

        if (refundError) {
          console.error('환불 레코드 생성 실패:', refundError);
        }
      }
    }

    console.log(`결제 취소 처리됨: ${orderId} (${paymentKey})`);
  } catch (error) {
    console.error('결제 취소 처리 오류:', error);
    throw error;
  }
}

/**
 * 결제 실패 처리 (PAYMENT.ABORTED)
 */
async function handlePaymentAborted(supabase: any, data: any) {
  const { orderId } = data;

  try {
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        error_message: '결제가 중단되었습니다.',
        raw_response: data,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (error) {
      throw new Error(`결제 실패 상태 업데이트 실패: ${error.message}`);
    }

    console.log(`결제 실패 처리됨: ${orderId}`);
  } catch (error) {
    console.error('결제 실패 처리 오류:', error);
    throw error;
  }
}

/**
 * 결제 만료 처리 (PAYMENT.EXPIRED)
 */
async function handlePaymentExpired(supabase: any, data: any) {
  const { orderId } = data;

  try {
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'expired',
        error_message: '결제 시간이 만료되었습니다.',
        raw_response: data,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (error) {
      throw new Error(`결제 만료 상태 업데이트 실패: ${error.message}`);
    }

    console.log(`결제 만료 처리됨: ${orderId}`);
  } catch (error) {
    console.error('결제 만료 처리 오류:', error);
    throw error;
  }
}

/**
 * 가상계좌 입금 완료 처리 (VIRTUAL_ACCOUNT.DEPOSIT)
 */
async function handleVirtualAccountDeposit(supabase: any, data: any) {
  const { paymentKey, orderId } = data;

  try {
    // 결제 상태를 완료로 업데이트
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        raw_response: data,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (paymentError) {
      throw new Error(`가상계좌 결제 상태 업데이트 실패: ${paymentError.message}`);
    }

    // 관련 문의 상태도 업데이트
    const { error: inquiryError } = await supabase
      .from('inquiries')
      .update({
        status: 'reserved',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.metadata?.inquiryId);

    if (inquiryError) {
      console.error('문의 상태 업데이트 실패:', inquiryError);
    }

    console.log(`가상계좌 입금 완료 처리됨: ${orderId} (${paymentKey})`);
  } catch (error) {
    console.error('가상계좌 입금 처리 오류:', error);
    throw error;
  }
}

/**
 * 웹훅 이벤트 로그 저장
 */
async function logWebhookEvent(supabase: any, webhookEvent: TossWebhookEvent) {
  try {
    const { error } = await supabase
      .from('payment_logs')
      .insert({
        event_type: 'webhook_received',
        provider: 'toss',
        request_data: webhookEvent,
        response_data: { processed: true },
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('웹훅 로그 저장 실패:', error);
    }
  } catch (error) {
    console.error('웹훅 로그 저장 오류:', error);
  }
}

// GET 요청에 대한 기본 응답 (헬스체크용)
export async function GET() {
  return NextResponse.json({
    service: 'TossPayments Webhook Handler',
    status: 'active',
    timestamp: new Date().toISOString()
  });
}