🎯 수정 목표 및 이유
	•	목표: 현재 나이스페이(포스타트) 단일 PG 연동을 기반으로 하되, 향후 다른 PG사(토스페이먼츠, Eximbay, Adyen 등) 확장/전환이 가능하도록 아키텍처를 PG 중립화한다.
	•	이유:
	1.	특정 PG에 종속된 DB 스키마와 코드 구조를 만들면, 새로운 PG를 붙일 때 대규모 마이그레이션이 필요함.
	2.	provider / transaction_id / raw_response 같은 중립 필드로 통합하면, 어떤 PG든 쉽게 라우팅 가능.
	3.	코드 레벨에서 PG별 어댑터를 두면, 서비스 레이어는 공통 인터페이스만 호출 → 교체·병행이 간단해짐.

⸻

1. 데이터베이스 스키마 수정

payments 테이블
```
ALTER TABLE payments
ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'nicepay', -- PG사 구분
ADD COLUMN provider_transaction_id VARCHAR(64),              -- PG 거래 ID
ADD COLUMN raw_response JSONB;                               -- 공통 PG 응답 저장

-- 나이스페이 전용 컬럼 제거
ALTER TABLE payments
DROP COLUMN nicepay_response,
DROP COLUMN auth_token;
```

Reason
	•	현재 스키마는 tid, nicepay_response 등 나이스페이 전용 값에 종속됨.
	•	provider, provider_transaction_id, raw_response로 통일하면
다른 PG 추가 시 DB 구조 변경이 불필요하고, 응답 JSON 저장으로 CS·디버깅 유리.

refunds 테이블

ALTER TABLE refunds
ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'nicepay',
ADD COLUMN refund_response JSONB;

ALTER TABLE refunds
DROP COLUMN cancelled_tid;

Reason
	•	cancelled_tid도 특정 PG 전용.
	•	refund_response JSON으로 저장 시 어떤 PG든 환불 응답을 동일 포맷으로 기록 가능.

⸻

ENUM/코드 중립화
	•	payment_method → 내부 ENUM 표준화
	•	예: 'card' | 'account_transfer' | 'virtual_account' | 'wallet:paypal' | 'wallet:alipay'.
	•	PG 응답값은 별도 매핑 테이블을 통해 내부 ENUM으로 변환.

Reason
	•	PG마다 같은 결제수단도 명칭이 다름 ("CARD" vs "CC", "VISA" vs "VISACARD").
	•	내부 표준 ENUM을 쓰면 UI/백오피스/통계에서 일관성을 유지할 수 있음.

⸻

2. 코드 구조

PaymentAdapter 인터페이스

export interface PaymentAdapter {
  createPayment(request: PaymentRequest): Promise<PaymentInitResult>
  approvePayment(tid: string, amount: number): Promise<PaymentApprovalResult>
  cancelPayment(tid: string, reason: string, amount?: number): Promise<PaymentCancelResult>
  getStatus(tid: string): Promise<PaymentStatusResult>
}

Reason
	•	서비스 레이어는 PG 종류를 몰라도 공통 인터페이스만 호출.
	•	NicepayAdapter, EximbayAdapter, AdyenAdapter 등 구현만 교체/추가 가능.

⸻

3. API 라우트 구조
/api/payments/[provider]/process
/api/payments/[provider]/webhook
/api/payments/[provider]/cancel

Reason
	•	현재는 /api/nicepay/*로 고정 → 다른 PG 추가 시 중복 코드 발생.
	•	provider 파라미터를 통해 동적 라우팅하면 하나의 구조 안에서 확장 가능.


5. 로그 테이블

ALTER TABLE payment_logs
ADD COLUMN provider VARCHAR(20);

Reason
	•	이벤트(auth_success, payment_success 등)를 PG사별로 구분 가능.
	•	다중 PG 운영 시 문제 발생 위치를 정확히 추적할 수 있음.


6. 프론트엔드 구조

export function usePaymentGateway(provider: string) {
  switch (provider) {
    case 'nicepay': return useNicePaySDK()
    case 'eximbay': return useEximbaySDK()
    default: throw new Error("Unsupported PG")
  }
}

Reason
	•	PG사별 JS SDK가 다르므로 동적 로더 필요.
	•	하나의 PaymentButton 컴포넌트에서 provider만 바꿔 호출 → 재사용성 증가.