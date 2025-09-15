// TossPayments 전용 타입 정의

export interface TossPaymentRequest {
  amount: number;
  orderId: string;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
  customerMobilePhone?: string;
  successUrl?: string;
  failUrl?: string;
  metadata?: Record<string, any>;
}

export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  orderName: string;
  method: string;
  status: 'READY' | 'IN_PROGRESS' | 'WAITING_FOR_DEPOSIT' | 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED' | 'EXPIRED';
  requestedAt: string;
  approvedAt?: string;
  card?: TossCardInfo;
  virtualAccount?: TossVirtualAccountInfo;
  easyPay?: TossEasyPayInfo;
  transfer?: TossTransferInfo;
  mobilePhone?: TossMobilePhoneInfo;
  giftCertificate?: TossGiftCertificateInfo;
  receipt?: {
    url: string;
  };
  checkout?: {
    url: string;
  };
  currency: string;
  totalAmount: number;
  balanceAmount: number;
  suppliedAmount: number;
  vat: number;
  taxFreeAmount: number;
  taxExemptionAmount: number;
  cancels?: TossCancelInfo[];
  isPartialCancelable: boolean;
  metadata?: Record<string, any>;
}

export interface TossCardInfo {
  company: string;
  number: string;
  installmentPlanMonths: number;
  isInterestFree: boolean;
  interestPayer?: string;
  approveNo: string;
  useCardPoint: boolean;
  cardType: string;
  ownerType: string;
  acquireStatus: string;
  receiptUrl: string;
  amount: number;
}

export interface TossVirtualAccountInfo {
  accountType: string;
  accountNumber: string;
  bank: string;
  customerName: string;
  dueDate: string;
  refundStatus: string;
  expired: boolean;
  settlementStatus: string;
  refundReceiveAccount?: {
    bank: string;
    accountNumber: string;
    holderName: string;
  };
}

export interface TossEasyPayInfo {
  provider: string;
  amount: number;
  discountAmount: number;
}

export interface TossTransferInfo {
  bank: string;
  settlementStatus: string;
}

export interface TossMobilePhoneInfo {
  carrier: string;
  customerMobilePhone: string;
  settlementStatus: string;
}

export interface TossGiftCertificateInfo {
  provider: string;
  balance: number;
  settlementStatus: string;
}

export interface TossCancelInfo {
  cancelAmount: number;
  cancelReason: string;
  taxFreeAmount: number;
  taxExemptionAmount: number;
  refundableAmount: number;
  easyPayDiscountAmount: number;
  canceledAt: string;
  transactionKey: string;
  receiptKey?: string;
  cancelStatus: string;
  cancelRequestId?: string;
}

export interface TossPaymentError {
  code: string;
  message: string;
}

export interface TossBillingKeyRequest {
  customerKey: string;
  cardNumber: string;
  cardExpirationYear: string;
  cardExpirationMonth: string;
  cardPassword: string;
  customerIdentityNumber: string;
  customerName?: string;
  customerEmail?: string;
}

export interface TossBillingKeyResponse {
  mId: string;
  customerKey: string;
  authenticatedAt: string;
  method: string;
  billingKey: string;
  card: {
    issuerCode: string;
    acquirerCode: string;
    number: string;
    cardType: string;
    ownerType: string;
  };
}

// 정산 관련 타입
export interface TossSettlementRequest {
  photographerId: string;
  amount: number;
  settlementPeriod: string;
  paymentIds: string[];
}

export interface TossPayoutRequest {
  refPayoutId: string;
  destination: string;
  scheduleType: 'EXPRESS' | 'SCHEDULED';
  payoutDate?: string;
  amount: {
    currency: string;
    value: number;
  };
  transactionDescription: string;
  metadata?: Record<string, any>;
}

export interface TossSellerInfo {
  refSellerId: string;
  businessType: 'INDIVIDUAL' | 'INDIVIDUAL_BUSINESS' | 'CORPORATE';
  company?: {
    name: string;
    representativeName: string;
    businessRegistrationNumber: string;
    email: string;
    phone: string;
  };
  individual?: {
    name: string;
    residentRegistrationNumber: string;
    email: string;
    phone: string;
  };
  account: {
    bankCode: string;
    accountNumber: string;
    holderName: string;
  };
  metadata?: Record<string, any>;
}

export interface TossSellerStatus {
  id: string;
  refSellerId: string;
  status: 'APPROVAL_REQUIRED' | 'PARTIALLY_APPROVED' | 'KYC_REQUIRED' | 'APPROVED';
  businessType: string;
  account: {
    bankCode: string;
    accountNumber: string;
    holderName: string;
  };
}

export interface TossBalance {
  pendingAmount: {
    currency: string;
    value: number;
  };
  availableAmount: {
    currency: string;
    value: number;
  };
}

// 웹훅 이벤트 타입
export type TossWebhookEventType =
  | 'PAYMENT.DONE'
  | 'PAYMENT.CANCELED'
  | 'PAYMENT.PARTIAL_CANCELED'
  | 'PAYMENT.ABORTED'
  | 'PAYMENT.EXPIRED'
  | 'VIRTUAL_ACCOUNT.DEPOSIT'
  | 'PAYOUT.COMPLETED'
  | 'PAYOUT.FAILED'
  | 'SELLER.CHANGED';

export interface TossWebhookEvent {
  eventType: TossWebhookEventType;
  eventId: string;
  timestamp: string;
  data: Record<string, any>;
}