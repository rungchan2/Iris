# PG 중립적 Server Actions 아키텍처 설계

## 📋 개요

기존 `/api/*` 라우트 대신 Next.js Server Actions를 사용하여 PG 중립적인 결제 시스템을 구축합니다.
이 설계는 기존 `lib/actions/payments.ts` 구조를 확장하여 다중 PG를 지원합니다.

## 🏗️ 디렉토리 구조

```
lib/actions/
├── payments.ts                    # 기존 통합 인터페이스 (하위 호환성)
├── payments/
│   ├── index.ts                   # PG 중립적 메인 인터페이스
│   ├── factory.ts                 # PaymentAdapter 팩토리
│   ├── providers/
│   │   ├── nicepay.ts            # 나이스페이 Server Actions
│   │   ├── eximbay.ts            # Eximbay Server Actions
│   │   ├── adyen.ts              # Adyen Server Actions
│   │   └── toss.ts               # 토스페이먼츠 Server Actions
│   ├── webhooks/
│   │   ├── index.ts              # 웹훅 라우팅
│   │   ├── nicepay.ts            # 나이스페이 웹훅 처리
│   │   ├── eximbay.ts            # Eximbay 웹훅 처리
│   │   └── adyen.ts              # Adyen 웹훅 처리
│   └── utils/
│       ├── validation.ts         # 공통 검증 로직
│       ├── logging.ts            # 결제 로그 관리
│       └── mapping.ts            # PG별 데이터 매핑
```

## 🔧 핵심 컴포넌트 설계

### 1. 메인 인터페이스 (`lib/actions/payments/index.ts`)

```typescript
'use server'

import { PaymentProvider } from '@/lib/payments/types'
import { getPaymentAdapter } from './factory'

/**
 * PG 중립적 결제 생성
 */
export async function createPaymentForProvider(
  provider: PaymentProvider,
  request: PaymentCreateRequest
): Promise<PaymentCreateResponse> {
  const adapter = await getPaymentAdapter(provider)
  return adapter.createPayment(request)
}

/**
 * PG 중립적 결제 승인
 */
export async function approvePaymentForProvider(
  provider: PaymentProvider,
  request: PaymentApprovalRequest
): Promise<PaymentApprovalResult> {
  const adapter = await getPaymentAdapter(provider)
  return adapter.approvePayment(request)
}

/**
 * PG 중립적 결제 취소
 */
export async function cancelPaymentForProvider(
  provider: PaymentProvider,
  request: PaymentCancelRequest
): Promise<PaymentCancelResult> {
  const adapter = await getPaymentAdapter(provider)
  return adapter.cancelPayment(request)
}

/**
 * 자동 PG 선택 결제 생성 (현재는 NicePay 기본)
 */
export async function createPayment(
  request: PaymentCreateRequest
): Promise<PaymentCreateResponse> {
  const provider = determineProvider(request)
  return createPaymentForProvider(provider, request)
}

/**
 * PG 선택 로직 (비즈니스 규칙에 따라)
 */
function determineProvider(request: PaymentCreateRequest): PaymentProvider {
  // 국내/해외 결제 구분
  if (request.currency && request.currency !== 'KRW') {
    return 'eximbay' // 해외 결제
  }
  
  // 금액에 따른 PG 선택
  if (request.amount >= 1000000) {
    return 'nicepay' // 고액 결제
  }
  
  return 'nicepay' // 기본 PG
}
```

### 2. PaymentAdapter 팩토리 (`lib/actions/payments/factory.ts`)

