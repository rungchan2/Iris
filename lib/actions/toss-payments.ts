'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { paymentLogger } from '@/lib/logger';
import { 
  confirmPayment, 
  getPayment, 
  cancelPayment,
  TossApiError,
  mapTossStatusToInternal,
  getUserFriendlyErrorMessage 
} from '@/lib/payments/toss-server';
import type { TossPaymentResponse } from '@/lib/payments/toss-types';

/**
 * 결제 승인 및 데이터베이스 저장 (결제 성공 후 호출)
 */
export async function confirmTossPayment(formData: FormData) {
  const paymentKey = formData.get('paymentKey') as string;
  const orderId = formData.get('orderId') as string;
  const amount = parseInt(formData.get('amount') as string);

  if (!paymentKey || !orderId || !amount) {
    return { 
      success: false, 
      error: '필수 결제 정보가 누락되었습니다.' 
    };
  }

  // 개발 환경에서 디버깅 정보 출력
  if (process.env.NODE_ENV === 'development') {
    paymentLogger.info('결제 승인 요청', { paymentKey, orderId, amount });
  }

  try {
    const supabase = await createClient();

    // 1. TossPayments API로 결제 승인
    const tossPayment = await confirmPayment({
      paymentKey,
      orderId,
      amount
    });

    // 2. 데이터베이스에서 기존 결제 정보 확인
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status, inquiry_id, user_id')
      .eq('order_id', orderId)
      .single();

    // 테스트 주문인 경우 DB 검증 스킵
    const isTestOrder = orderId.startsWith('TEST_ORDER_');
    
    if (!existingPayment && !isTestOrder) {
      return { 
        success: false, 
        error: '결제 정보를 찾을 수 없습니다.' 
      };
    }

    // 3. 결제 상태 업데이트 (테스트 주문이 아닌 경우만)
    if (existingPayment) {
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          provider_transaction_id: tossPayment.paymentKey,
          payment_method: tossPayment.method,
          status: mapTossStatusToInternal(tossPayment.status),
          paid_at: tossPayment.approvedAt ? new Date(tossPayment.approvedAt).toISOString() : new Date().toISOString(),
          raw_response: tossPayment as any,
          card_info: tossPayment.card as any || null,
          receipt_url: tossPayment.receipt?.url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPayment.id);

      if (updateError) {
        paymentLogger.error('결제 상태 업데이트 실패', updateError);
        return {
          success: false,
          error: '결제 정보 저장에 실패했습니다.'
        };
      }

      // 4. 문의 상태 업데이트 (결제 완료로)
      if (existingPayment.inquiry_id) {
        await supabase
          .from('inquiries')
          .update({
            status: 'reserved', // 결제 완료 시 예약 확정
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.inquiry_id);
      }
    }

    // 5. 결제 로그 기록 (테스트 주문이 아닌 경우만)
    if (existingPayment) {
      await supabase
        .from('payment_logs')
        .insert({
          payment_id: existingPayment.id,
          event_type: 'payment_confirmed',
          provider: 'toss',
          request_data: { paymentKey, orderId, amount },
          response_data: tossPayment,
          created_at: new Date().toISOString()
        });
    }

    revalidatePath('/admin/payments');
    
    return { 
      success: true, 
      paymentKey,
      orderId,
      amount: tossPayment.totalAmount,
      isTestPayment: isTestOrder
    };

  } catch (error) {
    paymentLogger.error('결제 승인 처리 실패', error);

    if (error instanceof TossApiError) {
      return {
        success: false,
        error: getUserFriendlyErrorMessage(error)
      };
    }

    return {
      success: false,
      error: '결제 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 초기 결제 정보 생성 (결제 위젯 표시 전 호출)
 */
export async function createPaymentRequest(formData: FormData) {
  const inquiryId = formData.get('inquiryId') as string;
  const productId = formData.get('productId') as string;
  const amount = parseInt(formData.get('amount') as string);
  const orderName = formData.get('orderName') as string;
  const buyerName = formData.get('buyerName') as string;
  const buyerEmail = formData.get('buyerEmail') as string;
  const buyerTel = formData.get('buyerTel') as string;

  if (!inquiryId || !amount || !orderName) {
    return { 
      success: false, 
      error: '필수 결제 정보가 누락되었습니다.' 
    };
  }

  try {
    const supabase = await createClient();

    // 1. 문의 정보 확인
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select(`
        id, 
        name, 
        phone, 
        photographer_id,
        user_id
      `)
      .eq('id', inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      return { 
        success: false, 
        error: '문의 정보를 찾을 수 없습니다.' 
      };
    }

    // 2. 상품 정보 확인 (선택사항)
    let product = null;
    if (productId) {
      const { data: productData } = await supabase
        .from('products')
        .select('id, name, price, photographer_id')
        .eq('id', productId)
        .eq('status', 'approved')
        .single();
      
      product = productData;
    }

    // 3. 주문 ID 생성 (타임스탬프 + 랜덤)
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    const orderId = `ORDER_${timestamp}_${randomStr}`.toUpperCase();

    // 4. 결제 레코드 생성
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount: amount,
        currency: 'KRW',
        user_id: inquiry.user_id,
        photographer_id: inquiry.photographer_id,
        inquiry_id: inquiryId,
        product_id: productId || null,
        provider: 'toss',
        buyer_name: buyerName || inquiry.name,
        buyer_email: buyerEmail || null,
        buyer_tel: buyerTel || inquiry.phone,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      paymentLogger.error('결제 레코드 생성 실패', paymentError);
      return {
        success: false,
        error: '결제 정보 생성에 실패했습니다.'
      };
    }

    return { 
      success: true, 
      paymentId: payment.id,
      orderId,
      amount,
      customerKey: inquiry.user_id || `guest_${inquiry.id}` // 사용자 ID 또는 게스트 키
    };

  } catch (error) {
    paymentLogger.error('결제 요청 생성 실패', error);
    return {
      success: false,
      error: '결제 요청 생성 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 결제 취소/환불 처리
 */
export async function cancelTossPayment(formData: FormData) {
  const paymentId = formData.get('paymentId') as string;
  const cancelReason = formData.get('cancelReason') as string;
  const cancelAmount = formData.get('cancelAmount') ? parseInt(formData.get('cancelAmount') as string) : undefined;

  if (!paymentId || !cancelReason) {
    return { 
      success: false, 
      error: '취소 정보가 누락되었습니다.' 
    };
  }

  try {
    const supabase = await createClient();
    
    // 1. 결제 정보 조회
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('status', 'paid')
      .single();

    if (paymentError || !payment) {
      return { 
        success: false, 
        error: '결제 정보를 찾을 수 없거나 취소 가능한 상태가 아닙니다.' 
      };
    }

    // 2. TossPayments API로 결제 취소
    const cancelResponse = await cancelPayment(
      payment.provider_transaction_id!,
      {
        cancelReason,
        cancelAmount: cancelAmount || payment.amount
      }
    );

    // 3. 환불 레코드 생성
    const { error: refundError } = await supabase
      .from('refunds')
      .insert({
        payment_id: paymentId,
        refund_type: cancelAmount ? 'partial' : 'full',
        refund_category: 'customer_request',
        refund_reason: cancelReason,
        original_amount: payment.amount,
        refund_amount: cancelAmount || payment.amount,
        remaining_amount: Math.max(0, payment.amount - (cancelAmount || payment.amount)),
        provider: 'toss',
        provider_refund_id: cancelResponse.paymentKey,
        refund_response: cancelResponse as any,
        status: 'completed',
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (refundError) {
      paymentLogger.error('환불 레코드 생성 실패', refundError);
    }

    // 4. 결제 상태 업데이트
    const newStatus = cancelAmount ? 'partial_refunded' : 'refunded';
    await supabase
      .from('payments')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    // 5. 결제 로그 기록
    await supabase
      .from('payment_logs')
      .insert({
        payment_id: paymentId,
        event_type: 'payment_cancelled',
        provider: 'toss',
        request_data: { cancelReason, cancelAmount },
        response_data: cancelResponse,
        created_at: new Date().toISOString()
      });

    revalidatePath('/admin/payments');
    
    return { 
      success: true, 
      refundAmount: cancelAmount || payment.amount
    };

  } catch (error) {
    paymentLogger.error('결제 취소 처리 실패', error);

    if (error instanceof TossApiError) {
      return {
        success: false,
        error: getUserFriendlyErrorMessage(error)
      };
    }

    return {
      success: false,
      error: '결제 취소 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 결제 상태 조회
 */
export async function getTossPaymentStatus(paymentKey: string) {
  try {
    const tossPayment = await getPayment(paymentKey);
    
    return { 
      success: true, 
      payment: {
        paymentKey: tossPayment.paymentKey,
        orderId: tossPayment.orderId,
        status: mapTossStatusToInternal(tossPayment.status),
        method: tossPayment.method,
        amount: tossPayment.totalAmount,
        approvedAt: tossPayment.approvedAt,
        receiptUrl: tossPayment.receipt?.url
      }
    };

  } catch (error) {
    paymentLogger.error('결제 상태 조회 실패', error);

    if (error instanceof TossApiError) {
      return {
        success: false,
        error: getUserFriendlyErrorMessage(error)
      };
    }

    return {
      success: false,
      error: '결제 상태 조회 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 결제 성공 페이지 리디렉션 처리
 */
export async function handlePaymentSuccess(
  paymentKey: string,
  orderId: string,
  amount: string
) {
  try {
    // FormData 생성하여 기존 함수 재사용
    const formData = new FormData();
    formData.append('paymentKey', paymentKey);
    formData.append('orderId', orderId);
    formData.append('amount', amount);

    const result = await confirmTossPayment(formData);
    
    if (result.success) {
      redirect(`/payment/success?orderId=${orderId}&paymentKey=${paymentKey}`);
    } else {
      redirect(`/payment/fail?code=CONFIRM_FAILED&message=${encodeURIComponent(result.error || '')}&orderId=${orderId}`);
    }
  } catch (error) {
    paymentLogger.error('결제 성공 처리 실패', error);
    redirect(`/payment/fail?code=SYSTEM_ERROR&message=${encodeURIComponent('시스템 오류가 발생했습니다.')}&orderId=${orderId}`);
  }
}

/**
 * 결제 실패 페이지 리디렉션 처리
 */
export async function handlePaymentFailure(
  code: string,
  message: string,
  orderId: string
) {
  try {
    const supabase = await createClient();
    
    // 실패한 결제 정보 업데이트
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        error_message: `${code}: ${message}`,
        failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (error) {
      paymentLogger.error('결제 실패 상태 업데이트 오류', error);
    }

    redirect(`/payment/fail?code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);
  } catch (error) {
    paymentLogger.error('결제 실패 처리 오류', error);
    redirect(`/payment/fail?code=SYSTEM_ERROR&message=${encodeURIComponent('시스템 오류가 발생했습니다.')}&orderId=${orderId}`);
  }
}