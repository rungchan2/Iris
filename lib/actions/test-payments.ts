'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * 테스트용 임시 데이터 생성 및 결제 요청
 */
export async function createTestPaymentRequest(testData: {
  buyerName: string;
  buyerEmail: string;
  buyerTel: string;
  amount: number;
  orderName: string;
  photographerName: string;
}) {
  try {
    const supabase = await createClient();

    // 1. 테스트용 사용자 UUID 생성
    const testUserId = crypto.randomUUID();
    
    // 2. 기존 테스트용 작가가 있는지 확인하고, 없으면 기본 작가 사용
    const { data: existingPhotographers } = await supabase
      .from('photographers')
      .select('id, name')
      .eq('approval_status', 'approved')
      .limit(1);

    let testPhotographerId: string;
    let photographerName: string;

    if (existingPhotographers && existingPhotographers.length > 0) {
      // 기존 승인된 작가 사용
      testPhotographerId = existingPhotographers[0].id;
      photographerName = existingPhotographers[0].name;
    } else {
      // 테스트용 작가 생성
      testPhotographerId = crypto.randomUUID();
      photographerName = testData.photographerName;
      
      const { data: photographer, error: photographerError } = await supabase
        .from('photographers')
        .insert({
          id: testPhotographerId,
          name: photographerName,
          email: `test-photographer-${Date.now()}@test.com`,
          bio: '테스트용 작가입니다.',
          approval_status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (photographerError) {
        console.error('테스트 작가 생성 실패:', photographerError);
        return { 
          success: false, 
          error: '테스트 작가 생성에 실패했습니다.' 
        };
      }
    }


    // 3. 기존 승인된 상품 조회 또는 임시 상품 정보 사용
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, name, price, photographer_id')
      .eq('status', 'approved')
      .eq('photographer_id', testPhotographerId)
      .limit(1);

    let testProductId: string;
    let productName: string;
    let productPrice: number;

    if (existingProducts && existingProducts.length > 0) {
      // 기존 상품 사용
      const product = existingProducts[0];
      testProductId = product.id;
      productName = product.name;
      productPrice = product.price;
    } else {
      // 임시 상품 정보 사용 (실제 DB에 저장하지 않음)
      testProductId = crypto.randomUUID();
      productName = testData.orderName;
      productPrice = testData.amount;
    }

    // 4. 테스트용 문의 생성
    const testInquiryId = crypto.randomUUID();
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .insert({
        id: testInquiryId,
        name: testData.buyerName,
        phone: testData.buyerTel,
        photographer_id: testPhotographerId,
        user_id: testUserId,
        product_id: testProductId,
        special_request: '테스트 결제를 위한 문의입니다.',
        status: 'new',
        payment_required: true,
        payment_amount: productPrice,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (inquiryError) {
      console.error('테스트 문의 생성 실패:', inquiryError);
      return { 
        success: false, 
        error: '테스트 문의 생성에 실패했습니다.' 
      };
    }

    // 5. 주문 ID 생성
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    const orderId = `TEST_ORDER_${timestamp}_${randomStr}`.toUpperCase();

    // 6. 결제 레코드 생성
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount: productPrice,
        currency: 'KRW',
        user_id: testUserId,
        photographer_id: testPhotographerId,
        inquiry_id: testInquiryId,
        product_id: testProductId,
        provider: 'toss',
        buyer_name: testData.buyerName,
        buyer_email: testData.buyerEmail,
        buyer_tel: testData.buyerTel,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('결제 레코드 생성 실패:', paymentError);
      return { 
        success: false, 
        error: '결제 정보 생성에 실패했습니다.' 
      };
    }

    return { 
      success: true, 
      paymentId: payment.id,
      orderId,
      amount: productPrice,
      customerKey: testUserId,
      inquiry: {
        id: testInquiryId,
        name: testData.buyerName,
        phone: testData.buyerTel,
        email: testData.buyerEmail
      },
      product: {
        id: testProductId,
        name: productName,
        price: productPrice,
        photographer_id: testPhotographerId
      },
      photographer: {
        id: testPhotographerId,
        name: photographerName
      }
    };

  } catch (error) {
    console.error('테스트 결제 요청 생성 실패:', error);
    return { 
      success: false, 
      error: '테스트 결제 요청 생성 중 오류가 발생했습니다.' 
    };
  }
}

/**
 * 테스트 데이터 정리 (결제 완료 후 또는 취소 시)
 */
export async function cleanupTestData(orderId: string) {
  try {
    const supabase = await createClient();

    // 주문 ID로 결제 정보 조회
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (!payment) {
      return { success: true, message: '정리할 데이터가 없습니다.' };
    }

    // 테스트 데이터 순서대로 삭제
    const deletions = [];

    // 1. 결제 로그 삭제
    if (payment.id) {
      deletions.push(
        supabase.from('payment_logs').delete().eq('payment_id', payment.id)
      );
    }

    // 2. 환불 정보 삭제
    if (payment.id) {
      deletions.push(
        supabase.from('refunds').delete().eq('payment_id', payment.id)
      );
    }

    // 3. 결제 정보 삭제
    deletions.push(
      supabase.from('payments').delete().eq('order_id', orderId)
    );

    // 4. 문의 삭제
    if (payment.inquiry_id) {
      deletions.push(
        supabase.from('inquiries').delete().eq('id', payment.inquiry_id)
      );
    }

    // 5. 상품 삭제
    if (payment.product_id) {
      deletions.push(
        supabase.from('products').delete().eq('id', payment.product_id)
      );
    }

    // 6. 작가 삭제
    if (payment.photographer_id) {
      deletions.push(
        supabase.from('photographers').delete().eq('id', payment.photographer_id)
      );
    }

    // 모든 삭제 작업 실행
    await Promise.all(deletions);

    return { 
      success: true, 
      message: '테스트 데이터가 정리되었습니다.' 
    };

  } catch (error) {
    console.error('테스트 데이터 정리 실패:', error);
    return { 
      success: false, 
      error: '테스트 데이터 정리 중 오류가 발생했습니다.' 
    };
  }
}