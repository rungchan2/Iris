/**
 * 멀티 PG 결제 시스템을 위한 TypeScript 타입 정의
 * 
 * 이 파일은 Iris 프로젝트의 PG 중립적 결제 시스템에서 사용되는
 * 모든 타입을 정의합니다. (1차: NicePay, 확장: Eximbay, Adyen 등)
 */

// ================================
// PG 공급자 및 기본 결제 관련 타입
// ================================

/**
 * 지원 PG 공급자 타입
 */
export type PaymentProvider = 
  | 'nicepay'    // 나이스페이먼츠 (국내)
  | 'eximbay'    // 엑심베이 (해외)
  | 'adyen'      // Adyen (해외)
  | 'stripe'     // Stripe (해외)
  | 'toss'       // 토스페이먼츠 (국내)

/**
 * 표준화된 결제 수단 타입 (PG 중립적)
 */
export type StandardPaymentMethod = 
  // 카드 결제
  | 'card'              // 신용/체크카드
  
  // 계좌 결제
  | 'bank_transfer'     // 실시간 계좌이체
  | 'virtual_account'   // 가상계좌 (사용하지 않음)
  
  // 모바일 결제
  | 'cellphone'         // 휴대폰 소액결제
  
  // 전자지갑 (해외)
  | 'wallet:paypal'     // PayPal
  | 'wallet:alipay'     // Alipay
  | 'wallet:wechatpay'  // WeChat Pay
  | 'wallet:googlepay'  // Google Pay
  | 'wallet:applepay'   // Apple Pay
  
  // 간편결제 (국내)
  | 'wallet:kakaopay'   // 카카오페이
  | 'wallet:naverpay'   // 네이버페이
  | 'wallet:samsungpay' // 삼성페이
  | 'wallet:payco'      // 페이코
  | 'wallet:ssgpay'     // SSGPAY
  
  // BNPL (Buy Now Pay Later)
  | 'bnpl:klarna'       // Klarna
  | 'bnpl:afterpay'     // Afterpay

/**
 * PG별 결제 수단 매핑 (하위호환성 유지)
 */
export type NicePayMethod = 
  | 'card' | 'bank' | 'cellphone' 
  | 'naverpayCard' | 'kakaopay' | 'kakaopayCard' | 'kakaopayMoney'
  | 'samsungpayCard' | 'payco' | 'ssgpay' | 'cardAndEasyPay'

/**
 * 결제 수단 타입 (하위 호환성을 위해 유지)
 */
export type PaymentMethod = StandardPaymentMethod | NicePayMethod

/**
 * 결제 상태 타입
 */
export type PaymentStatus = 
  | 'pending'           // 대기중
  | 'paid'              // 결제완료
  | 'failed'            // 결제실패
  | 'cancelled'         // 취소됨
  | 'partialCancelled'  // 부분취소됨
  | 'refunded'          // 환불됨
  | 'expired'           // 만료됨

/**
 * 환불 타입
 */
export type RefundType = 
  | 'full'     // 전액 환불
  | 'partial'  // 부분 환불

/**
 * 환불 상태
 */
export type RefundStatus = 
  | 'pending'   // 환불 대기
  | 'completed' // 환불 완료
  | 'failed'    // 환불 실패


// ================================
// PaymentAdapter 인터페이스
// ================================

/**
 * 모든 PG 구현체가 따라야 하는 공통 인터페이스
 */
export interface PaymentAdapter {
  /**
   * 결제 초기화 (결제창 호출용 데이터 생성)
   */
  initializePayment(request: PaymentInitializeRequest): Promise<PaymentInitializeResult>
  
  /**
   * 결제 승인 (인증 완료 후 최종 승인)
   */
  approvePayment(request: PaymentApprovalRequest): Promise<PaymentApprovalResult>
  
  /**
   * 결제 취소/환불
   */
  cancelPayment(request: PaymentCancelRequest): Promise<PaymentCancelResult>
  
  /**
   * 결제 상태 조회
   */
  getPaymentStatus(transactionId: string): Promise<PaymentStatusResult>
  
  /**
   * 웹훅 데이터 검증 및 파싱
   */
  verifyAndParseWebhook(rawData: any, signature?: string): Promise<WebhookParseResult>
}