```typescript
'use server'

import { PaymentProvider, PaymentAdapter } from '@/lib/payments/types'
import { NicePayServerAdapter } from './providers/nicepay'
import { EximbayServerAdapter } from './providers/eximbay'
import { AdyenServerAdapter } from './providers/adyen'
import { TossServerAdapter } from './providers/toss'

/**
 * PG별 어댑터 캐시 (성능 최적화)
 */
const adapterCache = new Map<PaymentProvider, PaymentAdapter>()

/**
 * PaymentAdapter 팩토리 함수
 */
export async function getPaymentAdapter(provider: PaymentProvider): Promise<PaymentAdapter> {
  // 캐시된 어댑터 반환
  if (adapterCache.has(provider)) {
    return adapterCache.get(provider)!
  }

  let adapter: PaymentAdapter

  switch (provider) {
    case 'nicepay':
      adapter = new NicePayServerAdapter()
      break
    case 'eximbay':
      adapter = new EximbayServerAdapter()
      break
    case 'adyen':
      adapter = new AdyenServerAdapter()
      break
    case 'toss':
      adapter = new TossServerAdapter()
      break
    default:
      throw new Error(`Unsupported payment provider: ${provider}`)
  }

  // 어댑터 초기화 및 캐시
  await adapter.initialize?.()
  adapterCache.set(provider, adapter)
  
  return adapter
}

/**
 * 모든 지원 PG 목록 반환
 */
export function getSupportedProviders(): PaymentProvider[] {
  return ['nicepay', 'eximbay', 'adyen', 'toss']
}

/**
 * PG 가용성 검사
 */
export async function isProviderAvailable(provider: PaymentProvider): Promise<boolean> {
  try {
    const adapter = await getPaymentAdapter(provider)
    return await adapter.healthCheck?.() ?? true
  } catch {
    return false
  }
}
```

### 3. NicePay Server Actions (`lib/actions/payments/providers/nicepay.ts`)

