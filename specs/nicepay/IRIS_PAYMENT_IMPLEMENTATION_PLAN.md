# 🎯 Iris 멀티 PG 결제 시스템 구현 계획

## 📋 개요

Iris 포토매칭 플랫폼에 **PG 중립적인 결제 시스템**을 구축하여 국내외 다양한 PG사를 통한 온라인 결제가 가능하도록 하는 종합적인 결제 시스템 구현 계획입니다.

### 프로젝트 정보
- **프로젝트명**: Iris (아이리스) - 성격유형 기반 포토매칭 플랫폼
- **결제 아키텍처**: PG 중립적 멀티 PG 지원 구조
- **1차 PG**: 나이스페이먼츠 (NicePay) - 국내 결제
- **확장 예정**: 토스페이먼츠, Eximbay, Adyen 등 (해외결제 대응)
- **결제 방식**: Server 승인 모델 (보안 강화)
- **지원 결제수단**: 신용카드, 계좌이체, 네이버페이, 카카오페이, 삼성페이, 페이코, SSGPAY (가상계좌 제외)

### 주요 목표
1. **PG 중립적 아키텍처**: 특정 PG에 종속되지 않는 확장 가능한 구조
2. **국내외 결제 지원**: 해외 PG 연동을 통한 글로벌 서비스 준비
3. 안전하고 신뢰할 수 있는 결제 시스템 구축
4. 다양한 결제 수단 지원으로 사용자 편의성 증대 (가상계좌 제외)
5. 관리자를 위한 효율적인 결제 관리 시스템 제공
6. 자동화된 결제 상태 추적 및 작가 정산 시스템
7. 유연한 부분 환불 시스템 및 상세 환불 사유 관리

---

## 🏗️ 시스템 아키텍처

### 전체 플로우 다이어그램 (PG 중립적 아키텍처)
```mermaid
graph TD
    subgraph "클라이언트"
        A[고객] -->|1. 예약 및 결제 요청| B[예약 페이지]
        B -->|2. PG 선택 및 결제 정보 입력| C[Dynamic PG SDK Loader]
    end
    
    subgraph "PG 서버들"
        C -->|3a. NicePay| D1[NicePay 결제창]
        C -->|3b. Eximbay| D2[Eximbay 결제창]
        C -->|3c. Other PGs| D3[기타 PG 결제창]
        D1 -->|4a. 인증 결과| E1[Return URL]
        D2 -->|4b. 인증 결과| E2[Return URL]
        D3 -->|4c. 인증 결과| E3[Return URL]
    end
    
    subgraph "Iris 서버 - PG 중립 레이어"
        E1 -->|5a. POST 데이터| F[/api/payments/[provider]/process]
        E2 -->|5b. POST 데이터| F
        E3 -->|5c. POST 데이터| F
        
        F -->|6. PaymentAdapter 선택| G[PaymentAdapter Interface]
        G -->|7a. NicePay| H1[NicePayAdapter]
        G -->|7b. Eximbay| H2[EximbayAdapter] 
        G -->|7c. Other| H3[OtherPGAdapter]
        
        H1 -->|8a. API 호출| I1[NicePay API]
        H2 -->|8b. API 호출| I2[Eximbay API]
        H3 -->|8c. API 호출| I3[Other PG API]
        
        I1 -->|9. 승인 결과| J[결과 통합]
        I2 -->|9. 승인 결과| J
        I3 -->|9. 승인 결과| J
        
        J -->|10. 표준화된 데이터 저장| K[Supabase - 중립적 스키마]
        J -->|11. 리다이렉트| L[성공/실패 페이지]
        
        M[Multi-PG Webhook Handler] -->|비동기 알림| N[/api/payments/[provider]/webhook]
        N -->|상태 업데이트| K
    end
    
    subgraph "관리자"
        O[작가/관리자] -->|결제 관리| P[통합 관리 대시보드]
        P -->|PG 무관 조회/취소/환불| Q[통합 관리 API]
    end
```

### 기술 스택
- **Frontend**: Next.js 15+, TypeScript, React Query, Tailwind CSS
- **Backend**: Next.js Server Actions, Dynamic API Routes
- **Database**: Supabase (PostgreSQL) - PG 중립적 스키마
- **Payment Gateways**: 
  - **1차**: NicePay Server API v1 (국내)
  - **확장 예정**: 토스페이먼츠, Eximbay, Adyen (해외)
- **Architecture**: PaymentAdapter Pattern, Provider-based Routing
- **Security**: Bearer Token, Webhook 검증, SSL/TLS, Cross-PG 보안 표준화

---

## 🔧 PG 중립화 아키텍처 설계

### 핵심 설계 원칙

1. **PG 독립성**: 특정 PG에 종속되지 않는 데이터 구조 및 코드 설계
2. **확장성**: 새로운 PG 추가 시 기존 코드 변경 최소화
3. **일관성**: 모든 PG에 대해 동일한 인터페이스와 데이터 포맷 제공
4. **유지보수성**: PG별 로직 분리로 독립적 운영 및 디버깅 가능

### PaymentAdapter 인터페이스 패턴

