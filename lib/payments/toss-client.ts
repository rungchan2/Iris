// TossPayments 클라이언트 초기화

import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

let tossPaymentsPromise: Promise<any> | null = null;

/**
 * TossPayments SDK 싱글톤 인스턴스 반환 (결제창용)
 */
export const getTossPayments = () => {
  if (!tossPaymentsPromise) {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!clientKey) {
      throw new Error('TossPayments 클라이언트 키가 설정되지 않았습니다.');
    }
    // API 개별 연동 키를 사용하여 결제창 초기화
    tossPaymentsPromise = loadTossPayments(clientKey);
  }
  return tossPaymentsPromise;
};

/**
 * 결제 금액 포맷팅
 */
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * 주문 ID 생성 (타임스탬프 + 랜덤 문자열)
 */
export const generateOrderId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `ORDER_${timestamp}_${randomStr}`.toUpperCase();
};

/**
 * 전화번호 포맷팅 (하이픈 추가)
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

/**
 * 에러 메시지 매핑
 */
export const getTossErrorMessage = (code: string): string => {
  const errorMessages: Record<string, string> = {
    'USER_CANCEL': '사용자가 결제를 취소했습니다.',
    'INVALID_CARD_COMPANY': '유효하지 않은 카드입니다.',
    'EXCEED_MAX_AMOUNT': '결제 금액이 한도를 초과했습니다.',
    'EXCEED_MAX_CARD_INSTALLMENT': '할부 개월 수가 한도를 초과했습니다.',
    'RESTRICTED_TRANSFER_ACCOUNT': '계좌이체가 제한된 계좌입니다.',
    'INVALID_CARD_INSTALLMENT': '할부가 지원되지 않는 카드입니다.',
    'NOT_SUPPORTED_CARD': '지원하지 않는 카드입니다.',
    'INVALID_CARD_NUMBER': '카드번호가 올바르지 않습니다.',
    'INVALID_CUSTOMER_KEY': '고객 키가 올바르지 않습니다.',
    'FAILED_INTERNAL_SYSTEM_PROCESSING': '내부 시스템 처리 중 오류가 발생했습니다.',
    'FAILED_PG_PROCESSING': 'PG사 처리 중 오류가 발생했습니다.',
    'PAYMENT_TIMEOUT': '결제 시간이 초과되었습니다.',
    'PAYMENT_AMOUNT_EXCEEDED': '결제 금액이 한도를 초과했습니다.',
  };

  return errorMessages[code] || '결제 처리 중 오류가 발생했습니다.';
};

/**
 * 테스트 환경 여부 확인
 */
export const isTestMode = (): boolean => {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  return clientKey?.startsWith('test_') ?? false;
};

/**
 * 결제 성공 URL 생성
 */
export const getSuccessUrl = (orderId?: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const path = orderId ? `/payment/success?orderId=${orderId}` : '/payment/success';
  return `${baseUrl}${path}`;
};

/**
 * 결제 실패 URL 생성
 */
export const getFailUrl = (orderId?: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const path = orderId ? `/payment/fail?orderId=${orderId}` : '/payment/fail';
  return `${baseUrl}${path}`;
};