```typescript
'use server'

import { BasePaymentAdapter, PaymentInitializeRequest, PaymentApprovalResult } from '@/lib/payments/types'
import { createClient } from '@/lib/supabase/server'
import { approvePayment, cancelPayment, getTransactionStatus } from '@/lib/payments/nicepay'
import { logPaymentEvent, validatePaymentRequest } from '../utils'

/**
 * 나이스페이 Server Actions 구현
 */
export class NicePayServerAdapter implements BasePaymentAdapter {
  readonly provider = 'nicepay' as const
  
  async initializePayment(request: PaymentInitializeRequest): Promise<PaymentInitializeResult> {
    const supabase = await createClient()
    
    try {
      // 요청 검증
      const validation = await validatePaymentRequest(request)
      if (!validation.isValid) {
        return {
          success: false,
          orderId: request.orderId,
          provider: this.provider,
          error: validation.errors[0]
        }
      }

      // 결제 정보 DB 저장
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          order_id: request.orderId,
          amount: request.amount,
          currency: request.currency,
          provider: this.provider,
          payment_method: request.paymentMethod,
          buyer_name: request.buyerInfo.name,
          buyer_email: request.buyerInfo.email,
          buyer_tel: request.buyerInfo.phone,
          status: 'pending'
        })
        .select('id')
        .single()

      if (error) throw error

      // 나이스페이 결제창 정보 생성
      const paymentData = {
        clientId: process.env.NICEPAY_CLIENT_ID!,
        method: this.mapStandardToProviderMethod(request.paymentMethod),
        orderId: request.orderId,
        amount: request.amount,
        goodsName: request.productInfo.name,
        returnUrl: request.callbackUrls.return,
        buyerName: request.buyerInfo.name,
        buyerEmail: request.buyerInfo.email,
        buyerTel: request.buyerInfo.phone
      }

      await logPaymentEvent(payment.id, 'payment_initialized', paymentData, this.provider)

      return {
        success: true,
        orderId: request.orderId,
        provider: this.provider,
        paymentData
      }
    } catch (error) {
      return {
        success: false,
        orderId: request.orderId,
        provider: this.provider,
        error: error instanceof Error ? error.message : '결제 초기화 실패'
      }
    }
  }

  async approvePayment(request: PaymentApprovalRequest): Promise<PaymentApprovalResult> {
    const supabase = await createClient()
    
    try {
      // 나이스페이 승인 요청
      const approvalResult = await approvePayment(
        request.providerTransactionId,
        request.amount,
        request.authData
      )

      if (!approvalResult.success) {
        return {
          success: false,
          orderId: request.orderId,
          provider: this.provider,
          providerTransactionId: request.providerTransactionId,
          status: 'failed',
          amount: request.amount,
          rawResponse: approvalResult,
          error: approvalResult.error
        }
      }

      const nicePayResponse = approvalResult.data!

      // DB 업데이트
      await supabase
        .from('payments')
        .update({
          provider_transaction_id: request.providerTransactionId,
          status: 'paid',
          paid_at: new Date().toISOString(),
          raw_response: nicePayResponse
        })
        .eq('order_id', request.orderId)

      return {
        success: true,
        orderId: request.orderId,
        provider: this.provider,
        providerTransactionId: request.providerTransactionId,
        status: 'paid',
        amount: request.amount,
        paidAt: new Date().toISOString(),
        paymentInfo: {
          method: this.mapProviderToStandardMethod(nicePayResponse.payMethod),
          cardInfo: nicePayResponse.card,
          bankInfo: nicePayResponse.bank
        },
        receiptUrl: nicePayResponse.receiptUrl,
        rawResponse: nicePayResponse
      }
    } catch (error) {
      return {
        success: false,
        orderId: request.orderId,
        provider: this.provider,
        providerTransactionId: request.providerTransactionId,
        status: 'failed',
        amount: request.amount,
        rawResponse: {},
        error: error instanceof Error ? error.message : '결제 승인 실패'
      }
    }
  }

  async cancelPayment(request: PaymentCancelRequest): Promise<PaymentCancelResult> {
    // 나이스페이 취소 로직 구현
    // ...
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentStatusResult> {
    // 나이스페이 상태 조회 로직 구현
    // ...
  }

  async verifyAndParseWebhook(rawData: any, signature?: string): Promise<WebhookParseResult> {
    // 나이스페이 웹훅 검증 및 파싱 로직 구현
    // ...
  }

  // PG별 매핑 메서드들
  mapStandardToProviderMethod(method: StandardPaymentMethod): string {
    const mapping: Record<StandardPaymentMethod, string> = {
      'card': 'card',
      'bank_transfer': 'bank',
      'cellphone': 'cellphone',
      'wallet:kakaopay': 'kakaopay',
      'wallet:naverpay': 'naverpayCard',
      'wallet:samsungpay': 'samsungpayCard',
      // ...
    }
    return mapping[method] || 'card'
  }

  mapProviderToStandardMethod(providerMethod: string): StandardPaymentMethod {
    const mapping: Record<string, StandardPaymentMethod> = {
      'card': 'card',
      'bank': 'bank_transfer',
      'cellphone': 'cellphone',
      'kakaopay': 'wallet:kakaopay',
      'naverpayCard': 'wallet:naverpay',
      // ...
    }
    return mapping[providerMethod] || 'card'
  }

  mapProviderToStandardStatus(providerStatus: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      'paid': 'paid',
      'cancelled': 'cancelled',
      'failed': 'failed',
      // ...
    }
    return mapping[providerStatus] || 'pending'
  }
}
```

### 4. 웹훅 처리 (`lib/actions/payments/webhooks/index.ts`)

