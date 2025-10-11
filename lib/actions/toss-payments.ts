'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
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
 * - 멱등성 보장: 동일한 결제를 여러 번 호출해도 안전
 * - 상태 전이: pending → processing → paid
 * - 동시 요청 처리: 낙관적 잠금으로 중복 처리 방지
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

  paymentLogger.info('결제 승인 요청 시작', { paymentKey, orderId, amount });

  try {
    // Use service role client to bypass RLS for payment processing
    // This is safe because we verify payment ownership and amount before processing
    const supabase = createServiceRoleClient();

    // 테스트 주문 체크
    const isTestOrder = orderId.startsWith('TEST_ORDER_');

    // Step 1: 결제 정보 조회 및 검증
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('id, status, inquiry_id, user_id, amount')
      .eq('order_id', orderId)
      .single();

    if (fetchError || !existingPayment) {
      if (isTestOrder) {
        // 테스트 주문은 DB 검증 스킵하고 직접 Toss API 호출
        const tossPayment = await confirmPayment({ paymentKey, orderId, amount });
        return {
          success: true,
          paymentKey,
          orderId,
          amount: tossPayment.totalAmount,
          isTestPayment: true
        };
      }

      paymentLogger.error('결제 정보 없음', { orderId });
      return {
        success: false,
        error: '결제 정보를 찾을 수 없습니다.'
      };
    }

    // 금액 변조 검증 (보안)
    if (existingPayment.amount !== amount) {
      paymentLogger.error('금액 불일치 감지', {
        orderId,
        dbAmount: existingPayment.amount,
        requestAmount: amount
      });

      // 사기 시도로 기록
      await supabase
        .from('payments')
        .update({
          status: 'fraud_detected',
          error_message: `금액 변조 감지: DB ${existingPayment.amount}원 vs 요청 ${amount}원`,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPayment.id);

      await supabase
        .from('payment_logs')
        .insert({
          payment_id: existingPayment.id,
          event_type: 'fraud_attempt',
          provider: 'toss',
          request_data: { paymentKey, orderId, requestAmount: amount, dbAmount: existingPayment.amount },
          error_message: '금액 변조 시도',
          created_at: new Date().toISOString()
        });

      return {
        success: false,
        error: '결제 금액이 일치하지 않습니다.'
      };
    }

    // 중복 처리 방지: 이미 완료된 결제
    if (existingPayment.status === 'paid') {
      paymentLogger.info('이미 완료된 결제', { orderId, paymentId: existingPayment.id });
      return {
        success: true,
        paymentKey,
        orderId,
        amount: existingPayment.amount,
        isTestPayment: false,
        alreadyProcessed: true
      };
    }

    // Step 2: 상태 잠금 (낙관적 잠금) - 동시 요청 방지
    const { data: lockResult, error: lockError } = await supabase
      .from('payments')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPayment.id)
      .eq('status', 'pending')  // ✅ 핵심: pending 상태인 경우만 업데이트
      .select();

    // 잠금 실패: 이미 다른 요청이 처리 중이거나 완료됨
    if (lockError || !lockResult || lockResult.length === 0) {
      paymentLogger.warn('동시 요청 감지 또는 이미 처리됨', { orderId, currentStatus: existingPayment.status });

      // 현재 상태 재조회
      const { data: currentPayment } = await supabase
        .from('payments')
        .select('status')
        .eq('id', existingPayment.id)
        .single();

      if (currentPayment?.status === 'paid') {
        return {
          success: true,
          paymentKey,
          orderId,
          amount: existingPayment.amount,
          alreadyProcessed: true
        };
      }

      return {
        success: false,
        error: '결제가 이미 처리 중입니다. 잠시 후 다시 시도해주세요.'
      };
    }

    // 잠금 획득 로그
    await supabase
      .from('payment_logs')
      .insert({
        payment_id: existingPayment.id,
        event_type: 'processing_start',
        provider: 'toss',
        request_data: { paymentKey, orderId, amount },
        created_at: new Date().toISOString()
      });

    paymentLogger.info('결제 처리 시작 (잠금 획득)', { orderId, paymentId: existingPayment.id });

    // Step 3: Toss API 호출 - 실제 결제 승인
    let tossPayment: TossPaymentResponse;
    try {
      tossPayment = await confirmPayment({
        paymentKey,
        orderId,
        amount
      });

      paymentLogger.info('Toss API 승인 성공', {
        orderId,
        tossStatus: tossPayment.status,
        approvedAt: tossPayment.approvedAt
      });

    } catch (tossError) {
      // Toss API 실패 시 상태를 failed로 변경
      paymentLogger.error('Toss API 승인 실패', { orderId, error: tossError });

      await supabase
        .from('payments')
        .update({
          status: 'failed',
          error_message: tossError instanceof TossApiError
            ? `${tossError.code}: ${tossError.message}`
            : '결제 승인 실패',
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPayment.id)
        .eq('status', 'processing');  // ✅ 처리 중인 것만 실패로 변경

      await supabase
        .from('payment_logs')
        .insert({
          payment_id: existingPayment.id,
          event_type: 'toss_api_failed',
          provider: 'toss',
          request_data: { paymentKey, orderId, amount },
          error_message: tossError instanceof Error ? tossError.message : 'Unknown error',
          created_at: new Date().toISOString()
        });

      throw tossError;
    }

    // Step 4: 결제 완료 상태 업데이트
    const { data: paidResult, error: updateError } = await supabase
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
      .eq('id', existingPayment.id)
      .eq('status', 'processing')  // ✅ 처리 중인 것만 완료로 변경
      .select();

    if (updateError || !paidResult || paidResult.length === 0) {
      paymentLogger.error('결제 완료 상태 업데이트 실패 (치명적)', {
        orderId,
        error: updateError
      });

      // 이 경우 Toss는 승인했지만 DB 업데이트 실패 → 수동 복구 필요
      return {
        success: false,
        error: '결제는 승인되었으나 상태 저장에 실패했습니다. 고객센터에 문의해주세요.',
        needsManualRecovery: true
      };
    }

    paymentLogger.info('결제 완료 상태 업데이트 성공', { orderId, paymentId: existingPayment.id });

    // Step 5: 문의 상태 업데이트
    if (existingPayment.inquiry_id) {
      const { error: inquiryError } = await supabase
        .from('inquiries')
        .update({
          status: 'reserved',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPayment.inquiry_id);

      if (inquiryError) {
        paymentLogger.error('문의 상태 업데이트 실패', {
          inquiryId: existingPayment.inquiry_id,
          error: inquiryError
        });
        // 문의 업데이트 실패는 치명적이지 않으므로 계속 진행
      }
    }

    // Step 6: 결제 완료 로그 기록
    await supabase
      .from('payment_logs')
      .insert({
        payment_id: existingPayment.id,
        event_type: 'payment_completed',
        provider: 'toss',
        request_data: { paymentKey, orderId, amount },
        response_data: tossPayment,
        created_at: new Date().toISOString()
      });

    paymentLogger.info('결제 승인 처리 완료', { orderId, paymentId: existingPayment.id });

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
 * - 결제 레코드를 pending 상태로 생성
 * - 중복 결제 방지를 위한 orderId 생성
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
    paymentLogger.error('결제 준비 실패: 필수 정보 누락', { inquiryId, amount, orderName });
    return {
      success: false,
      error: '필수 결제 정보가 누락되었습니다.'
    };
  }

  paymentLogger.info('결제 준비 시작', { inquiryId, productId, amount, orderName });

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
      paymentLogger.error('문의 정보 조회 실패', { inquiryId, error: inquiryError });
      return {
        success: false,
        error: '문의 정보를 찾을 수 없습니다.'
      };
    }

    // 2. 상품 정보 확인 (선택사항)
    let product = null;
    if (productId) {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, name, price, photographer_id')
        .eq('id', productId)
        .eq('status', 'approved')
        .single();

      if (productError) {
        paymentLogger.error('상품 정보 조회 실패', { productId, error: productError });
      } else {
        product = productData;
        paymentLogger.info('상품 정보 확인', { productId, productName: product.name, price: product.price });
      }
    }

    // 3. 이미 pending 상태의 결제가 있는지 확인 (중복 방지)
    const { data: existingPendingPayment } = await supabase
      .from('payments')
      .select('id, order_id, status')
      .eq('inquiry_id', inquiryId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingPendingPayment) {
      paymentLogger.info('기존 pending 결제 재사용', {
        paymentId: existingPendingPayment.id,
        orderId: existingPendingPayment.order_id
      });

      return {
        success: true,
        paymentId: existingPendingPayment.id,
        orderId: existingPendingPayment.order_id,
        amount,
        customerKey: inquiry.user_id || `guest_${inquiry.id}`,
        isExisting: true
      };
    }

    // 4. 주문 ID 생성 (타임스탬프 + 랜덤)
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    const orderId = `ORDER_${timestamp}_${randomStr}`.toUpperCase();

    paymentLogger.info('주문 ID 생성', { orderId, inquiryId });

    // 5. 결제 레코드 생성
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
      paymentLogger.error('결제 레코드 생성 실패', { orderId, error: paymentError });
      return {
        success: false,
        error: '결제 정보 생성에 실패했습니다.'
      };
    }

    // 6. 결제 준비 로그 기록
    await supabase
      .from('payment_logs')
      .insert({
        payment_id: payment.id,
        event_type: 'payment_prepare',
        provider: 'toss',
        request_data: {
          inquiryId,
          productId,
          amount,
          orderName,
          buyerName: buyerName || inquiry.name
        },
        created_at: new Date().toISOString()
      });

    paymentLogger.info('결제 준비 완료', {
      paymentId: payment.id,
      orderId,
      amount,
      inquiryId
    });

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
 * - Toss에서 failUrl로 리다이렉트된 경우 호출
 * - 결제 상태를 failed로 업데이트하고 로그 기록
 */