```typescript
// 모든 PG가 구현해야 하는 공통 인터페이스
export interface PaymentAdapter {
  // 결제 초기화 (결제창 호출용 데이터 생성)
  initializePayment(request: PaymentRequest): Promise<PaymentInitResult>
  
  // 결제 승인 (인증 완료 후 최종 승인)
  approvePayment(request: PaymentApprovalRequest): Promise<PaymentApprovalResult>
  
  // 결제 취소/환불
  cancelPayment(request: PaymentCancelRequest): Promise<PaymentCancelResult>
  
  // 결제 상태 조회
  getPaymentStatus(transactionId: string): Promise<PaymentStatusResult>
  
  // 웹훅 데이터 검증 및 파싱
  verifyAndParseWebhook(rawData: any): Promise<WebhookParseResult>
}

// PG별 구현체 예시
export class NicePayAdapter implements PaymentAdapter { ... }
export class EximbayAdapter implements PaymentAdapter { ... }
export class AdyenAdapter implements PaymentAdapter { ... }
```

### Provider 기반 동적 라우팅

```typescript
// API 라우트 구조
/api/payments/[provider]/
├── process     // 결제 승인 처리
├── webhook     // PG 웹훅 수신
├── cancel      // 결제 취소/환불
└── status      // 상태 조회

// 사용 예시
/api/payments/nicepay/process
/api/payments/eximbay/process
/api/payments/adyen/process
```

### 데이터 표준화 전략

1. **결제 수단 표준화**
   ```typescript
   // 내부 표준 ENUM
   type StandardPaymentMethod = 
     | 'card'              // 신용/체크카드
     | 'bank_transfer'     // 계좌이체
     | 'virtual_account'   // 가상계좌
     | 'wallet:paypal'     // PayPal
     | 'wallet:alipay'     // Alipay
     | 'bnpl:klarna'       // Klarna 등
   
   // PG별 매핑 테이블
   const NICEPAY_METHOD_MAP = {
     'card': 'CARD',
     'bank_transfer': 'BANK',
     'wallet:paypal': 'PAYPAL'
   }
   ```

2. **응답 데이터 표준화**
   ```sql
   -- raw_response: PG 원본 응답 JSON 저장
   -- provider: PG사 구분자
   -- provider_transaction_id: 각 PG의 거래 ID
   ```

---

## 💾 데이터베이스 마이그레이션

### 1. 결제 정보 테이블 (payments)
```sql
-- 결제 정보를 저장하는 메인 테이블
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  photographer_id UUID REFERENCES photographers(id),
  
  -- 결제 기본 정보
  order_id VARCHAR(64) NOT NULL UNIQUE, -- 주문번호 (IRIS_20240831_123456)
  amount INTEGER NOT NULL, -- 결제 금액
  currency VARCHAR(3) DEFAULT 'KRW',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, failed, cancelled, refunded
  
  -- 나이스페이 정보
  tid VARCHAR(30), -- 나이스페이 거래 ID
  auth_token VARCHAR(40), -- 인증 토큰
  payment_method VARCHAR(20), -- card, bank, vbank, naverpay, kakaopay 등
  
  -- 결제 수단별 상세 정보
  card_info JSONB, -- 카드 정보 (카드사, 할부개월 등)
  bank_info JSONB, -- 계좌이체/가상계좌 정보
  easy_pay_info JSONB, -- 간편결제 정보
  
  -- 결제자 정보
  buyer_name VARCHAR(30),
  buyer_email VARCHAR(60),
  buyer_tel VARCHAR(40),
  
  -- 타임스탬프
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- 기타
  receipt_url VARCHAR(200), -- 영수증 URL
  nicepay_response JSONB, -- 전체 응답 데이터 저장
  error_message TEXT, -- 실패 시 에러 메시지
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_payments_inquiry_id ON payments(inquiry_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_photographer_id ON payments(photographer_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_tid ON payments(tid);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
```

### 2. 환불 정보 테이블 (refunds)
```sql
-- 환불/취소 정보를 저장하는 테이블
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  
  -- 환불 정보
  refund_amount INTEGER NOT NULL, -- 환불 금액
  refund_reason TEXT NOT NULL, -- 환불 사유
  refund_type VARCHAR(20) NOT NULL, -- full, partial
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed
  
  -- 나이스페이 환불 정보
  cancelled_tid VARCHAR(30), -- 취소 거래 ID
  
  -- 환불 계좌 정보 (가상계좌 환불 시)
  refund_account VARCHAR(20),
  refund_bank_code VARCHAR(3),
  refund_holder VARCHAR(10),
  
  -- 처리 정보
  requested_by UUID REFERENCES auth.users(id),
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- 기타
  nicepay_response JSONB, -- 나이스페이 응답 데이터
  admin_note TEXT, -- 관리자 메모
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_created_at ON refunds(created_at DESC);
```