```typescript
'use server'

import { PaymentProvider } from '@/lib/payments/types'
import { getPaymentAdapter } from '../factory'
import { logPaymentEvent } from '../utils/logging'

/**
 * PG별 웹훅 라우팅
 */
export async function handleWebhook(
  provider: PaymentProvider,
  rawData: any,
  signature?: string,
  headers?: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  try {
    const adapter = await getPaymentAdapter(provider)
    
    // 웹훅 검증 및 파싱
    const webhookResult = await adapter.verifyAndParseWebhook(rawData, signature)
    
    if (!webhookResult.success) {
      await logPaymentEvent(
        null,
        'webhook_verification_failed',
        { provider, error: webhookResult.error, rawData },
        provider
      )
      return { success: false, message: webhookResult.error || 'Webhook verification failed' }
    }

    // 결제 상태 업데이트
    await updatePaymentFromWebhook(webhookResult)
    
    await logPaymentEvent(
      null,
      'webhook_processed',
      webhookResult,
      provider
    )

    return { success: true, message: 'Webhook processed successfully' }
  } catch (error) {
    console.error(`Webhook processing error for ${provider}:`, error)
    return { success: false, message: 'Internal server error' }
  }
}

/**
 * 웹훅 데이터로 결제 상태 업데이트
 */
async function updatePaymentFromWebhook(webhookResult: WebhookParseResult): Promise<void> {
  const supabase = await createClient()
  
  const updateData: any = {
    status: webhookResult.status,
    raw_response: webhookResult.rawData,
    updated_at: new Date().toISOString()
  }

  if (webhookResult.status === 'paid') {
    updateData.paid_at = webhookResult.timestamp
  } else if (webhookResult.status === 'cancelled') {
    updateData.cancelled_at = webhookResult.timestamp
  } else if (webhookResult.status === 'failed') {
    updateData.failed_at = webhookResult.timestamp
  }

  await supabase
    .from('payments')
    .update(updateData)
    .eq('order_id', webhookResult.orderId)
}
```

### 5. 공통 유틸리티 (`lib/actions/payments/utils/validation.ts`)

```typescript
'use server'

import { PaymentInitializeRequest, StandardPaymentMethod, PaymentProvider } from '@/lib/payments/types'

/**
 * 결제 요청 검증
 */
export async function validatePaymentRequest(
  request: PaymentInitializeRequest
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = []

  // 필수 필드 검증
  if (!request.orderId) errors.push('주문번호가 필요합니다')
  if (!request.amount || request.amount <= 0) errors.push('올바른 결제 금액을 입력해주세요')
  if (!request.currency) errors.push('통화를 지정해주세요')
  if (!request.buyerInfo.name) errors.push('구매자 이름이 필요합니다')
  if (!request.buyerInfo.email) errors.push('구매자 이메일이 필요합니다')
  if (!request.productInfo.name) errors.push('상품명이 필요합니다')

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (request.buyerInfo.email && !emailRegex.test(request.buyerInfo.email)) {
    errors.push('올바른 이메일 형식이 아닙니다')
  }

  // 전화번호 형식 검증 (선택사항)
  if (request.buyerInfo.phone) {
    const phoneRegex = /^01[0-9]{8,9}$/
    if (!phoneRegex.test(request.buyerInfo.phone.replace(/-/g, ''))) {
      errors.push('올바른 전화번호 형식이 아닙니다')
    }
  }

  // PG별 특별 검증
  await validateByProvider(request, errors)

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * PG별 특별 검증 로직
 */
async function validateByProvider(
  request: PaymentInitializeRequest,
  errors: string[]
): Promise<void> {
  switch (request.provider) {
    case 'nicepay':
      if (request.currency !== 'KRW') {
        errors.push('나이스페이는 원화(KRW)만 지원합니다')
      }
      if (request.amount > 10000000) {
        errors.push('나이스페이는 1,000만원 이하 결제만 가능합니다')
      }
      break
      
    case 'eximbay':
      if (request.currency === 'KRW') {
        errors.push('Eximbay는 해외 통화만 지원합니다')
      }
      break
      
    case 'adyen':
      // Adyen 특별 검증 로직
      break
      
    case 'toss':
      if (request.currency !== 'KRW') {
        errors.push('토스페이먼츠는 원화(KRW)만 지원합니다')
      }
      break
  }
}

/**
 * 결제수단별 검증
 */
export function validatePaymentMethod(
  method: StandardPaymentMethod,
  provider: PaymentProvider
): { isValid: boolean; error?: string } {
  const supportedMethods = getSupportedMethodsByProvider(provider)
  
  if (!supportedMethods.includes(method)) {
    return {
      isValid: false,
      error: `${provider}는 ${method} 결제수단을 지원하지 않습니다`
    }
  }

  return { isValid: true }
}

/**
 * PG별 지원 결제수단 조회
 */
function getSupportedMethodsByProvider(provider: PaymentProvider): StandardPaymentMethod[] {
  const methodMap: Record<PaymentProvider, StandardPaymentMethod[]> = {
    nicepay: ['card', 'bank_transfer', 'cellphone', 'wallet:kakaopay', 'wallet:naverpay'],
    eximbay: ['card', 'wallet:paypal', 'wallet:alipay', 'wallet:wechatpay'],
    adyen: ['card', 'wallet:googlepay', 'wallet:applepay', 'bnpl:klarna'],
    toss: ['card', 'bank_transfer', 'wallet:kakaopay', 'wallet:naverpay']
  }
  
  return methodMap[provider] || []
}
```

