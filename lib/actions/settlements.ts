'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { paymentLogger } from '@/lib/logger';

export interface SettlementData {
  id: string;
  photographer_id: string;
  photographer_name: string;
  photographer_email: string;
  settlement_date: string;
  settlement_period: string;
  total_payment_amount: number;
  total_platform_fee: number;
  total_gateway_fee: number;
  total_tax_amount: number;
  final_settlement_amount: number;
  payment_count: number;
  settlement_item_count: number;
  refund_count: number;
  total_refund_amount: number;
  status: 'pending' | 'approved' | 'transferred' | 'completed';
  approved_at: string | null;
  approved_by: string | null;
  transferred_at: string | null;
  transfer_holder: string | null;
  transfer_bank_name: string | null;
  transfer_account: string | null;
  transfer_receipt_url: string | null;
  settlement_data: any;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 정산 목록 조회
 */
export async function getSettlements(params: {
  page?: number;
  limit?: number;
  status?: string;
  photographerId?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  try {
    const supabase = await createClient();
    const { 
      page = 1, 
      limit = 20, 
      status, 
      photographerId, 
      dateFrom, 
      dateTo 
    } = params;

    let query = supabase
      .from('settlements')
      .select(`
        *,
        photographers (
          name,
          email,
          phone
        )
      `);

    // 필터 적용
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (photographerId) {
      query = query.eq('photographer_id', photographerId);
    }

    if (dateFrom) {
      query = query.gte('settlement_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('settlement_date', dateTo);
    }

    // 페이지네이션 적용
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      paymentLogger.error('정산 목록 조회 실패', error);
      return {
        success: false,
        error: '정산 목록을 불러오는데 실패했습니다.'
      };
    }

    // 데이터 변환
    const settlements = data?.map(item => ({
      ...item,
      photographer_name: item.photographers?.name || '알 수 없음',
      photographer_email: item.photographers?.email || '',
    })) || [];

    return {
      success: true,
      data: settlements,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

  } catch (error) {
    paymentLogger.error('정산 목록 조회 오류', error);
    return {
      success: false,
      error: '시스템 오류가 발생했습니다.'
    };
  }
}

/**
 * 정산 상세 조회
 */
export async function getSettlementById(settlementId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('settlements')
      .select(`
        *,
        photographers (
          id,
          name,
          email,
          phone,
          bio
        ),
        payments!inner(
          id,
          order_id,
          amount,
          payment_method,
          status,
          paid_at,
          buyer_name,
          created_at
        )
      `)
      .eq('id', settlementId)
      .single();

    if (error) {
      paymentLogger.error('정산 상세 조회 실패', error);
      return {
        success: false,
        error: '정산 정보를 찾을 수 없습니다.'
      };
    }

    return {
      success: true,
      data: {
        ...data,
        photographer_name: data.photographers?.name || '알 수 없음',
        photographer_email: data.photographers?.email || '',
      }
    };

  } catch (error) {
    paymentLogger.error('정산 상세 조회 오류', error);
    return {
      success: false,
      error: '시스템 오류가 발생했습니다.'
    };
  }
}

/**
 * 정산 승인
 */
export async function approveSettlement(formData: FormData) {
  const settlementId = formData.get('settlementId') as string;
  const adminNote = formData.get('adminNote') as string;

  if (!settlementId) {
    return { success: false, error: '정산 ID가 필요합니다.' };
  }

  try {
    const supabase = await createClient();
    
    // 현재 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const { error } = await supabase
      .from('settlements')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        admin_note: adminNote || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', settlementId)
      .eq('status', 'pending'); // 대기 상태인 것만 승인 가능

    if (error) {
      paymentLogger.error('정산 승인 실패', error);
      return {
        success: false,
        error: '정산 승인에 실패했습니다.'
      };
    }

    revalidatePath('/admin/settlements');
    
    return { 
      success: true, 
      message: '정산이 승인되었습니다.' 
    };

  } catch (error) {
    paymentLogger.error('정산 승인 오류', error);
    return {
      success: false,
      error: '시스템 오류가 발생했습니다.'
    };
  }
}

/**
 * 정산 이체 완료 처리
 */
export async function completeSettlementTransfer(formData: FormData) {
  const settlementId = formData.get('settlementId') as string;
  const transferReceiptUrl = formData.get('transferReceiptUrl') as string;
  const adminNote = formData.get('adminNote') as string;

  if (!settlementId) {
    return { success: false, error: '정산 ID가 필요합니다.' };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('settlements')
      .update({
        status: 'completed',
        transferred_at: new Date().toISOString(),
        transfer_receipt_url: transferReceiptUrl || null,
        admin_note: adminNote || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', settlementId)
      .eq('status', 'approved'); // 승인된 것만 완료 가능

    if (error) {
      paymentLogger.error('정산 이체 완료 실패', error);
      return {
        success: false,
        error: '정산 이체 완료 처리에 실패했습니다.'
      };
    }

    revalidatePath('/admin/settlements');
    
    return { 
      success: true, 
      message: '정산 이체가 완료되었습니다.' 
    };

  } catch (error) {
    paymentLogger.error('정산 이체 완료 오류', error);
    return {
      success: false,
      error: '시스템 오류가 발생했습니다.'
    };
  }
}

/**
 * 정산 거부
 */
export async function rejectSettlement(formData: FormData) {
  const settlementId = formData.get('settlementId') as string;
  const rejectionReason = formData.get('rejectionReason') as string;

  if (!settlementId || !rejectionReason) {
    return { 
      success: false, 
      error: '정산 ID와 거부 사유가 필요합니다.' 
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('settlements')
      .update({
        status: 'pending', // 다시 대기 상태로 변경
        admin_note: rejectionReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', settlementId);

    if (error) {
      paymentLogger.error('정산 거부 실패', error);
      return {
        success: false,
        error: '정산 거부 처리에 실패했습니다.'
      };
    }

    revalidatePath('/admin/settlements');
    
    return { 
      success: true, 
      message: '정산이 거부되었습니다.' 
    };

  } catch (error) {
    paymentLogger.error('정산 거부 오류', error);
    return {
      success: false,
      error: '시스템 오류가 발생했습니다.'
    };
  }
}

/**
 * 정산 통계 조회
 */
export async function getSettlementStats(params: {
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  try {
    const supabase = await createClient();
    const { dateFrom, dateTo } = params;

    let query = supabase
      .from('settlements')
      .select(`
        status,
        final_settlement_amount,
        payment_count,
        created_at
      `);

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      paymentLogger.error('정산 통계 조회 실패', error);
      return {
        success: false,
        error: '정산 통계를 불러오는데 실패했습니다.'
      };
    }

    // 통계 계산
    const stats = data?.reduce((acc, item) => {
      acc.totalCount += 1;
      acc.totalAmount += item.final_settlement_amount;
      acc.totalPayments += item.payment_count;
      
      if (item.status === 'pending') acc.pendingCount += 1;
      else if (item.status === 'approved') acc.approvedCount += 1;
      else if (item.status === 'completed') acc.completedCount += 1;
      
      return acc;
    }, {
      totalCount: 0,
      totalAmount: 0,
      totalPayments: 0,
      pendingCount: 0,
      approvedCount: 0,
      completedCount: 0,
    }) || {
      totalCount: 0,
      totalAmount: 0,
      totalPayments: 0,
      pendingCount: 0,
      approvedCount: 0,
      completedCount: 0,
    };

    return {
      success: true,
      data: stats
    };

  } catch (error) {
    paymentLogger.error('정산 통계 조회 오류', error);
    return {
      success: false,
      error: '시스템 오류가 발생했습니다.'
    };
  }
}

/**
 * 작가별 정산 요약 조회
 */
export async function getPhotographerSettlements(photographerId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('settlements')
      .select(`
        *,
        photographers (
          name,
          email,
          phone
        )
      `)
      .eq('photographer_id', photographerId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      paymentLogger.error('작가별 정산 조회 실패', error);
      return {
        success: false,
        error: '작가별 정산 내역을 불러오는데 실패했습니다.'
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    paymentLogger.error('작가별 정산 조회 오류', error);
    return {
      success: false,
      error: '시스템 오류가 발생했습니다.'
    };
  }
}

/**
 * 정산 항목이 없는 결제 내역 조회 (정산 대기 중)
 */
export async function getPaymentsNeedingSettlement(params: {
  page?: number;
  limit?: number;
  photographerId?: string;
} = {}) {
  try {
    const supabase = await createClient();
    const { page = 1, limit = 20, photographerId } = params;

    // settlement_items가 없는 paid 상태의 결제만 조회
    let query = supabase
      .from('payments')
      .select(`
        *,
        settlement_items!left(id),
        photographer:photographers(id, name, email)
      `)
      .eq('status', 'paid')
      .is('settlement_items.id', null);

    if (photographerId) {
      query = query.eq('photographer_id', photographerId);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query
      .order('paid_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      paymentLogger.error('정산 대기 결제 조회 실패', error);
      return {
        success: false,
        error: '정산 대기 결제를 불러오는데 실패했습니다.'
      };
    }

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

  } catch (error) {
    paymentLogger.error('정산 대기 결제 조회 오류', error);
    return {
      success: false,
      error: '시스템 오류가 발생했습니다.'
    };
  }
}

/**
 * 여러 결제 건에 대한 정산 항목 생성
 */
export async function createSettlementItems(paymentIds: string[]) {
  if (!paymentIds || paymentIds.length === 0) {
    return { success: false, error: '선택된 결제 건이 없습니다.' };
  }

  try {
    const supabase = await createClient();
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const paymentId of paymentIds) {
      try {
        // 1. 결제 정보 조회
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .eq('status', 'paid')
          .single();

        if (paymentError || !payment) {
          failCount++;
          results.push({ paymentId, success: false, error: '결제 정보를 찾을 수 없습니다' });
          continue;
        }

        // 2. 이미 정산 항목이 있는지 확인
        const { data: existingItem } = await supabase
          .from('settlement_items')
          .select('id')
          .eq('payment_id', paymentId)
          .single();

        if (existingItem) {
          failCount++;
          results.push({ paymentId, success: false, error: '이미 정산 항목이 존재합니다' });
          continue;
        }

        // 3. 정산 항목 생성
        const settlementAmount = Math.floor(payment.amount * 0.7); // 70% 정산 (예시)
        const platformFee = Math.floor(payment.amount * 0.3); // 30% 플랫폼 수수료
        const taxAmount = Math.floor(payment.amount * 0.033); // 3.3% 세금

        const { error: insertError } = await supabase
          .from('settlement_items')
          .insert({
            payment_id: paymentId,
            payment_amount: payment.amount,
            platform_fee: platformFee,
            payment_gateway_fee: 0,
            tax_amount: taxAmount,
            settlement_amount: settlementAmount,
            status: 'pending',
            created_at: new Date().toISOString()
          } as any);

        if (insertError) {
          failCount++;
          results.push({ paymentId, success: false, error: insertError.message });
        } else {
          successCount++;
          results.push({ paymentId, success: true });
        }

      } catch (err) {
        failCount++;
        results.push({ paymentId, success: false, error: '처리 중 오류 발생' });
      }
    }

    revalidatePath('/admin/settlements');
    revalidatePath('/admin/payments');

    return {
      success: true,
      message: `${successCount}건 성공, ${failCount}건 실패`,
      results
    };

  } catch (error) {
    paymentLogger.error('정산 항목 생성 오류', error);
    return {
      success: false,
      error: '시스템 오류가 발생했습니다.'
    };
  }
}