/**
 * PaymentAdapter 팩토리 함수 타입
 */
export type PaymentAdapterFactory = (provider: PaymentProvider) => PaymentAdapter

/**
 * PaymentAdapter 구현을 위한 기본 설정 타입
 */
export interface PaymentAdapterConfig {
  provider: PaymentProvider
  environment: 'development' | 'production'
  credentials: {
    clientId: string
    clientSecret: string
    [key: string]: string
  }
  endpoints: {
    initialize: string
    approve: string
    cancel: string
    status: string
    webhook: string
  }
  options?: Record<string, any>
}

/**
 * 구체적인 PG 어댑터들의 기본 클래스 인터페이스
 */
export interface BasePaymentAdapter extends PaymentAdapter {
  readonly provider: PaymentProvider
  readonly config: PaymentAdapterConfig
  
  /**
   * PG별 결제수단 매핑
   */
  mapStandardToProviderMethod(method: StandardPaymentMethod): string
  
  /**
   * PG별 결제수단을 표준 결제수단으로 역매핑
   */
  mapProviderToStandardMethod(providerMethod: string): StandardPaymentMethod
  
  /**
   * PG별 상태를 표준 상태로 매핑
   */
  mapProviderToStandardStatus(providerStatus: string): PaymentStatus
  
  /**
   * 요청 데이터 검증
   */
  validateRequest(request: any): Promise<boolean>
  
  /**
   * 웹훅 서명 검증
   */
  verifyWebhookSignature(rawData: any, signature: string): boolean
}

/**
 * 나이스페이 어댑터 특화 인터페이스
 */
export interface NicePayAdapter extends BasePaymentAdapter {
  provider: 'nicepay'
  
  /**
   * 나이스페이 전용 승인 요청
   */
  approveNicePayment(params: NicePayApprovalRequest & { tid: string }): Promise<PaymentApprovalResult>
  
  /**
   * 나이스페이 전용 취소 요청
   */
  cancelNicePayment(params: NicePayCancelRequest & { tid: string }): Promise<PaymentCancelResult>
  
  /**
   * 나이스페이 전용 거래 조회
   */
  getNicePaymentStatus(tid: string): Promise<PaymentStatusResult>
}

/**
 * Eximbay 어댑터 인터페이스 (해외 결제용)
 */
export interface EximbayAdapter extends BasePaymentAdapter {
  provider: 'eximbay'
  
  /**
   * 통화별 결제 지원 여부 확인
   */
  supportsCurrency(currency: string): boolean
  
  /**
   * 국가별 결제수단 지원 여부 확인
   */
  supportsPaymentMethodInCountry(method: StandardPaymentMethod, countryCode: string): boolean
}

/**
 * Adyen 어댑터 인터페이스 (글로벌 결제용)
 */
export interface AdyenAdapter extends BasePaymentAdapter {
  provider: 'adyen'
  
  /**
   * Adyen 세션 생성
   */
  createAdyenSession(request: PaymentInitializeRequest): Promise<{ sessionId: string, sessionData: string }>
  
  /**
   * Drop-in 컴포넌트용 설정 생성
   */
  createDropinConfig(): Record<string, any>
}

/**
 * 토스페이먼츠 어댑터 인터페이스
 */
export interface TossPaymentsAdapter extends BasePaymentAdapter {
  provider: 'toss'
  
  /**
   * 토스페이먼츠 결제창 정보 생성
   */
  createTossPaymentWidget(request: PaymentInitializeRequest): Promise<{ paymentKey: string, orderId: string }>
}

/**
 * PG별 어댑터 타입 유니온
 */
export type ProviderSpecificAdapter = 
  | NicePayAdapter 
  | EximbayAdapter 
  | AdyenAdapter 
  | TossPaymentsAdapter

/**
 * 어댑터 팩토리 매핑 타입
 */
export type AdapterFactoryMap = {
  [K in PaymentProvider]: () => ProviderSpecificAdapter & { provider: K }
}

// ================================
// PG 중립적 요청/응답 타입
// ================================

/**
 * 결제 초기화 요청 타입 (PG 중립적)
 */