### 3. 가상계좌 입금 대기 테이블 (vbank_deposits)
```sql
-- 가상계좌 입금 대기 정보
CREATE TABLE vbank_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  
  -- 가상계좌 정보
  vbank_code VARCHAR(3) NOT NULL, -- 은행 코드
  vbank_name VARCHAR(20) NOT NULL, -- 은행명
  vbank_number VARCHAR(20) NOT NULL, -- 계좌번호
  vbank_holder VARCHAR(40) NOT NULL, -- 예금주명
  vbank_exp_date TIMESTAMP WITH TIME ZONE NOT NULL, -- 입금 만료일
  
  -- 입금 상태
  deposit_status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, deposited, expired
  deposited_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_vbank_deposits_payment_id ON vbank_deposits(payment_id);
CREATE INDEX idx_vbank_deposits_status ON vbank_deposits(deposit_status);
CREATE INDEX idx_vbank_deposits_exp_date ON vbank_deposits(vbank_exp_date);
```

### 4. 결제 로그 테이블 (payment_logs)
```sql
-- 모든 결제 관련 이벤트를 기록
CREATE TABLE payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL, -- auth_request, auth_success, payment_success, cancel_request 등
  event_data JSONB, -- 이벤트 상세 데이터
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX idx_payment_logs_created_at ON payment_logs(created_at DESC);
```

### 5. 기존 테이블 수정
```sql
-- inquiries 테이블에 결제 관련 필드 추가
ALTER TABLE inquiries 
ADD COLUMN payment_required BOOLEAN DEFAULT false,
ADD COLUMN payment_amount INTEGER,
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'not_required', -- not_required, pending, paid, cancelled
ADD COLUMN payment_id UUID REFERENCES payments(id);

-- photographers 테이블에 정산 정보 추가
ALTER TABLE photographers
ADD COLUMN bank_name VARCHAR(20),
ADD COLUMN bank_account VARCHAR(20),
ADD COLUMN account_holder VARCHAR(30),
ADD COLUMN settlement_ratio DECIMAL(3,2) DEFAULT 0.70; -- 정산 비율 (기본 70%)
```

### 6. RLS (Row Level Security) 정책
```sql
-- payments 테이블 RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 결제 정보만 볼 수 있음
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- 관리자는 모든 결제 정보를 볼 수 있음
CREATE POLICY "Admins can view all payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- 작가는 자신에게 들어온 결제만 볼 수 있음
CREATE POLICY "Photographers can view their payments" ON payments
  FOR SELECT USING (auth.uid() = photographer_id);

-- refunds 테이블 RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- 관리자만 환불 처리 가능
CREATE POLICY "Only admins can manage refunds" ON refunds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );
```

---

## 🔧 코드 구현

### 1. 파일 구조
```
photo4you/
├── lib/
│   ├── payments/
│   │   ├── nicepay.ts              # NicePay 유틸리티 함수
│   │   ├── types.ts                # 결제 관련 타입 정의
│   │   └── constants.ts            # 상수 정의
│   ├── actions/
│   │   ├── payments.ts             # 결제 Server Actions
│   │   └── refunds.ts              # 환불 Server Actions
│   └── hooks/
│       ├── usePayment.ts           # 결제 관련 훅
│       └── useNicePaySDK.ts        # NicePay SDK 로드 훅
│
├── app/
│   ├── api/
│   │   └── nicepay/
│   │       ├── auth/route.ts       # 결제 인증 처리
│   │       ├── process/route.ts    # 결제 승인 처리
│   │       ├── cancel/route.ts     # 결제 취소 처리
│   │       ├── status/route.ts     # 결제 상태 조회
│   │       └── webhook/route.ts    # 웹훅 처리
│   │
│   ├── (payment)/
│   │   ├── payment/
│   │   │   ├── success/page.tsx    # 결제 성공 페이지
│   │   │   ├── fail/page.tsx       # 결제 실패 페이지
│   │   │   └── [id]/page.tsx       # 결제 상태 확인 페이지
│   │
│   ├── photographers/
│   │   └── [id]/
│   │       └── booking/
│   │           └── payment/page.tsx # 결제 진행 페이지
│   │
│   ├── admin/
│   │   └── payments/
│   │       ├── page.tsx             # 결제 관리 대시보드
│   │       └── [id]/page.tsx        # 결제 상세 페이지
│   │
│   └── photographer-admin/
│       └── payments/
│           └── page.tsx             # 작가 결제 내역
│
└── components/
    ├── payment/
    │   ├── payment-method-selector.tsx  # 결제수단 선택
    │   ├── payment-info-form.tsx        # 결제 정보 입력
    │   ├── payment-summary.tsx          # 결제 요약
    │   └── payment-status.tsx           # 결제 상태 표시
    └── admin/
        ├── payment-table.tsx             # 결제 목록 테이블
        ├── payment-detail.tsx            # 결제 상세 정보
        └── refund-modal.tsx              # 환불 처리 모달
```

### 2. 환경 변수 설정
```bash
# .env.local
# NicePay Configuration (Production)
NICEPAY_CLIENT_ID=R2_af0d116236df437f831483ee9c500bc4  # 실제 발급받은 클라이언트 ID
NICEPAY_SECRET_KEY=your-secret-key-here                # 실제 발급받은 시크릿 키
NICEPAY_API_URL=https://api.nicepay.co.kr

# NicePay Configuration (Test/Sandbox)
NICEPAY_TEST_CLIENT_ID=S2_af0d116236df437f831483ee9c500bc4
NICEPAY_TEST_SECRET_KEY=test-secret-key
NICEPAY_TEST_API_URL=https://sandbox-api.nicepay.co.kr

# Payment Configuration
PAYMENT_SUCCESS_URL=/payment/success
PAYMENT_FAIL_URL=/payment/fail
PAYMENT_WEBHOOK_SECRET=your-webhook-secret-here

# Environment
NEXT_PUBLIC_IS_PRODUCTION=false  # true for production
```