## 🔄 기존 코드와의 호환성

### 기존 `lib/actions/payments.ts` 수정

```typescript
'use server'

// 기존 함수들을 새로운 구조로 리디렉션하여 하위 호환성 유지
import { 
  createPayment as createPaymentNew,
  approvePaymentForProvider,
  cancelPaymentForProvider 
} from './payments'

/**
 * @deprecated Use createPaymentNew instead
 * 하위 호환성을 위해 유지되는 함수
 */
export async function createPayment(request: PaymentCreateRequest): Promise<PaymentCreateResponse> {
  return createPaymentNew(request)
}

// 기존 다른 함수들도 동일하게 처리...
```

## 📝 사용 예시

### 클라이언트에서의 사용

```typescript
// app/checkout/actions.ts
'use server'

import { createPaymentForProvider, approvePaymentForProvider } from '@/lib/actions/payments'

// 특정 PG 지정하여 결제 생성
export async function createNicePayPayment(formData: FormData) {
  const request: PaymentInitializeRequest = {
    orderId: generateOrderId(),
    amount: Number(formData.get('amount')),
    currency: 'KRW',
    provider: 'nicepay',
    paymentMethod: 'card',
    // ...
  }
  
  return createPaymentForProvider('nicepay', request)
}

// 해외 결제
export async function createEximbayPayment(formData: FormData) {
  const request: PaymentInitializeRequest = {
    orderId: generateOrderId(),
    amount: Number(formData.get('amount')),
    currency: 'USD',
    provider: 'eximbay',
    paymentMethod: 'card',
    // ...
  }
  
  return createPaymentForProvider('eximbay', request)
}
```

## 🔒 보안 및 성능 고려사항

### 1. 보안
- 모든 민감한 정보는 서버에서만 처리
- PG별 API 키는 환경변수로 관리
- 웹훅 서명 검증 필수
- 요청 검증 및 속도 제한

### 2. 성능
- PaymentAdapter 캐싱으로 초기화 비용 절약
- 데이터베이스 연결 풀링
- 비동기 로깅으로 메인 플로우 영향 최소화
- 실패한 요청에 대한 재시도 로직

### 3. 모니터링
- PG별 성공률 추적
- 응답 시간 모니터링
- 오류 발생 패턴 분석
- 웹훅 처리 상태 로깅

## 🚀 배포 및 마이그레이션 계획

### Phase 1: 기반 구조 구축
1. PaymentAdapter 인터페이스 구현
2. NicePayServerAdapter 개발 및 테스트
3. 기존 코드와 병렬 운영

### Phase 2: 점진적 마이그레이션
1. 새로운 결제 요청부터 신규 구조 사용
2. 기존 결제 건들은 레거시 로직 유지
3. A/B 테스트로 안정성 검증

### Phase 3: 다중 PG 지원 확장
1. Eximbay, Adyen 어댑터 추가
2. PG별 라우팅 로직 구현
3. 통합 테스트 및 문서화

### Phase 4: 레거시 코드 정리
1. 기존 NicePay 전용 코드 단계적 제거
2. 데이터베이스 스키마 정리
3. 성능 최적화

이 아키텍처는 Next.js Server Actions의 장점을 살리면서 PG 중립성을 확보하여, 향후 국제화 및 다중 PG 지원을 위한 확장성을 제공합니다.