export interface PaymentInitializeRequest {
  orderId: string
  amount: number
  currency: string
  paymentMethod: StandardPaymentMethod
  provider: PaymentProvider
  buyerInfo: {
    name: string
    email: string
    phone?: string
  }
  productInfo: {
    name: string
    description?: string
  }
  callbackUrls: {
    return: string
    cancel: string
    error: string
  }
  metadata?: Record<string, any>
}

/**
 * 결제 초기화 결과 타입
 */
export interface PaymentInitializeResult {
  success: boolean
  orderId: string
  provider: PaymentProvider
  providerTransactionId?: string
  redirectUrl?: string
  paymentData?: Record<string, any>
  error?: string
}

/**
 * 결제 승인 요청 타입
 */
export interface PaymentApprovalRequest {
  orderId: string
  provider: PaymentProvider
  providerTransactionId: string
  amount: number
  authData?: Record<string, any>
}

/**
 * 결제 승인 결과 타입
 */
export interface PaymentApprovalResult {
  success: boolean
  orderId: string
  provider: PaymentProvider
  providerTransactionId: string
  status: PaymentStatus
  amount: number
  paidAt?: string
  paymentInfo?: {
    method: StandardPaymentMethod
    cardInfo?: Record<string, any>
    bankInfo?: Record<string, any>
    walletInfo?: Record<string, any>
  }
  receiptUrl?: string
  rawResponse: Record<string, any>
  error?: string
}

/**
 * 결제 취소 요청 타입
 */
export interface PaymentCancelRequest {
  orderId: string
  provider: PaymentProvider
  providerTransactionId: string
  cancelAmount?: number
  reason: string
  refundAccount?: {
    bankCode: string
    accountNumber: string
    holderName: string
  }
}

/**
 * 결제 취소 결과 타입
 */
export interface PaymentCancelResult {
  success: boolean
  orderId: string
  provider: PaymentProvider
  providerRefundId: string
  cancelAmount: number
  remainingAmount: number
  canceledAt: string
  rawResponse: Record<string, any>
  error?: string
}

/**
 * 결제 상태 조회 결과 타입
 */
export interface PaymentStatusResult {
  success: boolean
  orderId: string
  provider: PaymentProvider
  providerTransactionId: string
  status: PaymentStatus
  amount: number
  paidAt?: string
  rawResponse: Record<string, any>
  error?: string
}

/**
 * 웹훅 파싱 결과 타입
 */
export interface WebhookParseResult {
  success: boolean
  provider: PaymentProvider
  eventType: WebhookEventType
  orderId: string
  providerTransactionId: string
  status: PaymentStatus
  amount?: number
  timestamp: string
  rawData: Record<string, any>
  error?: string
}

// ================================
// 레거시 호환용 결제 요청/응답 타입
// ================================

/**
 * 결제 생성 요청 타입
 */
export interface PaymentCreateRequest {
  inquiryId: string
  userId: string
  photographerId: string
  amount: number
  paymentMethod: PaymentMethod
  buyerName: string
  buyerEmail: string
  buyerTel?: string
  productName: string
  mallReserved?: Record<string, any> // 추가 데이터
}

/**
 * 결제 생성 응답 타입
 */
export interface PaymentCreateResponse {
  success: boolean
  orderId?: string
  paymentId?: string
  error?: string
}

/**
 * 환불 요청 타입
 */
export interface RefundRequest {
  paymentId: string
  reason: string
  amount?: number          // 미입력시 전액 환불
  refundType?: RefundType  // 기본값 'full'
  // 가상계좌 환불시 필요
  refundAccount?: string   
  refundBankCode?: string
  refundHolder?: string
}

/**
 * 환불 응답 타입
 */
export interface RefundResponse {
  success: boolean
  refundId?: string
  cancelledTid?: string
  refundAmount?: number
  error?: string
}

// ================================
// 나이스페이 API 관련 타입
// ================================

/**
 * 나이스페이 결제창 요청 파라미터
 */
export interface NicePayRequestParams {
  clientId: string
  method: PaymentMethod
  orderId: string
  amount: number
  goodsName: string
  returnUrl: string
  
