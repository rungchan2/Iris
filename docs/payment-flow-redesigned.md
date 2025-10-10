# 토스페이먼츠 결제 시스템 설계 문서
> Next.js + Supabase + 토스페이먼츠 v2  
> RPC 미사용 / 상태 기반 멱등성 설계

---

## 📋 목차
1. [설계 원칙](#설계-원칙)
2. [결제 플로우](#결제-플로우)
3. [예외 상황 전체 목록](#예외-상황-전체-목록)
4. [상태 전이 다이어그램](#상태-전이-다이어그램)
5. [복구 메커니즘](#복구-메커니즘)
6. [모니터링 전략](#모니터링-전략)

---

## 🎯 설계 원칙

### 1. 상태 기반 멱등성
- **payments.status**를 상태 머신으로 관리
- 모든 상태 전이는 **단방향**
- 같은 요청 여러 번 = 같은 결과

### 2. 낙관적 잠금 (Optimistic Locking)
```sql
UPDATE payments 
SET status = 'processing'
WHERE id = xxx 
  AND status = 'pending'  -- 이전 상태 확인
```
- WHERE 조건에 현재 상태 포함
- UPDATE 결과가 0 rows면 충돌 감지

### 3. 완전한 로그 기록
- 모든 단계를 `payment_logs`에 기록
- 실패 지점 추적 가능
- 복구 시 참조

### 4. Fail-Safe 우선
- 불확실한 상황: 사용자에게 "확인 필요" 안내
- 토스 성공 + DB 실패: 복구 큐 추가
- 절대 결제금 손실 방지

---

## 🔄 결제 플로우

### Phase 1: 결제 준비

#### API: POST /api/payments/prepare

**목적**: 결제 레코드 생성 및 검증

**처리 과정**:
1. 사용자 인증 확인 (supabase.auth.getUser)
2. 상품 조회 및 검증
   - products.status = 'approved'
   - product.price === request.amount
3. 문의 검증 (inquiryId 있는 경우)
   - inquiries.user_id = 현재 사용자
   - inquiries.payment_id IS NULL
4. orderId 생성: `ORD_{timestamp}_{nanoid(8)}`
5. payments INSERT
   - status: 'pending'
   - user_id, photographer_id, product_id, amount 저장
6. payment_logs INSERT (event_type: 'prepare')
7. orderId 반환

**예외 처리**:
| 예외 상황 | 응답 코드 | 처리 방법 |
|-----------|----------|----------|
| 인증 실패 | 401 | 로그인 페이지로 리다이렉트 |
| 상품 없음 | 404 | "상품을 찾을 수 없습니다" |
| 금액 불일치 | 400 | "잘못된 요청입니다" |
| 이미 결제됨 | 400 | "이미 결제된 문의입니다" |
| DB 삽입 실패 | 500 | "일시적 오류, 다시 시도해주세요" |

---

### Phase 2: 토스 결제창 호출

**클라이언트 처리**:
1. @tosspayments/payment-sdk 로드
2. payment.requestPayment() 호출
   - amount, orderId, orderName
   - successUrl: `/api/payments/success`
   - failUrl: `/api/payments/fail`

**토스 내부 처리** (우리가 제어 불가):
- 사용자 카드 정보 입력
- 카드사 승인 요청
- 승인/거부 결정

---

### Phase 3: 토스 실패 처리

#### API: GET /api/payments/fail

**토스 실패 케이스**:
- 사용자가 결제창에서 취소
- 카드 한도 초과
- 잔액 부족
- 도난/분실 카드
- 해외 결제 차단
- 3D Secure 인증 실패

**URL 파라미터**:
- code: 에러 코드
- message: 에러 메시지
- orderId: 주문 번호

**처리 과정**:
1. orderId로 payment 조회
2. payments UPDATE
   - status = 'failed'
   - error_message = message
   - failed_at = NOW()
3. payment_logs INSERT
   - event_type: 'toss_failed'
   - event_data: { code, message, orderId }
4. 303 리다이렉트 → `/payment/fail?message={message}`

**로그 기록 예시**:
```json
{
  "payment_id": "xxx",
  "event_type": "toss_failed",
  "event_data": {
    "code": "REJECT_CARD_COMPANY",
    "message": "카드사에서 승인을 거부했습니다",
    "orderId": "ORD_xxx"
  },
  "created_at": "2025-10-10T12:34:56Z"
}
```

---

### Phase 4: 토스 성공 처리 (핵심!)

#### API: GET /api/payments/success

**URL 파라미터**:
- paymentKey: 토스 결제 키
- orderId: 주문 번호
- amount: 결제 금액

---

#### Step 1: 조회 및 1차 검증

**처리**:
1. orderId로 payments 조회
2. 검증:
   - payment 존재 여부
   - payment.amount === URL amount
   - payment.status 확인

**예외 A: 결제 정보 없음**
```
원인: 잘못된 orderId 또는 DB 오류
처리:
  - payment_logs INSERT (event_type: 'error')
  - 303 → /payment/fail?message=결제 정보를 찾을 수 없습니다
```

**예외 B: 금액 위변조 감지**
```
원인: URL amount ≠ DB amount
처리:
  1. payments.status = 'fraud_detected'
  2. payment_logs INSERT
     {
       event_type: 'fraud_attempt',
       event_data: {
         db_amount: 100000,
         request_amount: 10000,  // 위조 시도!
         user_id: xxx,
         ip_address: xxx
       }
     }
  3. 관리자에게 긴급 알림 (Slack/Email)
  4. 303 → /payment/fail?message=잘못된 요청입니다
```

**예외 C: 이미 처리된 결제 (중복 요청)**
```
원인: 사용자가 뒤로가기 후 다시 진입 또는 새로고침
상태: payment.status = 'paid'
처리:
  - payment_logs INSERT (event_type: 'duplicate_request')
  - 303 → /payment/complete?orderId=xxx
  - 추가 처리 없음 (멱등성 보장)
```

---

#### Step 2: 상태 잠금 (Processing)

**처리**:
```sql
UPDATE payments
SET 
  status = 'processing',
  updated_at = NOW()
WHERE id = xxx
  AND status = 'pending'  -- 중요!
```

**UPDATE 결과 확인**:
- 1 row: 정상, 다음 단계 진행
- 0 rows: 동시 요청 감지

**예외 D: 동시 요청 (Concurrent Request)**
```
원인: 
  - 사용자가 결제 완료 페이지를 여러 번 새로고침
  - 브라우저 중복 요청
  - 토스에서 중복 리다이렉트

시나리오:
  Request A: pending → processing (성공)
  Request B: pending → processing (실패, 0 rows)

Request B 처리:
  1. 현재 payment.status 재조회
  2. 상태별 분기:
     - 'paid': 303 → /payment/complete
     - 'processing': 대기 페이지 표시 (3초 후 재조회)
     - 'failed': 303 → /payment/fail
  3. payment_logs INSERT (event_type: 'concurrent_request')
```

**정상 처리**:
```
1. payment_logs INSERT
   {
     event_type: 'processing_start',
     event_data: { paymentKey, orderId, amount }
   }
2. 다음 단계로 진행
```

---

#### Step 3: 토스 승인 API 호출

**API 호출**:
```
POST https://api.tosspayments.com/v1/payments/confirm
Authorization: Basic {TOSS_SECRET_KEY}
Body: {
  orderId: string,
  amount: number,
  paymentKey: string
}
```

**타임아웃 설정**: 10초

**예외 E: 네트워크 타임아웃**
```
원인: 토스 API 응답 10초 초과

처리:
  1. payments UPDATE
     - status = 'timeout'
     - error_message = 'Toss API timeout'
  
  2. payment_logs INSERT
     {
       event_type: 'timeout',
       event_data: { orderId, elapsed_ms: 10000 }
     }
  
  3. 사용자 안내
     - "결제 처리 중입니다"
     - "잠시 후 주문 내역에서 확인해주세요"
     - "문제 지속 시 고객센터 문의"
  
  4. 백그라운드 처리
     - Webhook으로 최종 결과 수신 대기
     - Cron으로 10분 후 토스 조회 API 호출
     - 결과에 따라 status 업데이트
```

**예외 F: 토스 승인 거부 (200 OK지만 실패)**
```
원인:
  - 카드 한도 초과
  - 일일 결제 한도 초과
  - 카드 유효기간 만료
  - 보안 정책 위반
  - 가맹점 정책 위반

토스 응답 예시:
{
  "code": "REJECT_CARD_COMPANY",
  "message": "카드사에서 승인을 거부했습니다"
}

처리:
  1. payments UPDATE
     - status = 'failed'
     - error_message = tossData.message
     - failed_at = NOW()
  
  2. payment_logs INSERT
     {
       event_type: 'toss_rejected',
       http_status_code: 200,
       error_message: tossData.message,
       event_data: tossData
     }
  
  3. 303 → /payment/fail?message={tossData.message}
```

**예외 G: 토스 API 500 에러**
```
원인: 토스 내부 서버 오류

처리:
  1. payments UPDATE
     - status = 'toss_error'
     - error_message = 'Toss internal error'
  
  2. payment_logs INSERT (http_status_code: 500)
  
  3. 재시도 로직 (최대 3회, 지수 백오프)
     - 1초 후 재시도
     - 2초 후 재시도
     - 4초 후 재시도
  
  4. 3회 실패 시
     - payment_recovery_queue INSERT
     - 관리자 알림
     - 사용자 안내: "일시적 오류, 고객센터 문의"
```

**정상 처리 (토스 승인 성공)**:
```
토스 응답:
{
  "transactionKey": "txn_xxx",
  "method": "카드",
  "approvedAt": "2025-10-10T12:34:56+09:00",
  "card": {
    "company": "신한",
    "number": "1234-****-****-5678",
    "installmentPlanMonths": 0
  },
  "receipt": {
    "url": "https://..."
  }
}

다음 단계로 진행
```

---

#### Step 4: 결제 완료 업데이트

**처리**:
```sql
UPDATE payments
SET
  status = 'paid',
  provider_transaction_id = tossData.transactionKey,
  payment_method = tossData.method,
  paid_at = tossData.approvedAt,
  card_info = tossData.card,
  receipt_url = tossData.receipt.url,
  raw_response = tossData,
  updated_at = NOW()
WHERE id = xxx
  AND status = 'processing'  -- 다시 한번 상태 체크!
```

**예외 H: 상태 불일치 (토스 성공 + DB 실패)**
```
원인:
  - 다른 요청이 먼저 완료
  - DB 연결 끊김
  - 트랜잭션 충돌

UPDATE 결과: 0 rows

이것은 CRITICAL 상황!
토스는 이미 승인됐지만 우리 DB에 반영 안됨

처리:
  1. payment_recovery_queue INSERT
     {
       payment_id: xxx,
       payment_key: paymentKey,
       order_id: orderId,
       toss_response: tossData,
       failed_step: 'update_paid',
       retry_count: 0,
       created_at: NOW()
     }
  
  2. 관리자에게 CRITICAL 알림
     제목: "결제 승인됐으나 DB 업데이트 실패"
     내용: orderId, paymentKey, amount
     우선순위: P0 (즉시 조치)
  
  3. payment_logs INSERT
     {
       event_type: 'critical_db_failure',
       event_data: {
         orderId,
         paymentKey,
         toss_transaction_key: tossData.transactionKey,
         error: 'UPDATE returned 0 rows'
       }
     }
  
  4. Vercel Cron (매 1분)으로 자동 복구 시도
     - recovery_queue 조회
     - UPDATE 재시도
     - 성공 시 queue에서 제거
  
  5. 사용자에게는 성공 페이지 표시
     - 실제 결제는 완료됨
     - DB만 업데이트 필요 (내부 문제)
```

**정상 처리**:
```
1. payment_logs INSERT
   {
     event_type: 'payment_completed',
     event_data: {
       transaction_key: tossData.transactionKey,
       paid_at: tossData.approvedAt
     }
   }

2. 다음 단계로 진행
```

---

#### Step 5: 연관 데이터 업데이트

**5-1: inquiries 업데이트**

```sql
UPDATE inquiries
SET
  payment_id = xxx,
  payment_status = 'paid',
  status = 'completed',
  updated_at = NOW()
WHERE id = yyy
```

**예외 I: inquiries 업데이트 실패**
```
원인:
  - inquiry가 이미 삭제됨
  - FK 제약 위반
  - DB 연결 끊김

처리:
  1. payment_logs INSERT
     {
       event_type: 'inquiry_update_failed',
       error_message: error.message,
       event_data: { inquiry_id, payment_id }
     }
  
  2. 심각도 판단:
     - inquiry가 선택 항목이면: 경고만 로그
     - inquiry가 필수 항목이면: recovery_queue 추가
  
  3. 다음 단계는 계속 진행 (결제는 완료됨)
```

---

**5-2: 정산 금액 계산**

```
photographer 조회:
  - settlement_ratio (예: 70%)
  - tax_rate (예: 3.3%)

계산:
  platform_fee = amount × (100 - settlement_ratio) / 100
  tax_amount = amount × tax_rate / 100
  settlement_amount = amount - platform_fee - tax_amount

예시:
  amount: 100,000원
  settlement_ratio: 70%
  tax_rate: 3.3%
  
  platform_fee = 100,000 × 30% = 30,000원
  tax_amount = 100,000 × 3.3% = 3,300원
  settlement_amount = 100,000 - 30,000 - 3,300 = 66,700원
```

---

**5-3: settlement_items 생성**

```sql
INSERT INTO settlement_items (
  photographer_id,
  payment_id,
  payment_amount,
  platform_fee,
  platform_fee_rate,
  tax_amount,
  tax_rate,
  settlement_amount,
  status,
  settlement_date
) VALUES (
  xxx,
  yyy,
  100000,
  30000,
  30.00,
  3300,
  3.30,
  66700,
  'pending',
  '2025-11-10'  -- 익월 10일
)
```

**예외 J: settlement_items 생성 실패**
```
원인:
  - photographer_id FK 위반
  - payment_id 중복 (이미 생성됨)
  - DB 제약 조건 위반

처리:
  1. payment_logs INSERT
     {
       event_type: 'settlement_creation_failed',
       error_message: error.message,
       event_data: {
         photographer_id,
         payment_id,
         settlement_amount
       }
     }
  
  2. payment_recovery_queue INSERT
     {
       payment_id: xxx,
       failed_step: 'create_settlement',
       retry_count: 0
     }
  
  3. 관리자 알림
     - 제목: "정산 항목 생성 실패"
     - 우선순위: P1 (24시간 내 조치)
  
  4. 다음 단계는 계속 진행
     - 결제는 완료됨
     - 정산은 나중에 복구 가능
```

---

#### Step 6: 최종 리다이렉트

**정상 처리**:
```
303 See Other → /payment/complete?orderId=xxx

헤더:
  Cache-Control: no-store, no-cache, must-revalidate
  Pragma: no-cache
```

---

### Phase 5: 결제 완료 페이지

#### 클라이언트: /payment/complete

**1. 서버 재검증**
```
API 호출: GET /api/payments/verify?orderId=xxx

응답:
{
  orderId: "ORD_xxx",
  status: "paid",
  amount: 100000,
  paidAt: "2025-10-10T12:34:56Z",
  receiptUrl: "https://..."
}

예외 K: 검증 실패
  - status가 'paid'가 아님
  - orderId가 일치하지 않음
  - 사용자가 결제 주체가 아님

처리:
  - 강제 리다이렉트 → /payment/fail
  - 메시지: "결제 정보를 확인할 수 없습니다"
```

**2. 히스토리 조작 (뒤로가기 방지)**
```
useEffect(() => {
  // 히스토리 스택에 현재 페이지 추가
  window.history.pushState(null, '', location.href)
  
  // popstate 이벤트 리스너
  const handlePopState = (e) => {
    e.preventDefault()
    window.history.pushState(null, '', location.href)
    
    // 사용자 확인
    const confirmLeave = confirm(
      '결제가 완료되었습니다. 정말 이 페이지를 벗어나시겠습니까?'
    )
    
    if (confirmLeave) {
      router.push('/') // 홈으로 이동
    }
  }
  
  window.addEventListener('popstate', handlePopState)
  
  return () => {
    window.removeEventListener('popstate', handlePopState)
  }
}, [])
```

**3. 화면 구성**
- 성공 아이콘 ✓
- 주문번호 표시
- 결제 금액
- 영수증 다운로드 버튼
- 주문 내역 보기 버튼
- 홈으로 가기 버튼

---

## 🚨 예외 상황 전체 목록

### 1. 준비 단계 예외

| ID | 예외 | 원인 | 상태 코드 | 처리 |
|----|------|------|----------|------|
| A1 | 인증 실패 | 토큰 만료/없음 | 401 | 로그인 페이지 |
| A2 | 상품 없음 | 잘못된 productId | 404 | 에러 메시지 |
| A3 | 금액 불일치 | 위변조 시도 | 400 | 에러 메시지 |
| A4 | 이미 결제됨 | 중복 결제 시도 | 400 | 기존 주문 페이지 |
| A5 | DB 삽입 실패 | DB 연결 끊김 | 500 | 재시도 안내 |

### 2. 토스 처리 예외

| ID | 예외 | 원인 | 처리 |
|----|------|------|------|
| B1 | 사용자 취소 | 결제창에서 취소 | failUrl 리다이렉트 |
| B2 | 카드 한도 초과 | 카드사 거부 | failUrl 리다이렉트 |
| B3 | 잔액 부족 | 계좌 잔액 부족 | failUrl 리다이렉트 |
| B4 | 도난/분실 카드 | 카드사 차단 | failUrl 리다이렉트 |
| B5 | 3D Secure 실패 | 인증 실패 | failUrl 리다이렉트 |

### 3. 승인 단계 예외

| ID | 예외 | 원인 | 상태 | 처리 |
|----|------|------|------|------|
| C1 | 결제 정보 없음 | 잘못된 orderId | - | 실패 페이지 |
| C2 | 금액 위변조 | URL 조작 | fraud_detected | 관리자 알림 + 실패 |
| C3 | 중복 요청 | 새로고침 | paid | 성공 페이지 (멱등성) |
| C4 | 동시 요청 | 병렬 처리 | processing | 대기 후 재조회 |
| C5 | 네트워크 타임아웃 | 토스 API 10초+ | timeout | Webhook 대기 |
| C6 | 토스 승인 거부 | 카드사 거부 | failed | 실패 페이지 |
| C7 | 토스 500 에러 | 토스 내부 오류 | toss_error | 재시도 → 복구 큐 |
| C8 | DB 업데이트 실패 | 상태 불일치 | processing | CRITICAL 복구 큐 |

### 4. 연관 데이터 예외

| ID | 예외 | 원인 | 우선순위 | 처리 |
|----|------|------|----------|------|
| D1 | inquiries 실패 | FK 위반 | P2 | 로그 + 계속 진행 |
| D2 | settlement 실패 | 제약 위반 | P1 | 복구 큐 + 알림 |

### 5. 완료 페이지 예외

| ID | 예외 | 원인 | 처리 |
|----|------|------|------|
| E1 | 검증 실패 | status ≠ paid | 실패 페이지로 강제 이동 |
| E2 | 권한 없음 | 타인 orderId | 실패 페이지 |

---

## 🔄 상태 전이 다이어그램

```
[Initial] --prepare--> [pending]
                          |
                    (토스 결제창)
                          |
        +----------------+----------------+
        |                                 |
    (사용자 취소)                      (사용자 승인)
        |                                 |
        v                                 v
    [failed] <---toss_reject--- [processing]
        |                                 |
        |                         (토스 API 호출)
        |                                 |
        |         +----------------------+----------------------+
        |         |                      |                      |
        |    (승인 거부)            (타임아웃)              (승인 성공)
        |         |                      |                      |
        |         v                      v                      v
        +---> [failed]              [timeout]               [paid]
                                         |                      |
                                   (Webhook 대기)         (불변 상태)
                                         |
                                         v
                                   [paid/failed]
```

**상태 설명**:
- `pending`: 결제 대기 (초기 상태)
- `processing`: 승인 처리 중 (잠금 상태)
- `paid`: 결제 완료 (최종 성공)
- `failed`: 결제 실패 (최종 실패)
- `timeout`: 타임아웃 (임시, Webhook으로 해결)
- `fraud_detected`: 사기 시도 감지 (관리자 알림)
- `toss_error`: 토스 내부 오류 (복구 대상)

**불변 상태**:
- `paid`: 환불 외에는 변경 불가
- `failed`, `fraud_detected`: 변경 불가 (로그로만 추적)

---

## 🔧 복구 메커니즘

### 1. 복구 큐 (payment_recovery_queue)

**테이블 구조**:
```
id: UUID
payment_id: UUID
payment_key: TEXT
order_id: TEXT
toss_response: JSONB
failed_step: TEXT  (예: 'update_paid', 'create_settlement')
retry_count: INTEGER
last_retry_at: TIMESTAMPTZ
error_message: TEXT
status: TEXT  ('pending', 'recovered', 'failed')
created_at: TIMESTAMPTZ
```

**복구 대상**:
1. 토스 승인 성공 + DB 업데이트 실패
2. settlement_items 생성 실패
3. 토스 API 타임아웃 (10분 후 조회)
4. 토스 500 에러 (3회 재시도 실패 후)

---

### 2. Vercel Cron Job

**실행 주기**: 매 5분

**처리 로직**:
```
1. recovery_queue 조회 (status = 'pending', retry_count < 5)
2. failed_step별 복구 시도:
   
   A. 'update_paid':
      - payments.status 확인
      - 이미 paid면 queue 삭제
      - 아니면 UPDATE 재시도
   
   B. 'create_settlement':
      - settlement_items 존재 확인
      - 없으면 INSERT 재시도
   
   C. 'timeout':
      - 토스 조회 API 호출
      - 결과에 따라 payments 업데이트
   
   D. 'toss_error':
      - 토스 승인 API 재호출
      - 결과에 따라 처리

3. 복구 성공:
   - recovery_queue.status = 'recovered'
   - payment_logs INSERT (event_type: 'recovered')

4. 복구 실패:
   - retry_count += 1
   - last_retry_at = NOW()
   - 5회 실패 시:
     - recovery_queue.status = 'failed'
     - 관리자에게 수동 처리 요청 알림
```

---

### 3. 관리자 대시보드

**모니터링 항목**:
1. 복구 큐 크기 (실시간)
2. CRITICAL 알림 목록
3. 수동 처리 필요 건수
4. 사기 시도 감지 이력

**수동 복구 도구**:
1. orderId로 토스 조회 API 호출
2. 결제 상태 강제 업데이트
3. settlement_items 수동 생성
4. 사용자에게 보상 쿠폰 발급

---

## 📊 모니터링 전략

### 1. 결제 성공률

**지표**:
```
성공률 = (paid 건수) / (paid + failed 건수) × 100%

목표: 95% 이상
```

**알림 조건**:
- 시간당 성공률 90% 미만
- 10분간 연속 3건 이상 실패

---

### 2. 평균 처리 시간

**지표**:
```
처리 시간 = paid_at - created_at

목표: 5초 이내
```

**알림 조건**:
- 평균 처리 시간 10초 초과
- 개별 결제 30초 초과

---

### 3. 복구 큐 크기

**지표**:
```
복구 대기 건수 = COUNT(status = 'pending')

목표: 0건
```

**알림 조건**:
- 복구 큐 10건 이상
- 1시간 이상 미해결 건 존재

---

### 4. 이상 패턴 감지

**A. 사기 시도 감지**:
- 같은 IP에서 5분 내 5회 이상 금액 불일치
- 같은 user_id로 10분 내 10회 이상 실패
- 새벽 시간대 (00:00-06:00) 고액 결제 시도

**B. 토스 API 이상**:
- 5분간 타임아웃 비율 20% 이상
- 토스 500 에러 연속 3회

**C. DB 성능 이상**:
- UPDATE 응답 시간 1초 이상
- 동시 요청 감지 건수 급증

---

### 5. 로그 분석 쿼리

**5분간 결제 현황**:
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_seconds
FROM payments
WHERE created_at > NOW() - INTERVAL '5 minutes'
GROUP BY status;
```

**복구 큐 현황**:
```sql
SELECT 
  failed_step,
  retry_count,
  COUNT(*) as count
FROM payment_recovery_queue
WHERE status = 'pending'
GROUP BY failed_step, retry_count
ORDER BY retry_count DESC;
```

**사기 시도 감지**:
```sql
SELECT 
  user_id,
  ip_address,
  COUNT(*) as fraud_attempts
FROM payment_logs
WHERE event_type = 'fraud_attempt'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id, ip_address
HAVING COUNT(*) >= 3;
```

---

## 🎯 체크리스트

### 개발 완료 전 확인사항

- [ ] 모든 예외 상황에 대한 처리 로직 구현
- [ ] payment_logs에 모든 단계 기록
- [ ] 멱등성 테스트 (같은 요청 10회)
- [ ] 동시성 테스트 (parallel 요청 5개)
- [ ] 타임아웃 시뮬레이션
- [ ] 토스 API Mock 서버 테스트
- [ ] 복구 큐 Cron 동작 확인
- [ ] 관리자 알림 채널 연동
- [ ] 뒤로가기 방지 동작 확인
- [ ] 금액 위변조 시도 시뮬레이션
- [ ] 모니터링 대시보드 구축
- [ ] 로그 분석 쿼리 작성

### 프로덕션 배포 전 확인사항

- [ ] 토스 시크릿 키 환경변수 설정 (프로덕션 키)
- [ ] Webhook URL 등록 (https://yourdomain.com/api/webhooks/toss)
- [ ] Webhook 서명 검증 테스트
- [ ] Vercel Cron 활성화
- [ ] 관리자 알림 채널 테스트 (실제 알림 수신)
- [ ] 실제 카드로 1원 테스트 결제
- [ ] RLS 정책 활성화 및 검증
- [ ] 백업/복구 시나리오 문서화
- [ ] 장애 대응 매뉴얼 작성
- [ ] 고객센터 FAQ 업데이트

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-10-10 | 1.0 | 초기 설계 문서 작성 |

---

**문서 작성자**: AI Assistant  
**검토자**: [팀명]  
**승인자**: [이름]  
**최종 업데이트**: 2025-10-10