// TossPayments 서버 측 유틸리티
import { paymentLogger } from "@/lib/logger"

import { TossPaymentResponse, TossPaymentError } from './toss-types';
import crypto from 'crypto';

const TOSS_API_BASE = 'https://api.tosspayments.com/v1';

/**
 * Base64 인코딩 헬퍼
 */
export function encodeSecretKey(secretKey: string): string {
  return Buffer.from(secretKey + ':').toString('base64');
}

/**
 * TossPayments API 호출 헬퍼
 */
export async function tossApiRequest<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'DELETE';
    body?: any;
    secretKey?: string;
  } = {}
): Promise<T> {
  const { method = 'GET', body, secretKey = process.env.TOSS_SECRET_KEY } = options;

  if (!secretKey) {
    throw new Error('TossPayments 시크릿 키가 설정되지 않았습니다.');
  }

  const response = await fetch(`${TOSS_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Basic ${encodeSecretKey(secretKey)}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new TossApiError(data);
  }

  return data;
}

/**
 * TossPayments API 에러 클래스
 */
export class TossApiError extends Error {
  code: string;
  statusCode: number;

  constructor(error: TossPaymentError & { statusCode?: number }) {
    super(error.message);
    this.name = 'TossApiError';
    this.code = error.code;
    this.statusCode = error.statusCode || 500;
  }
}

/**
 * 결제 승인 API 호출
 */
export async function confirmPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<TossPaymentResponse> {
  // 개발 환경에서 API 키 정보 확인
  if (process.env.NODE_ENV === 'development') {
    const secretKey = process.env.TOSS_SECRET_KEY;
    paymentLogger.info('=== 토스페이먼츠 API 호출 ===');
    paymentLogger.info('Endpoint: /payments/confirm');
    paymentLogger.info('Secret Key 존재:', !!secretKey);
    paymentLogger.info('Secret Key 타입:', secretKey?.startsWith('test_') ? 'TEST' : secretKey?.startsWith('live_') ? 'LIVE' : 'UNKNOWN');
    paymentLogger.info('Request Body:', JSON.stringify(params, null, 2));
    paymentLogger.info('========================');
  }
  
  return tossApiRequest<TossPaymentResponse>('/payments/confirm', {
    method: 'POST',
    body: params,
  });
}

/**
 * 결제 조회 API 호출
 */
export async function getPayment(paymentKeyOrOrderId: string): Promise<TossPaymentResponse> {
  return tossApiRequest<TossPaymentResponse>(`/payments/${paymentKeyOrOrderId}`);
}

/**
 * 결제 취소 API 호출
 */
export async function cancelPayment(
  paymentKey: string,
  params: {
    cancelReason: string;
    cancelAmount?: number;
    refundReceiveAccount?: {
      bank: string;
      accountNumber: string;
      holderName: string;
    };
    taxFreeAmount?: number;
    refundableAmount?: number;
  }
): Promise<TossPaymentResponse> {
  return tossApiRequest<TossPaymentResponse>(`/payments/${paymentKey}/cancel`, {
    method: 'POST',
    body: params,
  });
}

/**
 * 빌링키 발급 API 호출
 */
export async function issueBillingKey(params: {
  customerKey: string;
  cardNumber: string;
  cardExpirationYear: string;
  cardExpirationMonth: string;
  cardPassword: string;
  customerIdentityNumber: string;
  customerName?: string;
  customerEmail?: string;
}): Promise<any> {
  return tossApiRequest('/billing/authorizations/card', {
    method: 'POST',
    body: params,
  });
}

/**
 * 빌링키로 자동결제 실행
 */
export async function executeBilling(params: {
  customerKey: string;
  amount: number;
  billingKey: string;
  orderId: string;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
  taxFreeAmount?: number;
}): Promise<TossPaymentResponse> {
  return tossApiRequest(`/billing/${params.billingKey}`, {
    method: 'POST',
    body: {
      customerKey: params.customerKey,
      amount: params.amount,
      orderId: params.orderId,
      orderName: params.orderName,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      taxFreeAmount: params.taxFreeAmount,
    },
  });
}

/**
 * 웹훅 서명 검증
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,  
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');
  
  return hash === signature;
}

/**
 * 결제 상태를 내부 상태로 매핑
 */
export function mapTossStatusToInternal(tossStatus: string): string {
  const statusMap: Record<string, string> = {
    'READY': 'pending',
    'IN_PROGRESS': 'pending',
    'WAITING_FOR_DEPOSIT': 'pending',
    'DONE': 'paid',
    'CANCELED': 'cancelled',
    'PARTIAL_CANCELED': 'partial_refunded',
    'ABORTED': 'failed',
    'EXPIRED': 'expired',
  };

  return statusMap[tossStatus] || 'unknown';
}

/**
 * 결제 수단을 내부 타입으로 매핑
 */
export function mapTossMethodToInternal(tossMethod: string): string {
  const methodMap: Record<string, string> = {
    '카드': 'card',
    '가상계좌': 'virtual_account',
    '계좌이체': 'transfer',
    '휴대폰': 'mobile',
    '상품권': 'gift_certificate',
    '토스페이': 'tosspay',
    '네이버페이': 'naverpay',
    '카카오페이': 'kakaopay',
    '삼성페이': 'samsungpay',
    '페이코': 'payco',
    'SSG페이': 'ssgpay',
    '엘페이': 'lpay',
  };

  return methodMap[tossMethod] || tossMethod.toLowerCase();
}

/**
 * 에러 코드별 사용자 친화적 메시지 반환
 */
export function getUserFriendlyErrorMessage(error: TossApiError): string {
  const messages: Record<string, string> = {
    'ALREADY_PROCESSED_PAYMENT': '이미 처리된 결제입니다.',
    'PROVIDER_ERROR': '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    'EXCEED_MAX_CARD_INSTALLMENT': '설정 가능한 최대 할부 개월 수를 초과했습니다.',
    'INVALID_REQUEST': '잘못된 요청입니다. 입력 정보를 확인해주세요.',
    'NOT_FOUND_PAYMENT': '결제 정보를 찾을 수 없습니다.',
    'NOT_FOUND_PAYMENT_SESSION': '결제 세션이 만료되었습니다. 다시 시도해주세요.',
    'INVALID_AUTHORIZATION': '인증 정보가 올바르지 않습니다.',
    'UNAUTHORIZED_KEY': 'API 키가 올바르지 않습니다. 키 설정을 확인해주세요.',
    'FORBIDDEN_REQUEST': '허용되지 않은 요청입니다. API 키 또는 주문 정보를 확인해주세요.',
    'INCORRECT_AMOUNT': '결제 금액이 일치하지 않습니다.',
    'ALREADY_CANCELED_PAYMENT': '이미 취소된 결제입니다.',
    'CARD_COMPANY_ERROR': '카드사 오류가 발생했습니다. 다른 카드로 시도해주세요.',
    'REJECT_CARD_PAYMENT': '카드 결제가 거절되었습니다. 카드사에 문의해주세요.',
    'INVALID_CARD_NUMBER': '유효하지 않은 카드 번호입니다.',
    'INVALID_CARD_EXPIRY': '카드 유효기간이 올바르지 않습니다.',
    'EXCEEDED_REFUND_AMOUNT': '환불 가능 금액을 초과했습니다.',
  };

  return messages[error.code] || error.message || '결제 처리 중 오류가 발생했습니다.';
}