  // 선택적 파라미터
  mallReserved?: string
  mallUserId?: string
  buyerName?: string
  buyerTel?: string
  buyerEmail?: string
  useEscrow?: boolean
  currency?: string
  logoImgUrl?: string
  language?: 'KO' | 'EN' | 'CN'
  returnCharSet?: 'utf-8' | 'euc-kr'
  skinType?: 'red' | 'green' | 'purple' | 'gray' | 'dark'
  
  // 부가세
  taxFreeAmt?: number
  
  // 카드 관련
  cardQuota?: string
  cardCode?: string
  cardShowOpt?: string
  
  
  // 휴대폰
  isDigital?: boolean
  
  // 현금영수증
  directReceiptType?: 'unPublished' | 'individual' | 'company'
  directReceiptNo?: string
  
  // PC 옵션
  disableScroll?: boolean
  disableEdgeChk?: boolean
  zIdxHigher?: boolean
  
  // 모바일 옵션
  appScheme?: string
}

/**
 * 나이스페이 인증 결과 타입
 */
export interface NicePayAuthResult {
  authResultCode: string    // '0000'이면 성공
  authResultMsg: string     // 인증 결과 메시지
  tid: string               // 결제 인증 키
  clientId: string          // 가맹점 식별코드
  orderId: string           // 상점 거래 고유번호
  amount: string            // 결제 금액
  mallReserved: string      // 상점 예약필드
  authToken: string         // 인증 TOKEN
  signature: string         // 위변조 검증 데이터
}

/**
 * 나이스페이 승인 요청 타입
 */
export interface NicePayApprovalRequest {
  amount: number
  ediDate?: string
  signData?: string
  returnCharSet?: string
}

/**
 * 나이스페이 카드 정보 타입
 */
export interface NicePayCardInfo {
  cardCode: string          // 신용카드사별 코드
  cardName: string          // 결제 카드사 이름
  cardNum: string           // 마스킹된 카드번호
  cardQuota: string         // 할부개월
  isInterestFree: boolean   // 상점분담무이자 여부
  cardType?: string         // 카드 구분 (credit/check)
  canPartCancel: string     // 부분취소 가능 여부
  acquCardCode: string      // 매입카드사코드
  acquCardName: string      // 매입카드사명
}

/**
 * 나이스페이 은행 정보 타입
 */
export interface NicePayBankInfo {
  bankCode: string          // 결제은행코드
  bankName: string          // 결제은행명
}


/**
 * 나이스페이 현금영수증 정보 타입
 */
export interface NicePayCashReceiptInfo {
  receiptTid: string        // 현금영수증 TID
  orgTid: string            // 연관된 원 승인/취소 거래 TID
  status: string            // 발급진행 상태
  amount: number            // 현금영수증 발행 총금액
  taxFreeAmt: number        // 현금영수증 전체 금액중에서 면세금액
  receiptType: string       // 현금영수증 타입
  issueNo: string           // 현금영수증 국세청 발행번호
  receiptUrl: string        // 현금영수증 매출전표 확인 URL
}

/**
 * 나이스페이 승인 응답 타입
 */
export interface NicePayApprovalResponse {
  resultCode: string        // '0000'이면 성공
  resultMsg: string         // 결제결과메시지
  tid: string               // 결제 승인 키
  cancelledTid?: string     // 취소 거래 키
  orderId: string           // 상점 거래 고유번호
  ediDate: string           // 응답전문생성일시
  signature?: string        // 위변조 검증 데이터
  status: PaymentStatus     // 결제 처리상태
  paidAt: string            // 결제완료시점 ISO 8601
  failedAt: string          // 결제실패시점 ISO 8601
  cancelledAt: string       // 결제취소시점 ISO 8601
  payMethod: PaymentMethod  // 결제수단
  amount: number            // 결제 금액
  balanceAmt: number        // 취소 가능 잔액
  goodsName: string         // 상품명
  mallReserved?: string     // 상점 정보 전달용 예비필드
  useEscrow: boolean        // 에스크로 거래 여부
  currency: string          // 결제승인화폐단위
  channel?: string          // pc/mobile
  approveNo?: string        // 제휴사 승인 번호
  buyerName?: string        // 구매자 명
  buyerTel?: string         // 구매자 전화번호
  buyerEmail?: string       // 구매자 이메일
  issuedCashReceipt?: boolean // 현금영수증 발급여부
  receiptUrl?: string       // 매출전표 확인 URL
  mallUserId?: string       // 상점에서 관리하는 사용자 아이디
  