### 3. 타입 정의 (lib/payments/types.ts)
```typescript
// 결제 요청 타입
export interface PaymentRequest {
  inquiryId: string
  userId: string
  photographerId: string
  amount: number
  buyerName: string
  buyerEmail: string
  buyerTel: string
  paymentMethod: PaymentMethod
  productName: string
}

// 결제 수단
export type PaymentMethod = 
  | 'card'           // 신용카드
  | 'bank'           // 계좌이체
  | 'vbank'          // 가상계좌
  | 'naverpayCard'   // 네이버페이
  | 'kakaopay'       // 카카오페이
  | 'samsungpayCard' // 삼성페이
  | 'payco'          // 페이코
  | 'ssgpay'         // SSGPAY

// 결제 상태
export type PaymentStatus = 
  | 'pending'    // 대기중
  | 'paid'       // 결제완료
  | 'failed'     // 결제실패
  | 'cancelled'  // 취소됨
  | 'refunded'   // 환불됨
  | 'partial_refunded' // 부분환불

// NicePay 인증 결과
export interface NicePayAuthResult {
  authResultCode: string    // '0000'이면 성공
  authResultMsg: string
  tid: string               // 거래 ID
  clientId: string
  orderId: string
  amount: string
  mallReserved: string      // 추가 데이터
  authToken: string
  signature: string         // 위변조 검증용
}

// NicePay 승인 응답
export interface NicePayApprovalResponse {
  resultCode: string        // '0000'이면 성공
  resultMsg: string
  tid: string
  orderId: string
  amount: number
  payMethod: string
  paidAt: string
  status: string
  card?: {
    cardCode: string
    cardName: string
    cardNum: string
    cardQuota: string
    isInterestFree: boolean
    cardType: string
    canPartCancel: string
    acquCardCode: string
    acquCardName: string
  }
  vbank?: {
    vbankCode: string
    vbankName: string
    vbankNumber: string
    vbankExpDate: string
    vbankHolder: string
  }
  cashReceipts?: Array<{
    receiptTid: string
    orgTid: string
    status: string
    amount: number
    taxFreeAmt: number
    receiptType: string
    issueNo: string
    receiptUrl: string
  }>
  receiptUrl: string
  mallUserId: string
}

// 환불 요청
export interface RefundRequest {
  paymentId: string
  reason: string
  amount?: number          // 미입력시 전액 환불
  refundAccount?: string   // 가상계좌 환불시 필요
  refundBankCode?: string
  refundHolder?: string
}
```

### 4. NicePay 유틸리티 함수 (lib/payments/nicepay.ts)
```typescript
import { createClient } from '@/lib/supabase/server'

const CLIENT_ID = process.env.NICEPAY_CLIENT_ID!
const SECRET_KEY = process.env.NICEPAY_SECRET_KEY!
const API_URL = process.env.NICEPAY_API_URL!

// 주문번호 생성
export function generateOrderId(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = date.getTime().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `IRIS_${dateStr}_${timeStr}_${random}`
}

// Basic Auth 헤더 생성
function getAuthHeader(): string {
  const credentials = `${CLIENT_ID}:${SECRET_KEY}`
  return `Basic ${Buffer.from(credentials).toString('base64')}`
}

// 서명 검증
export function verifySignature(
  authToken: string,
  amount: string,
  signature: string
): boolean {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHash('sha256')
    .update(`${authToken}${CLIENT_ID}${amount}${SECRET_KEY}`)
    .digest('hex')
  
  return signature === expectedSignature
}

// 결제 승인 요청
export async function approvePayment(
  tid: string,
  amount: number
): Promise<{
  success: boolean
  data?: NicePayApprovalResponse
  error?: string
}> {
  try {
    const response = await fetch(`${API_URL}/v1/payments/${tid}`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    })

    const data = await response.json()

    if (data.resultCode === '0000') {
      return { success: true, data }
    } else {
      return { 
        success: false, 
        error: `${data.resultCode}: ${data.resultMsg}` 
      }
    }
  } catch (error) {
    console.error('Payment approval error:', error)
    return { 
      success: false, 
      error: '결제 승인 중 오류가 발생했습니다.' 
    }
  }
}

// 결제 취소
export async function cancelPayment(
  tid: string,
  reason: string,
  orderId: string,
  cancelAmount?: number
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const body: any = { reason, orderId }
    if (cancelAmount) {
      body.cancelAmt = cancelAmount
    }

    const response = await fetch(`${API_URL}/v1/payments/${tid}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (data.resultCode === '0000') {
      return { success: true, data }
    } else {
      return { 
        success: false, 
        error: `${data.resultCode}: ${data.resultMsg}` 
      }
    }
  } catch (error) {
    console.error('Payment cancel error:', error)
    return { 
      success: false, 
      error: '결제 취소 중 오류가 발생했습니다.' 
    }
  }
}

