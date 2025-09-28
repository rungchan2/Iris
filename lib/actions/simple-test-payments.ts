'use server';

/**
 * 간단한 테스트용 결제 데이터 생성 (DB 저장 없이 메모리상에서만)
 */
export async function createSimpleTestPayment(testData: {
  buyerName: string;
  buyerEmail: string;
  buyerTel: string;
  amount: number;
  orderName: string;
  photographerName: string;
}) {
  try {
    // 임시 ID들 생성
    const testUserId = crypto.randomUUID();
    const testPhotographerId = crypto.randomUUID();
    const testProductId = crypto.randomUUID();
    const testInquiryId = crypto.randomUUID();
    
    // 주문 ID 생성
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    const orderId = `TEST_ORDER_${timestamp}_${randomStr}`.toUpperCase();

    // 테스트 데이터 반환 (실제 DB 저장하지 않음)
    return { 
      success: true, 
      orderId,
      amount: testData.amount,
      customerKey: testUserId,
      inquiry: {
        id: testInquiryId,
        name: testData.buyerName,
        phone: testData.buyerTel,
        email: testData.buyerEmail
      },
      product: {
        id: testProductId,
        name: testData.orderName,
        price: testData.amount,
        photographer_id: testPhotographerId
      },
      photographer: {
        id: testPhotographerId,
        name: testData.photographerName
      }
    };

  } catch (error) {
    console.error('테스트 결제 데이터 생성 실패:', error);
    return { 
      success: false, 
      error: '테스트 결제 데이터 생성 중 오류가 발생했습니다.' 
    };
  }
}