  // 할인 정보
  coupon?: {
    couponAmt: number       // 즉시할인 적용된 금액
  }
  
  // 결제수단별 상세 정보
  card?: NicePayCardInfo
  bank?: NicePayBankInfo
  cashReceipts?: NicePayCashReceiptInfo[]
}

/**
 * 나이스페이 취소 요청 타입
 */
export interface NicePayCancelRequest {
  reason: string            // 취소사유
  orderId: string           // 상점 거래 고유번호
  cancelAmt?: number        // 부분취소 요청금액
  mallReserved?: string     // 상점 예약필드
  ediDate?: string          // 전문생성일시
  signData?: string         // 위변조 검증 Data
  returnCharSet?: string    // 응답파라메터 인코딩 방식
  taxFreeAmt?: number       // 취소금액중 면세공급가액
  
  // 환불 계좌 정보 (가상계좌 환불시)
  refundAccount?: string    // 환불계좌번호
  refundBankCode?: string   // 환불계좌코드
  refundHolder?: string     // 환불계좌 예금주명
}

/**
 * 나이스페이 거래 조회 응답 타입
 * (승인 응답과 동일한 구조)
 */
export type NicePayTransactionResponse = NicePayApprovalResponse

// ================================
// 데이터베이스 모델 타입
// ================================

/**
 * 결제 데이터베이스 모델 (PG 중립적)
 */
export interface PaymentModel {
  id: string
  inquiry_id: string
  user_id: string
  photographer_id: string
  order_id: string
  amount: number
  currency: string
  status: PaymentStatus
  
  // PG 중립적 필드들
  provider: PaymentProvider              // PG 공급자
  provider_transaction_id?: string       // PG별 거래 ID
  raw_response?: Record<string, any>     // 원본 PG 응답 데이터
  
  // 하위 호환성을 위한 필드들 (deprecated, 추후 제거 예정)
  /** @deprecated Use provider_transaction_id instead */
  tid?: string
  /** @deprecated Use raw_response instead */
  auth_token?: string
  /** @deprecated Use raw_response instead */
  nicepay_response?: NicePayApprovalResponse
  
  // 공통 결제 정보
  payment_method: PaymentMethod
  card_info?: NicePayCardInfo | Record<string, any>
  bank_info?: NicePayBankInfo | Record<string, any>
  easy_pay_info?: Record<string, any>
  buyer_name?: string
  buyer_email?: string
  buyer_tel?: string
  paid_at?: string
  failed_at?: string
  cancelled_at?: string
  receipt_url?: string
  error_message?: string
  admin_memo?: string
  created_at: string
  updated_at: string
}

/**
 * 환불 데이터베이스 모델 (PG 중립적)
 */
export interface RefundModel {
  id: string
  payment_id: string
  refund_amount: number
  refund_reason: string
  refund_type: RefundType
  status: RefundStatus
  
  // PG 중립적 필드들
  provider: PaymentProvider                    // PG 공급자
  provider_refund_id?: string                  // PG별 환불 ID
  refund_response?: Record<string, any>        // 원본 PG 환불 응답 데이터
  
  // 하위 호환성을 위한 필드들 (deprecated, 추후 제거 예정)
  /** @deprecated Use provider_refund_id instead */
  cancelled_tid?: string
  /** @deprecated Use refund_response instead */
  nicepay_response?: Record<string, any>
  
  // 환불 계좌 정보
  refund_account?: string
  refund_bank_code?: string
  refund_holder?: string
  
  // 요청/처리 정보
  requested_by: string
  processed_by?: string
  requested_at: string
  processed_at?: string
  admin_note?: string
  created_at: string
  updated_at: string
}


/**
 * 결제 로그 데이터베이스 모델 (PG 중립적)
 */
