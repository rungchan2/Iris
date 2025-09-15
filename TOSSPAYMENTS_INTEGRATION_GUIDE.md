# TossPayments 결제 모듈 연동 가이드

이 문서는 Photo4You 프로젝트에 TossPayments 결제 시스템을 연동하기 위한 종합 가이드입니다.

## 📋 목차
1. [개요](#개요)
2. [결제 방식 선택](#결제-방식-선택)
3. [환경 설정](#환경-설정)
4. [구현 단계](#구현-단계)
5. [데이터베이스 구조](#데이터베이스-구조)
6. [보안 및 테스트](#보안-및-테스트)

## 개요

TossPayments는 다양한 결제 수단을 지원하는 통합 결제 시스템입니다.

### 지원 결제 수단
- **카드**: 국내 모든 신용/체크카드
- **간편결제**: 토스페이, 네이버페이, 카카오페이, 삼성페이, 애플페이 등
- **계좌이체**: 실시간 계좌이체, 퀵계좌이체
- **가상계좌**: 무통장 입금
- **휴대폰**: 휴대폰 소액결제
- **상품권**: 문화상품권, 도서상품권 등

### 주요 특징
- 한 번의 연동으로 모든 결제수단 사용 가능
- 브랜드 일관성을 유지하는 결제 UI
- 결제 시간 70% 단축으로 전환율 향상
- 노코드 어드민으로 운영 관리 간소화

## 결제 방식 선택

Photo4You 프로젝트에는 **결제위젯** 방식을 권장합니다.

### 결제위젯 vs 결제창 비교

| 구분 | 결제위젯 | 결제창 |
|------|---------|--------|
| **UI 통일성** | 브랜드 일관성 유지 | PG사 별도 창 표시 |
| **결제 단계** | 주문서에서 바로 결제 | 추가 팝업/페이지 필요 |
| **개발 공수** | 최소 (한 번 연동) | 결제수단별 개별 구현 |
| **운영 관리** | 노코드 어드민 제공 | 코드 수정 필요 |
| **추천 대상** | 브랜드 경험 중시 | 빠른 MVP 구현 |

## 환경 설정

### 1. TossPayments 계정 설정

```bash
# 1. TossPayments 개발자센터 가입
# https://developers.tosspayments.com

# 2. API 키 발급
# - 테스트 클라이언트 키: test_ck_*
# - 테스트 시크릿 키: test_sk_*
# - 라이브 클라이언트 키: live_ck_*
# - 라이브 시크릿 키: live_sk_*
```

### 2. 환경 변수 설정

```bash
# .env.local
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_YOUR_KEY
TOSS_SECRET_KEY=test_sk_YOUR_KEY
NEXT_PUBLIC_TOSS_SUCCESS_URL=http://localhost:3000/payment/success
NEXT_PUBLIC_TOSS_FAIL_URL=http://localhost:3000/payment/fail
```

### 3. SDK 설치

```bash
# npm 패키지 설치
npm install @tosspayments/tosspayments-sdk --save

# 또는 yarn
yarn add @tosspayments/tosspayments-sdk
```

## 구현 단계

### 1단계: SDK 초기화

```typescript
// lib/toss/client.ts
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

export const initTossPayments = async () => {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
  return await loadTossPayments(clientKey);
};
```

### 2단계: 결제위젯 컴포넌트 구현

```typescript
// components/payment/payment-widget.tsx
'use client';

import { useEffect, useState } from 'react';
import { initTossPayments } from '@/lib/toss/client';
import { nanoid } from 'nanoid';

interface PaymentWidgetProps {
  amount: number;
  orderName: string;
  customerKey: string;
  customerEmail?: string;
  customerName?: string;
  customerMobilePhone?: string;
}

export function PaymentWidget({
  amount,
  orderName,
  customerKey,
  customerEmail,
  customerName,
  customerMobilePhone
}: PaymentWidgetProps) {
  const [widgets, setWidgets] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function setupWidgets() {
      const tossPayments = await initTossPayments();
      const widgets = tossPayments.widgets({ 
        customerKey 
      });
      
      setWidgets(widgets);
    }
    
    setupWidgets();
  }, [customerKey]);

  useEffect(() => {
    if (widgets == null) return;

    async function renderWidgets() {
      // 결제금액 설정
      await widgets.setAmount({
        currency: 'KRW',
        value: amount,
      });

      // 결제 방법 위젯 렌더링
      await widgets.renderPaymentMethods({
        selector: '#payment-methods',
        variantKey: 'DEFAULT',
      });

      // 약관 위젯 렌더링
      await widgets.renderAgreement({
        selector: '#agreement',
        variantKey: 'AGREEMENT',
      });

      setReady(true);
    }

    renderWidgets();
  }, [widgets, amount]);

  const handlePayment = async () => {
    if (!widgets) return;

    try {
      await widgets.requestPayment({
        orderId: nanoid(),
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail,
        customerName,
        customerMobilePhone,
      });
    } catch (error) {
      console.error('결제 요청 실패:', error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">결제하기</h2>
      
      {/* 결제 수단 선택 영역 */}
      <div id="payment-methods" className="mb-6" />
      
      {/* 약관 동의 영역 */}
      <div id="agreement" className="mb-6" />
      
      {/* 결제 버튼 */}
      <button
        onClick={handlePayment}
        disabled={!ready}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {amount.toLocaleString()}원 결제하기
      </button>
    </div>
  );
}
```

### 3단계: 서버 측 결제 승인 처리

```typescript
// lib/actions/payment.ts
'use server';

import { createClient } from '@/lib/supabase/server';

interface PaymentConfirmData {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export async function confirmPayment(data: PaymentConfirmData) {
  const { paymentKey, orderId, amount } = data;
  
  try {
    // TossPayments 결제 승인 API 호출
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '결제 승인 실패');
    }

    // 결제 정보 데이터베이스 저장
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount,
        currency: 'KRW',
        provider: 'tosspayments',
        provider_transaction_id: paymentKey,
        payment_method: result.method,
        status: 'paid',
        paid_at: new Date().toISOString(),
        buyer_name: result.card?.ownerType === 'personal' ? result.customerName : '',
        buyer_email: result.customerEmail || '',
        buyer_tel: result.customerMobilePhone || '',
        raw_response: result,
        card_info: result.card ? {
          number: result.card.number,
          cardType: result.card.cardType,
          ownerType: result.card.ownerType,
          acquireStatus: result.card.acquireStatus,
          issuerCode: result.card.issuerCode,
          acquirerCode: result.card.acquirerCode,
        } : null,
        receipt_url: result.receipt?.url || '',
      });

    if (dbError) {
      console.error('결제 정보 저장 실패:', dbError);
      // 결제는 성공했지만 DB 저장 실패 시 별도 처리
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('결제 승인 에러:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '결제 승인 중 오류가 발생했습니다.' 
    };
  }
}
```

### 4단계: 결제 성공/실패 페이지

```typescript
// app/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { confirmPayment } from '@/lib/actions/payment';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function confirm() {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentKey || !orderId || !amount) {
        setStatus('error');
        setMessage('결제 정보가 올바르지 않습니다.');
        return;
      }

      const result = await confirmPayment({
        paymentKey,
        orderId,
        amount: Number(amount),
      });

      if (result.success) {
        setStatus('success');
        setMessage('결제가 완료되었습니다.');
      } else {
        setStatus('error');
        setMessage(result.error || '결제 처리 중 오류가 발생했습니다.');
      }
    }

    confirm();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && <p>결제를 처리하고 있습니다...</p>}
        {status === 'success' && (
          <div>
            <h1 className="text-2xl font-bold text-green-600 mb-4">결제 성공!</h1>
            <p>{message}</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">결제 실패</h1>
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5단계: 환불 처리

```typescript
// lib/actions/refund.ts
'use server';

export async function cancelPayment(paymentKey: string, cancelReason: string) {
  try {
    const response = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancelReason,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '환불 실패');
    }

    // 환불 정보 DB 저장
    const supabase = await createClient();
    await supabase
      .from('refunds')
      .insert({
        payment_id: paymentKey,
        refund_type: 'full',
        refund_reason: cancelReason,
        original_amount: result.totalAmount,
        refund_amount: result.totalAmount,
        remaining_amount: 0,
        provider: 'tosspayments',
        provider_refund_id: result.cancels?.[0]?.transactionKey,
        status: 'completed',
        processed_at: new Date().toISOString(),
      });

    return { success: true, data: result };
  } catch (error) {
    console.error('환불 처리 에러:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '환불 처리 중 오류가 발생했습니다.' 
    };
  }
}
```

## 데이터베이스 구조

### payments 테이블 수정사항

```sql
-- TossPayments 전용 필드 추가
ALTER TABLE payments 
ADD COLUMN toss_payment_key VARCHAR(200),
ADD COLUMN toss_transaction_key VARCHAR(200),
ADD COLUMN toss_approval_number VARCHAR(50),
ADD COLUMN toss_easy_pay JSON, -- 간편결제 정보
ADD COLUMN toss_virtual_account JSON; -- 가상계좌 정보

-- 인덱스 추가
CREATE INDEX idx_payments_toss_payment_key ON payments(toss_payment_key);
```

## 보안 및 테스트

### 보안 체크리스트
- [ ] 시크릿 키는 서버 사이드에서만 사용
- [ ] 클라이언트 키는 public 환경변수로 관리
- [ ] HTTPS 환경에서만 결제 진행
- [ ] Webhook 설정으로 결제 상태 동기화
- [ ] 중복 결제 방지 로직 구현

### 테스트 카드 정보

```javascript
// 테스트 환경에서 사용 가능한 카드
const testCards = {
  success: {
    number: '4330000000000004', // 승인 성공
    expiry: '12/28',
    cvc: '123',
  },
  fail: {
    number: '4000000000000002', // 승인 실패
    expiry: '12/28',
    cvc: '123',
  },
};
```

### 테스트 시나리오

1. **정상 결제 플로우**
   - 결제위젯 렌더링 확인
   - 테스트 카드로 결제 진행
   - 결제 승인 및 DB 저장 확인

2. **에러 처리**
   - 네트워크 오류 시뮬레이션
   - 잘못된 카드 정보 입력
   - 결제 취소 처리

3. **환불 플로우**
   - 전체 환불 테스트
   - 부분 환불 테스트 (추후 구현)

## 다음 단계

### 우선순위 높음
1. [ ] Webhook 엔드포인트 구현 (결제 상태 실시간 동기화)
2. [ ] 정기결제(빌링) 시스템 구현
3. [ ] 관리자 대시보드 결제 관리 기능

### 우선순위 중간
1. [ ] 부분 환불 기능 구현
2. [ ] 결제 통계 대시보드
3. [ ] 매출 리포트 생성

### 우선순위 낮음
1. [ ] 해외 결제 지원
2. [ ] 포인트/쿠폰 시스템 연동
3. [ ] 결제 알림 커스터마이징

## 참고 자료

- [TossPayments 개발자 문서](https://docs.tosspayments.com)
- [결제위젯 연동 가이드](https://docs.tosspayments.com/guides/payment-widget/integration)
- [API 레퍼런스](https://docs.tosspayments.com/reference)
- [에러 코드 목록](https://docs.tosspayments.com/reference/error-codes)
- [샘플 프로젝트](https://github.com/tosspayments/payment-widget-sample)

## 지원 및 문의

- TossPayments 고객센터: 1544-7772
- 이메일: support@tosspayments.com
- 개발자 포럼: https://discord.gg/tosspayments