// 거래 상태 조회
export async function getTransactionStatus(
  tid: string
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const response = await fetch(`${API_URL}/v1/payments/${tid}`, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader()
      }
    })

    const data = await response.json()

    if (data.resultCode === '0000') {
      return { success: true, data }
    } else {
      return { 
        success: false, 
        error: `${data.resultCode}: ${data.resultMsg}` 
      }
    }
  } catch (error) {
    console.error('Transaction status error:', error)
    return { 
      success: false, 
      error: '거래 조회 중 오류가 발생했습니다.' 
    }
  }
}
```

### 5. Server Actions (lib/actions/payments.ts)
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { generateOrderId, approvePayment } from '@/lib/payments/nicepay'
import { PaymentRequest, PaymentStatus } from '@/lib/payments/types'

// 결제 생성
export async function createPayment(request: PaymentRequest) {
  const supabase = await createClient()
  
  try {
    const orderId = generateOrderId()
    
    // 결제 정보 저장
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        inquiry_id: request.inquiryId,
        user_id: request.userId,
        photographer_id: request.photographerId,
        order_id: orderId,
        amount: request.amount,
        status: 'pending',
        payment_method: request.paymentMethod,
        buyer_name: request.buyerName,
        buyer_email: request.buyerEmail,
        buyer_tel: request.buyerTel
      })
      .select()
      .single()

    if (error) throw error

    return { 
      success: true, 
      orderId,
      paymentId: payment.id 
    }
  } catch (error) {
    console.error('Create payment error:', error)
    return { 
      success: false, 
      error: '결제 생성 중 오류가 발생했습니다.' 
    }
  }
}

// 결제 상태 업데이트
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  additionalData?: any
) {
  const supabase = await createClient()
  
  try {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString()
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
    } else if (status === 'failed') {
      updateData.failed_at = new Date().toISOString()
    }

    if (additionalData) {
      Object.assign(updateData, additionalData)
    }

    const { error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)

    if (error) throw error

    // inquiry 테이블도 업데이트
    if (status === 'paid') {
      await supabase
        .from('inquiries')
        .update({ 
          payment_status: 'paid',
          status: 'confirmed' 
        })
        .eq('payment_id', paymentId)
    }

    return { success: true }
  } catch (error) {
    console.error('Update payment status error:', error)
    return { 
      success: false, 
      error: '결제 상태 업데이트 중 오류가 발생했습니다.' 
    }
  }
}

// 결제 내역 조회
export async function getPayments(filters?: {
  userId?: string
  photographerId?: string
  status?: PaymentStatus
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('payments')
    .select(`
      *,
      inquiry:inquiries(
        customer_name,
        customer_email,
        customer_phone
      ),
      photographer:photographers(
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId)
  }
  if (filters?.photographerId) {
    query = query.eq('photographer_id', filters.photographerId)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Get payments error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// 결제 통계
export async function getPaymentStatistics(photographerId?: string) {
  const supabase = await createClient()
  
  let query = supabase.from('payments').select('amount, status, created_at')
  
  if (photographerId) {
    query = query.eq('photographer_id', photographerId)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  // 통계 계산
  const stats = {
    totalRevenue: 0,
    totalPayments: 0,
    pendingPayments: 0,
    completedPayments: 0,
    cancelledPayments: 0,
    monthlyRevenue: {} as Record<string, number>
  }

  data?.forEach(payment => {
    if (payment.status === 'paid') {
      stats.totalRevenue += payment.amount
      stats.completedPayments++
      
      // 월별 통계
      const month = new Date(payment.created_at).toISOString().slice(0, 7)
      stats.monthlyRevenue[month] = (stats.monthlyRevenue[month] || 0) + payment.amount
    } else if (payment.status === 'pending') {
      stats.pendingPayments++
    } else if (payment.status === 'cancelled' || payment.status === 'refunded') {
      stats.cancelledPayments++
    }
    stats.totalPayments++
  })

  return { success: true, data: stats }
}
```

### 6. API 엔드포인트 구현

#### 결제 승인 처리 (app/api/nicepay/process/route.ts)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { approvePayment, verifySignature } from '@/lib/payments/nicepay'
import { NicePayAuthResult } from '@/lib/payments/types'
import { updatePaymentStatus } from '@/lib/actions/payments'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    // 1. NicePay로부터 인증 결과 수신
    const formData = await request.formData()
    const authResult: NicePayAuthResult = {
      authResultCode: formData.get('authResultCode') as string,
      authResultMsg: formData.get('authResultMsg') as string,
      tid: formData.get('tid') as string,
      clientId: formData.get('clientId') as string,
      orderId: formData.get('orderId') as string,
      amount: formData.get('amount') as string,
      mallReserved: formData.get('mallReserved') as string,
      authToken: formData.get('authToken') as string,
      signature: formData.get('signature') as string
    }

    // 2. 인증 실패시 처리
    if (authResult.authResultCode !== '0000') {
      console.error('Auth failed:', authResult)
      
      // 실패 로그 저장
      await supabase.from('payment_logs').insert({
        event_type: 'auth_failed',
        event_data: authResult
      })

      return NextResponse.redirect(
        new URL(`/payment/fail?code=${authResult.authResultCode}&msg=${authResult.authResultMsg}`, request.url)
      )
    }

    // 3. 서명 검증
    const isValidSignature = verifySignature(
      authResult.authToken,
      authResult.amount,
      authResult.signature
    )

    if (!isValidSignature) {
      console.error('Invalid signature')
      return NextResponse.redirect(
        new URL('/payment/fail?code=INVALID_SIGNATURE', request.url)
      )
    }

    // 4. mallReserved 파싱 (추가 데이터)
    const reservedData = JSON.parse(authResult.mallReserved || '{}')
    const paymentId = reservedData.paymentId

    // 5. 결제 승인 요청
    const approvalResult = await approvePayment(
      authResult.tid,
      parseInt(authResult.amount)
    )

    if (!approvalResult.success || !approvalResult.data) {
      // 승인 실패 처리
      await updatePaymentStatus(paymentId, 'failed', {
        error_message: approvalResult.error,
        nicepay_response: approvalResult.data
      })

      return NextResponse.redirect(
        new URL(`/payment/fail?code=APPROVAL_FAILED&msg=${approvalResult.error}`, request.url)
      )
    }

    // 6. 결제 성공 - DB 업데이트
    const paymentData = approvalResult.data
    await updatePaymentStatus(paymentId, 'paid', {
      tid: paymentData.tid,
      receipt_url: paymentData.receiptUrl,
      card_info: paymentData.card,
      bank_info: paymentData.bank,
      nicepay_response: paymentData
    })

    // 7. 가상계좌인 경우 입금 대기 정보 저장
    if (paymentData.payMethod === 'vbank' && paymentData.vbank) {
      await supabase.from('vbank_deposits').insert({
        payment_id: paymentId,
        vbank_code: paymentData.vbank.vbankCode,
        vbank_name: paymentData.vbank.vbankName,
        vbank_number: paymentData.vbank.vbankNumber,
        vbank_holder: paymentData.vbank.vbankHolder,
        vbank_exp_date: paymentData.vbank.vbankExpDate,
        deposit_status: 'waiting'
      })
    }

    // 8. 성공 페이지로 리다이렉트
    return NextResponse.redirect(
      new URL(`/payment/success?orderId=${authResult.orderId}&tid=${authResult.tid}`, request.url)
    )

  } catch (error) {
    console.error('Payment process error:', error)
    return NextResponse.redirect(
      new URL('/payment/fail?code=SYSTEM_ERROR', request.url)
    )
  }
}
```

#### 웹훅 처리 (app/api/nicepay/webhook/route.ts)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updatePaymentStatus } from '@/lib/actions/payments'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    // 웹훅 검증 (NicePay에서 제공하는 방식에 따라 구현)
    const webhookData = await request.json()
    
    // 웹훅 시크릿 검증
    const webhookSecret = request.headers.get('X-NicePay-Webhook-Secret')
    if (webhookSecret !== process.env.PAYMENT_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
    }

    // 이벤트 처리
    const { eventType, data } = webhookData

    switch (eventType) {
      case 'payment.paid':
        // 결제 완료
        await handlePaymentPaid(data)
        break
      
      case 'payment.cancelled':
        // 결제 취소
        await handlePaymentCancelled(data)
        break
      
      case 'vbank.deposited':
        // 가상계좌 입금
        await handleVbankDeposited(data)
        break
      
      default:
        console.log('Unknown webhook event:', eventType)
    }

    // 웹훅 로그 저장
    await supabase.from('payment_logs').insert({
      event_type: `webhook_${eventType}`,
      event_data: webhookData
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePaymentPaid(data: any) {
  const supabase = await createClient()
  
  // orderId로 결제 찾기
  const { data: payment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('order_id', data.orderId)
    .single()

  if (payment && payment.status !== 'paid') {
    await updatePaymentStatus(payment.id, 'paid', {
      tid: data.tid,
      paid_at: data.paidAt
    })
  }
}

async function handlePaymentCancelled(data: any) {
  const supabase = await createClient()
  
  const { data: payment } = await supabase
    .from('payments')
    .select('id')
    .eq('tid', data.tid)
    .single()

  if (payment) {
    await updatePaymentStatus(payment.id, 'cancelled', {
      cancelled_at: data.cancelledAt,
      cancel_reason: data.reason
    })
  }
}

async function handleVbankDeposited(data: any) {
  const supabase = await createClient()
  
  // 가상계좌 입금 처리
  const { data: vbank } = await supabase
    .from('vbank_deposits')
    .select('payment_id')
    .eq('vbank_number', data.vbankNumber)
    .eq('deposit_status', 'waiting')
    .single()

  if (vbank) {
    // 입금 상태 업데이트
    await supabase
      .from('vbank_deposits')
      .update({
        deposit_status: 'deposited',
        deposited_at: data.depositedAt
      })
      .eq('payment_id', vbank.payment_id)

    // 결제 상태 업데이트
    await updatePaymentStatus(vbank.payment_id, 'paid', {
      paid_at: data.depositedAt
    })
  }
}
```

### 7. 결제 UI 컴포넌트

#### 결제 페이지 (app/photographers/[id]/booking/payment/page.tsx)
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { createPayment } from '@/lib/actions/payments'
import { PaymentMethodSelector } from '@/components/payment/payment-method-selector'
import { PaymentSummary } from '@/components/payment/payment-summary'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'
  ? 'R2_af0d116236df437f831483ee9c500bc4'  // Production
  : 'S2_af0d116236df437f831483ee9c500bc4'  // Sandbox

interface BookingPaymentPageProps {
  params: { id: string }
  searchParams: { inquiryId: string }
}

export default function BookingPaymentPage({ 
  params, 
  searchParams 
}: BookingPaymentPageProps) {
  const router = useRouter()
  const [sdkReady, setSdkReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('card')
  const [inquiry, setInquiry] = useState<any>(null)

  useEffect(() => {
    // 문의 정보 로드
    loadInquiryData(searchParams.inquiryId)
  }, [searchParams.inquiryId])

  const loadInquiryData = async (inquiryId: string) => {
    // 문의 정보 조회 로직
    // ...
  }

  const handlePayment = async () => {
    if (!sdkReady || !window.AUTHNICE) {
      toast({
        title: '결제 시스템을 로드중입니다',
        description: '잠시 후 다시 시도해주세요',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      // 1. 결제 정보 생성
      const paymentResult = await createPayment({
        inquiryId: searchParams.inquiryId,
        userId: inquiry.user_id,
        photographerId: params.id,
        amount: inquiry.payment_amount,
        buyerName: inquiry.customer_name,
        buyerEmail: inquiry.customer_email,
        buyerTel: inquiry.customer_phone,
        paymentMethod,
        productName: `${inquiry.photographer_name} 작가 촬영`
      })

      if (!paymentResult.success) {
        throw new Error(paymentResult.error)
      }

      // 2. NicePay 결제창 호출
      window.AUTHNICE.requestPay({
        clientId: NICEPAY_CLIENT_ID,
        method: paymentMethod,
        orderId: paymentResult.orderId,
        amount: inquiry.payment_amount,
        goodsName: `${inquiry.photographer_name} 작가 촬영`,
        buyerName: inquiry.customer_name,
        buyerEmail: inquiry.customer_email,
        buyerTel: inquiry.customer_phone,
        returnUrl: `${window.location.origin}/api/nicepay/process`,
        mallReserved: JSON.stringify({
          paymentId: paymentResult.paymentId,
          inquiryId: searchParams.inquiryId
        })
      })

    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: '결제 시작 실패',
        description: '다시 시도해주세요',
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">결제하기</h1>
      
      {/* 결제 정보 요약 */}
      <PaymentSummary inquiry={inquiry} />
      
      {/* 결제 수단 선택 */}
      <PaymentMethodSelector
        value={paymentMethod}
        onChange={setPaymentMethod}
      />
      
      {/* 결제 버튼 */}
      <div className="mt-8">
        <Button
          onClick={handlePayment}
          disabled={loading || !sdkReady}
          className="w-full"
          size="lg"
        >
          {loading ? '처리중...' : `${inquiry?.payment_amount?.toLocaleString()}원 결제하기`}
        </Button>
      </div>

      {/* NicePay JS SDK 로드 */}
      <Script
        src="https://pay.nicepay.co.kr/v1/js/"
        onLoad={() => setSdkReady(true)}
        onError={() => {
          console.error('NicePay SDK load failed')
          toast({
            title: '결제 시스템 로드 실패',
            description: '페이지를 새로고침해주세요',
            variant: 'destructive'
          })
        }}
      />
    </div>
  )
}
```

### 8. 관리자 결제 관리

#### 결제 관리 대시보드 (app/admin/payments/page.tsx)
```typescript
'use client'

import { useState, useEffect } from 'react'
import { getPayments, getPaymentStatistics } from '@/lib/actions/payments'
import { PaymentTable } from '@/components/admin/payment-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { RefundModal } from '@/components/admin/refund-modal'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    
    // 결제 목록 조회
    const paymentsResult = await getPayments(
      filters.status === 'all' ? undefined : { status: filters.status }
    )
    if (paymentsResult.success) {
      setPayments(paymentsResult.data || [])
    }

    // 통계 조회
    const statsResult = await getPaymentStatistics()
    if (statsResult.success) {
      setStatistics(statsResult.data)
    }

    setLoading(false)
  }

  const handleRefund = (payment: any) => {
    setSelectedPayment(payment)
    setRefundModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">결제 관리</h1>
        <DateRangePicker
          onDateChange={(range) => {
            setFilters({
              ...filters,
              startDate: range.from,
              endDate: range.to
            })
          }}
        />
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₩{statistics?.totalRevenue?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 결제 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.totalPayments || 0}건
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료된 결제</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.completedPayments || 0}건
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">취소/환불</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.cancelledPayments || 0}건
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 결제 목록 */}
      <Tabs value={filters.status} onValueChange={(value) => 
        setFilters({ ...filters, status: value })
      }>
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="pending">대기중</TabsTrigger>
          <TabsTrigger value="paid">완료</TabsTrigger>
          <TabsTrigger value="cancelled">취소</TabsTrigger>
          <TabsTrigger value="refunded">환불</TabsTrigger>
        </TabsList>
        
        <TabsContent value={filters.status} className="mt-4">
          <PaymentTable
            payments={payments}
            loading={loading}
            onRefund={handleRefund}
          />
        </TabsContent>
      </Tabs>

      {/* 환불 모달 */}
      <RefundModal
        payment={selectedPayment}
        open={refundModalOpen}
        onClose={() => {
          setRefundModalOpen(false)
          setSelectedPayment(null)
        }}
        onSuccess={() => {
          loadData()
          setRefundModalOpen(false)
        }}
      />
    </div>
  )
}
```

---

## 🧪 테스트 및 검증

### 1. 테스트 시나리오
```typescript
// 테스트 카드 정보 (나이스페이 제공)
const TEST_CARDS = {
  normal: {
    number: '9410-0400-0000-0001',
    expiry: '01/30',
    cvc: '123',
    password: '00'
  },
  insufficient: {
    number: '9410-0400-0000-0002',
    expiry: '01/30',
    cvc: '123',
    password: '00'
  }
}

// 테스트 시나리오
const TEST_SCENARIOS = [
  '1. 정상 카드 결제',
  '2. 잔액 부족 결제 실패',
  '3. 결제 후 전액 취소',
  '4. 결제 후 부분 취소',
  '5. 가상계좌 발급 및 입금',
  '6. 네이버페이/카카오페이 결제',
  '7. 중복 결제 방지',
  '8. 타임아웃 처리',
  '9. 웹훅 재시도',
  '10. 동시 결제 처리'
]
```

### 2. 보안 체크리스트
- [ ] API 키 환경변수 분리
- [ ] 서명 검증 구현
- [ ] HTTPS 통신 확인
- [ ] SQL Injection 방어
- [ ] XSS 방어
- [ ] CSRF 토큰 검증
- [ ] Rate Limiting
- [ ] 로그 민감정보 제거
- [ ] 결제 금액 검증
- [ ] 중복 결제 방지

### 3. 모니터링
```typescript
// 결제 모니터링 대시보드
interface PaymentMetrics {
  successRate: number      // 결제 성공률
  averageAmount: number    // 평균 결제 금액
  peakHours: string[]      // 피크 시간대
  failureReasons: {        // 실패 사유별 통계
    [key: string]: number
  }
  paymentMethods: {        // 결제수단별 통계
    [key: string]: number
  }
}

// 알림 설정
interface AlertRules {
  largeAmount: number      // 고액 결제 알림 (ex: 100만원 이상)
  failureRate: number      // 실패율 임계치 (ex: 10% 이상)
  duplicateAttempt: boolean // 중복 시도 감지
}
```

---

## 📅 구현 일정

### Phase 1: 기초 설정 (2일)
- [x] 나이스페이 계정 설정 및 API 키 발급
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 환경 변수 설정
- [ ] 기본 타입 및 유틸리티 함수 구현

### Phase 2: 결제 프로세스 구현 (3일)
- [ ] 결제 생성 API 구현
- [ ] 결제 승인 처리 구현
- [ ] 결제 UI 컴포넌트 개발
- [ ] 성공/실패 페이지 구현

### Phase 3: 관리 기능 구현 (2일)
- [ ] 결제 취소/환불 API 구현
- [ ] 관리자 대시보드 구현
- [ ] 작가 결제 내역 페이지 구현
- [ ] 결제 상세 조회 기능

### Phase 4: 고급 기능 구현 (2일)
- [ ] 웹훅 처리 구현
- [ ] 가상계좌 입금 처리
- [ ] 결제 통계 및 분석
- [ ] 정산 시스템 기초

### Phase 5: 테스트 및 배포 (2일)
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 실행
- [ ] 보안 점검
- [ ] 프로덕션 배포

---

## 🚀 배포 체크리스트

### 배포 전
- [ ] 모든 테스트 통과
- [ ] 프로덕션 API 키 설정
- [ ] SSL 인증서 확인
- [ ] 웹훅 URL 등록
- [ ] 방화벽 설정
- [ ] 로그 수집 설정

### 배포 후
- [ ] 실제 소액 결제 테스트
- [ ] 웹훅 수신 확인
- [ ] 모니터링 대시보드 확인
- [ ] 알림 시스템 테스트
- [ ] 백업 정책 확인
- [ ] 고객 지원 준비

---

## 📞 지원 및 문의

### 나이스페이 기술 지원
- **개발자 포럼**: https://developers.nicepay.co.kr
- **기술 지원**: 1661-0808
- **이메일**: dev@nicepay.co.kr

### 내부 담당자
- **프로젝트 매니저**: [담당자명]
- **개발 담당**: [개발자명]
- **운영 담당**: [운영자명]

---

이 문서는 Iris 프로젝트의 나이스페이먼츠 결제 시스템 구현을 위한 종합 계획서입니다.
구현 과정에서 수정사항이 발생하면 이 문서를 업데이트해주세요.

최종 수정일: 2024년 8월 31일