export interface PaymentLogModel {
  id: string
  payment_id?: string
  provider?: PaymentProvider        // 로그 생성 PG 공급자
  event_type: string
  event_data?: Record<string, any>
  ip_address?: string
  user_agent?: string
  referer?: string
  response_time_ms?: number
  http_status_code?: number
  error_message?: string
  created_at: string
}

// ================================
// API 응답 타입
// ================================

/**
 * API 성공 응답 타입
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

/**
 * API 에러 응답 타입
 */
export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}

/**
 * API 응답 타입 (성공 또는 에러)
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// ================================
// 웹훅 관련 타입
// ================================

/**
 * 웹훅 이벤트 타입
 */
export type WebhookEventType =
  | 'payment.paid'      // 결제 완료
  | 'payment.cancelled' // 결제 취소
  | 'payment.failed'    // 결제 실패

/**
 * 웹훅 데이터 타입
 */
export interface WebhookData {
  eventType: WebhookEventType
  data: {
    tid: string
    orderId: string
    amount: number
    status: PaymentStatus
    paidAt?: string
    cancelledAt?: string
    failedAt?: string
    reason?: string
    [key: string]: any
  }
  timestamp: string
}

// ================================
// 통계 관련 타입
// ================================

/**
 * 결제 통계 타입
 */
export interface PaymentStatistics {
  totalRevenue: number        // 총 매출
  totalPayments: number       // 총 결제 건수
  pendingPayments: number     // 대기 중인 결제
  completedPayments: number   // 완료된 결제
  failedPayments: number      // 실패한 결제
  cancelledPayments: number   // 취소된 결제
  refundedPayments: number    // 환불된 결제
  averageAmount: number       // 평균 결제 금액
  
  // 월별 통계
  monthlyRevenue: Record<string, number>
  monthlyCount: Record<string, number>
  
  // 결제수단별 통계
  paymentMethodStats: Record<PaymentMethod, {
    count: number
    amount: number
  }>
}

/**
 * 정산 정보 타입
 */
export interface SettlementInfo {
  photographerId: string
  settlementPeriod: string    // YYYY-MM
  settlementDate: string      // 정산일
  totalPaymentAmount: number  // 총 결제 금액
  platformFee: number         // 플랫폼 수수료
  taxAmount: number          // 세금
  settlementAmount: number   // 최종 정산 금액
  paymentCount: number       // 결제 건수
  refundCount: number        // 환불 건수
  status: 'pending' | 'completed' | 'cancelled'
  transferredAt?: string     // 입금 완료 시간
}

// ================================
// 유틸리티 타입
// ================================

/**
 * 결제 필터 옵션
 */
export interface PaymentFilterOptions {
  userId?: string
  photographerId?: string
  status?: PaymentStatus
  paymentMethod?: PaymentMethod
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  limit?: number
  offset?: number
}

/**
 * 환불 필터 옵션
 */
export interface RefundFilterOptions {
  paymentId?: string
  status?: RefundStatus
  refundType?: RefundType
  startDate?: string
  endDate?: string
  requestedBy?: string
  processedBy?: string
  limit?: number
  offset?: number
}

// ================================
// 글로벌 타입 확장
// ================================

/**
 * Window 객체에 NicePay SDK 추가
 */
declare global {
  interface Window {
    AUTHNICE: {
      requestPay: (params: NicePayRequestParams) => void
    }
  }
}

// ================================
// 타입 가드 함수들을 위한 타입
// ================================

/**
 * API 응답 타입 가드를 위한 타입
 */
export const isApiSuccessResponse = <T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> => {
  return response.success === true
}

export const isApiErrorResponse = (
  response: ApiResponse
): response is ApiErrorResponse => {
  return response.success === false
}

/**
 * 결제 상태 체크를 위한 타입 가드
 */
export const isPaidStatus = (status: PaymentStatus): boolean => {
  return status === 'paid'
}

export const isFailedStatus = (status: PaymentStatus): boolean => {
  return status === 'failed'
}

export const isCancelledStatus = (status: PaymentStatus): boolean => {
  return status === 'cancelled' || status === 'partialCancelled' || status === 'refunded'
}

export const isPendingStatus = (status: PaymentStatus): boolean => {
  return status === 'pending' || status === 'ready'
}