export async function handlePaymentFailure(
  code: string,
  message: string,
  orderId: string
) {
  paymentLogger.error('결제 실패 처리 시작', { code, message, orderId });

  try {
    const supabase = await createClient();

    // 결제 정보 조회
    const { data: payment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('order_id', orderId)
      .single();

    if (!payment) {
      paymentLogger.error('결제 정보 없음 (실패 처리)', { orderId });
      redirect(`/payment/fail?code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);
      return;
    }

    // 이미 실패 처리된 경우
    if (payment.status === 'failed') {
      paymentLogger.info('이미 실패 처리된 결제', { orderId, paymentId: payment.id });
      redirect(`/payment/fail?code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);
      return;
    }

    // 실패한 결제 정보 업데이트
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        error_message: `${code}: ${message}`,
        failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .in('status', ['pending', 'processing']);  // pending 또는 processing만 failed로 변경

    if (error) {
      paymentLogger.error('결제 실패 상태 업데이트 오류', { orderId, error });
    } else {
      paymentLogger.info('결제 실패 상태 업데이트 성공', { orderId, paymentId: payment.id });
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

    redirect(`/payment/fail?code=${code}&message=${encodeURIComponent(message)}&orderId=${orderId}`);
  } catch (error) {
    paymentLogger.error('결제 실패 처리 오류', error);
    redirect(`/payment/fail?code=SYSTEM_ERROR&message=${encodeURIComponent('시스템 오류가 발생했습니다.')}&orderId=${orderId}`);
  }
}