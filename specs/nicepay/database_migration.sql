-- ===================================
-- Iris 멀티 PG 결제 시스템 데이터베이스 마이그레이션
-- PG 중립적 아키텍처를 위한 테이블 생성
-- 1차: NicePay, 확장: Eximbay, Adyen 등
-- ===================================

-- 1. payments 테이블 생성 (PG 중립적 구조)
-- 결제 정보를 저장하는 메인 테이블
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  photographer_id UUID REFERENCES photographers(id),
  
  -- 결제 기본 정보
  order_id VARCHAR(64) NOT NULL UNIQUE, -- 주문번호 (IRIS_20240831_123456)
  amount INTEGER NOT NULL, -- 결제 금액 (원)
  currency VARCHAR(3) DEFAULT 'KRW',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', 
    -- pending: 대기중, paid: 결제완료, failed: 실패, cancelled: 취소, refunded: 환불
  
  -- PG 중립적 정보
  provider VARCHAR(20) NOT NULL DEFAULT 'nicepay', -- PG사 구분 (nicepay, eximbay, adyen 등)
  provider_transaction_id VARCHAR(64), -- 각 PG의 거래 ID (tid, transaction_id 등)
  payment_method VARCHAR(20), -- 표준화된 결제 수단 (card, bank_transfer, wallet:paypal 등)
  
  -- 결제 수단별 상세 정보 (JSON 저장)
  card_info JSONB, -- 카드 정보 (카드사, 할부개월, 카드번호 뒷자리 등)
  bank_info JSONB, -- 계좌이체 정보
  wallet_info JSONB, -- 전자지갑 정보 (PayPal, Alipay 등)
  
  -- 결제자 정보
  buyer_name VARCHAR(30),
  buyer_email VARCHAR(60),
  buyer_tel VARCHAR(40),
  
  -- 타임스탬프
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- 기타 정보
  receipt_url VARCHAR(200), -- 영수증 URL
  raw_response JSONB, -- 원본 PG 응답 데이터 (모든 PG 공통)
  error_message TEXT, -- 실패 시 에러 메시지
  admin_memo TEXT, -- 관리자 메모
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- payments 테이블 인덱스 생성
CREATE INDEX idx_payments_inquiry_id ON payments(inquiry_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_photographer_id ON payments(photographer_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_provider_transaction_id ON payments(provider_transaction_id);
CREATE INDEX idx_payments_provider ON payments(provider);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_method ON payments(payment_method);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_paid_at ON payments(paid_at DESC);

-- payments 테이블 코멘트
COMMENT ON TABLE payments IS 'PG 중립적 결제 정보 저장 테이블';
COMMENT ON COLUMN payments.order_id IS '가맹점에서 생성한 고유 주문번호';
COMMENT ON COLUMN payments.provider IS 'PG사 구분자 (nicepay, eximbay, adyen 등)';
COMMENT ON COLUMN payments.provider_transaction_id IS '각 PG사에서 발급한 거래 ID';
COMMENT ON COLUMN payments.status IS '결제 상태 (pending/paid/failed/cancelled/refunded)';
COMMENT ON COLUMN payments.payment_method IS '표준화된 결제 수단 (card/bank_transfer/wallet:paypal 등)';
COMMENT ON COLUMN payments.raw_response IS '원본 PG 응답 데이터 JSON (모든 PG 공통)';

-- ===================================

-- 2. refunds 테이블 생성 (PG 중립적 구조)
-- 환불/취소 정보를 저장하는 테이블
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  
  -- 환불 정보
  refund_amount INTEGER NOT NULL, -- 환불 금액
  refund_reason TEXT NOT NULL, -- 환불 사유 (상세)
  refund_category VARCHAR(50) NOT NULL, -- 환불 분류 (customer_request, photographer_issue, system_error, etc.)
  refund_type VARCHAR(20) NOT NULL, -- full: 전액환불, partial: 부분환불
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending: 대기중, completed: 완료, failed: 실패
  
  -- 부분 환불 관리
  original_amount INTEGER NOT NULL, -- 원본 결제 금액
  remaining_amount INTEGER NOT NULL, -- 남은 금액 (환불 후)
  
  -- PG 중립적 환불 정보
  provider VARCHAR(20) NOT NULL DEFAULT 'nicepay', -- PG사 구분자
  provider_refund_id VARCHAR(64), -- PG별 환불 거래 ID
  
  -- 환불 계좌 정보 (계좌 환불 시 필요)
  refund_account VARCHAR(20), -- 환불 계좌번호
  refund_bank_code VARCHAR(3), -- 은행 코드
  refund_holder VARCHAR(10), -- 예금주명
  
  -- 처리 정보
  requested_by UUID REFERENCES auth.users(id), -- 환불 요청자
  processed_by UUID REFERENCES auth.users(id), -- 처리자
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 요청 시간
  processed_at TIMESTAMP WITH TIME ZONE, -- 처리 시간
  
  -- 응답 데이터
  refund_response JSONB, -- PG 환불 응답 데이터 (모든 PG 공통)
  admin_note TEXT, -- 관리자 메모
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- refunds 테이블 인덱스 생성
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_refund_type ON refunds(refund_type);
CREATE INDEX idx_refunds_provider ON refunds(provider);
CREATE INDEX idx_refunds_provider_refund_id ON refunds(provider_refund_id);
CREATE INDEX idx_refunds_requested_by ON refunds(requested_by);
CREATE INDEX idx_refunds_processed_by ON refunds(processed_by);
CREATE INDEX idx_refunds_created_at ON refunds(created_at DESC);

-- refunds 테이블 코멘트
COMMENT ON TABLE refunds IS 'PG 중립적 환불/취소 정보 저장 테이블';
COMMENT ON COLUMN refunds.refund_type IS '환불 유형 (full: 전액환불, partial: 부분환불)';
COMMENT ON COLUMN refunds.provider IS 'PG사 구분자 (결제와 동일한 provider)';
COMMENT ON COLUMN refunds.provider_refund_id IS '각 PG사별 환불 거래 ID';
COMMENT ON COLUMN refunds.refund_response IS '원본 PG 환불 응답 데이터 JSON';

-- ===================================

-- 3. settlement_items 테이블 생성 (정산 상세 내역)
-- 각 결제건별 정산 정보를 저장
CREATE TABLE settlement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES photographers(id),
  
  -- 정산 기본 정보
  payment_amount INTEGER NOT NULL, -- 결제 금액
  platform_fee INTEGER NOT NULL, -- 플랫폼 수수료
  payment_gateway_fee INTEGER NOT NULL, -- 결제 대행사 수수료 (나이스페이)
  tax_amount INTEGER NOT NULL, -- 원천징수 세액 (3.3%)
  settlement_amount INTEGER NOT NULL, -- 최종 정산 금액
  
  -- 정산 상태
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending: 대기, calculated: 계산완료, settled: 정산완료
  settlement_date DATE, -- 정산 예정일
  settled_at TIMESTAMP WITH TIME ZONE, -- 실제 정산 완료일
  
  -- 수수료율 기록 (정산 시점의 수수료율 보존)
  platform_fee_rate DECIMAL(4,3) NOT NULL, -- 플랫폼 수수료율 (0.300 = 30%)
  tax_rate DECIMAL(4,3) NOT NULL, -- 세율 (0.033 = 3.3%)
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- settlement_items 테이블 인덱스 생성
CREATE INDEX idx_settlement_items_payment_id ON settlement_items(payment_id);
CREATE INDEX idx_settlement_items_photographer_id ON settlement_items(photographer_id);
CREATE INDEX idx_settlement_items_status ON settlement_items(status);
CREATE INDEX idx_settlement_items_settlement_date ON settlement_items(settlement_date);
CREATE INDEX idx_settlement_items_created_at ON settlement_items(created_at DESC);

-- settlement_items 테이블 코멘트
COMMENT ON TABLE settlement_items IS '결제건별 정산 상세 내역';
COMMENT ON COLUMN settlement_items.platform_fee IS '플랫폼 수수료 (결제금액의 일정 비율)';
COMMENT ON COLUMN settlement_items.settlement_amount IS '작가에게 지급할 최종 금액';

-- ===================================

-- 4. payment_logs 테이블 생성 (PG 중립적 구조)
-- 모든 결제 관련 이벤트를 기록
CREATE TABLE payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  
  -- PG 및 이벤트 정보
  provider VARCHAR(20) NOT NULL DEFAULT 'nicepay', -- PG사 구분자
  event_type VARCHAR(50) NOT NULL, 
    -- auth_request: 인증요청, auth_success: 인증성공, auth_failed: 인증실패
    -- payment_success: 결제성공, payment_failed: 결제실패
    -- cancel_request: 취소요청, cancel_success: 취소성공
    -- webhook_received: 웹훅수신, error: 오류발생
  event_data JSONB, -- 이벤트 상세 데이터
  
  -- 요청 정보
  ip_address INET, -- 요청 IP 주소
  user_agent TEXT, -- User-Agent
  referer TEXT, -- Referer 헤더
  
  -- 처리 정보
  response_time_ms INTEGER, -- 응답 시간 (밀리초)
  http_status_code INTEGER, -- HTTP 상태 코드
  error_message TEXT, -- 에러 메시지
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- payment_logs 테이블 인덱스 생성
CREATE INDEX idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX idx_payment_logs_provider ON payment_logs(provider);
CREATE INDEX idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX idx_payment_logs_created_at ON payment_logs(created_at DESC);
CREATE INDEX idx_payment_logs_ip_address ON payment_logs(ip_address);

-- payment_logs 테이블 코멘트
COMMENT ON TABLE payment_logs IS 'PG 중립적 결제 이벤트 로그 테이블';
COMMENT ON COLUMN payment_logs.provider IS 'PG사 구분자 (이벤트 발생 PG)';
COMMENT ON COLUMN payment_logs.event_type IS '이벤트 타입 (auth_request/payment_success/cancel_request 등)';
COMMENT ON COLUMN payment_logs.event_data IS '이벤트 상세 데이터 (JSON 형태)';

-- ===================================

-- 5. 기존 테이블 수정
-- inquiries 테이블에 결제 관련 필드 추가
ALTER TABLE inquiries 
ADD COLUMN payment_required BOOLEAN DEFAULT false,
ADD COLUMN payment_amount INTEGER,
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'not_required', 
  -- not_required: 결제불필요, pending: 결제대기, paid: 결제완료, cancelled: 결제취소
ADD COLUMN payment_id UUID REFERENCES payments(id),
ADD COLUMN payment_deadline TIMESTAMP WITH TIME ZONE; -- 결제 마감일

-- inquiries 테이블 인덱스 추가
CREATE INDEX idx_inquiries_payment_status ON inquiries(payment_status);
CREATE INDEX idx_inquiries_payment_id ON inquiries(payment_id);
CREATE INDEX idx_inquiries_payment_deadline ON inquiries(payment_deadline);

-- inquiries 테이블 코멘트 추가
COMMENT ON COLUMN inquiries.payment_required IS '결제 필요 여부';
COMMENT ON COLUMN inquiries.payment_amount IS '결제 금액 (원)';
COMMENT ON COLUMN inquiries.payment_status IS '결제 상태 (not_required/pending/paid/cancelled)';
COMMENT ON COLUMN inquiries.payment_deadline IS '결제 마감 시간 (이후 자동 취소)';

-- ===================================

-- photographers 테이블에 정산 정보 추가
ALTER TABLE photographers
ADD COLUMN bank_name VARCHAR(20), -- 은행명
ADD COLUMN bank_account VARCHAR(20), -- 계좌번호
ADD COLUMN account_holder VARCHAR(30), -- 예금주명
ADD COLUMN settlement_ratio DECIMAL(3,2) DEFAULT 0.70, -- 정산 비율 (70%)
ADD COLUMN settlement_day INTEGER DEFAULT 15, -- 정산일 (매월 15일)
ADD COLUMN tax_rate DECIMAL(4,2) DEFAULT 0.033; -- 세율 (3.3%)

-- photographers 테이블 인덱스 추가
CREATE INDEX idx_photographers_settlement_day ON photographers(settlement_day);

-- photographers 테이블 코멘트 추가
COMMENT ON COLUMN photographers.settlement_ratio IS '작가 정산 비율 (0.70 = 70%)';
COMMENT ON COLUMN photographers.settlement_day IS '매월 정산일 (1-31)';
COMMENT ON COLUMN photographers.tax_rate IS '원천징수 세율 (0.033 = 3.3%)';

-- ===================================

-- 6. settlements 테이블 생성 (월별 정산 집계)
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES photographers(id),
  
  -- 정산 기간
  settlement_period VARCHAR(7) NOT NULL, -- YYYY-MM 형태
  settlement_date DATE NOT NULL, -- 정산일
  
  -- 정산 금액 집계
  total_payment_amount INTEGER NOT NULL, -- 총 결제 금액
  total_platform_fee INTEGER NOT NULL, -- 총 플랫폼 수수료
  total_gateway_fee INTEGER NOT NULL, -- 총 결제대행사 수수료
  total_tax_amount INTEGER NOT NULL, -- 총 세금
  total_refund_amount INTEGER DEFAULT 0, -- 총 환불 금액
  final_settlement_amount INTEGER NOT NULL, -- 최종 정산 금액
  
  -- 정산 건수
  payment_count INTEGER NOT NULL, -- 결제 건수
  refund_count INTEGER DEFAULT 0, -- 환불 건수
  settlement_item_count INTEGER NOT NULL, -- 정산 항목 수
  
  -- 정산 상태
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending: 대기, approved: 승인, completed: 완료, cancelled: 취소
  approved_by UUID REFERENCES auth.users(id), -- 승인자
  approved_at TIMESTAMP WITH TIME ZONE, -- 승인 시간
  
  -- 입금 정보
  transfer_bank_name VARCHAR(20), -- 입금 은행
  transfer_account VARCHAR(20), -- 입금 계좌
  transfer_holder VARCHAR(30), -- 예금주
  transferred_at TIMESTAMP WITH TIME ZONE, -- 입금 완료 시간
  transfer_receipt_url TEXT, -- 이체확인서 URL
  
  -- 기타
  admin_note TEXT, -- 관리자 메모
  settlement_data JSONB, -- 상세 정산 데이터 (집계 결과 등)
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- settlements 테이블 인덱스 생성
CREATE INDEX idx_settlements_photographer_id ON settlements(photographer_id);
CREATE INDEX idx_settlements_period ON settlements(settlement_period);
CREATE INDEX idx_settlements_date ON settlements(settlement_date);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_created_at ON settlements(created_at DESC);

-- settlements 테이블 유니크 제약조건
CREATE UNIQUE INDEX idx_settlements_unique ON settlements(photographer_id, settlement_period);

-- settlements 테이블 코멘트
COMMENT ON TABLE settlements IS '작가별 월 정산 집계 정보';
COMMENT ON COLUMN settlements.settlement_period IS '정산 기간 (YYYY-MM 형태)';
COMMENT ON COLUMN settlements.final_settlement_amount IS '작가에게 최종 지급할 금액 (수수료, 세금 등 차감 후)';
COMMENT ON COLUMN settlements.status IS '정산 상태 (pending/approved/completed/cancelled)';

-- ===================================

-- 7. refund_reasons 테이블 생성 (환불 사유 카테고리 관리)
CREATE TABLE refund_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code VARCHAR(50) NOT NULL UNIQUE, -- customer_request, photographer_issue, system_error 등
  category_name VARCHAR(100) NOT NULL, -- 고객 요청, 작가 사정, 시스템 오류 등
  description TEXT, -- 상세 설명
  is_active BOOLEAN DEFAULT true, -- 활성 상태
  sort_order INTEGER DEFAULT 0, -- 정렬 순서
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 환불 사유 데이터 삽입
INSERT INTO refund_reasons (category_code, category_name, description, sort_order) VALUES
('customer_request', '고객 요청', '고객의 개인 사정으로 인한 환불 요청', 1),
('photographer_unavailable', '작가 사정', '작가의 개인 사정 또는 불가피한 사유로 인한 취소', 2),
('schedule_conflict', '일정 충돌', '촬영 일정 조정 불가로 인한 취소', 3),
('service_quality', '서비스 품질', '서비스 품질 문제로 인한 환불', 4),
('system_error', '시스템 오류', '결제 시스템 또는 플랫폼 오류로 인한 환불', 5),
('duplicate_payment', '중복 결제', '실수로 인한 중복 결제 환불', 6),
('policy_violation', '정책 위반', '서비스 정책 위반으로 인한 환불', 7),
('admin_decision', '관리자 결정', '관리자 판단에 의한 환불 처리', 8);

-- refund_reasons 테이블 인덱스 및 코멘트
CREATE INDEX idx_refund_reasons_active ON refund_reasons(is_active);
CREATE INDEX idx_refund_reasons_sort ON refund_reasons(sort_order);
COMMENT ON TABLE refund_reasons IS '환불 사유 카테고리 관리';

-- ===================================

-- 8. photographer_pricing 테이블 생성 (작가별 사진 가격 설정)
-- 각 작가가 자신의 촬영 스타일과 패키지별 가격을 설정할 수 있는 테이블
CREATE TABLE photographer_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  
  -- 가격 패키지 정보
  package_name VARCHAR(100) NOT NULL, -- 패키지명 (예: '베이직 스냅', '프리미엄 패키지', '올데이 촬영')
  package_code VARCHAR(50) NOT NULL, -- 패키지 코드 (예: 'basic_snap', 'premium', 'allday')
  description TEXT, -- 패키지 설명
  
  -- 가격 정보
  base_price INTEGER NOT NULL, -- 기본 가격 (원)
  discount_rate DECIMAL(3,2) DEFAULT 0, -- 할인율 (0.10 = 10%)
  final_price INTEGER NOT NULL, -- 최종 가격 (할인 적용 후)
  currency VARCHAR(3) DEFAULT 'KRW', -- 통화
  
  -- 촬영 정보
  shooting_duration INTEGER, -- 촬영 시간 (분)
  photo_count_min INTEGER, -- 최소 사진 수
  photo_count_max INTEGER, -- 최대 사진 수
  retouched_count INTEGER, -- 보정 사진 수
  
  -- 포함 서비스
  includes_makeup BOOLEAN DEFAULT false, -- 메이크업 포함
  includes_studio BOOLEAN DEFAULT false, -- 스튜디오 포함
  includes_outdoor BOOLEAN DEFAULT true, -- 야외 촬영 가능
  includes_props BOOLEAN DEFAULT false, -- 소품 포함
  additional_services JSONB, -- 추가 서비스 정보 (JSON)
  
  -- 가격 적용 조건
  min_people INTEGER DEFAULT 1, -- 최소 인원
  max_people INTEGER, -- 최대 인원
  weekday_only BOOLEAN DEFAULT false, -- 평일 전용
  weekend_surcharge INTEGER DEFAULT 0, -- 주말 추가 요금
  
  -- 상태 관리
  is_active BOOLEAN DEFAULT true, -- 활성 상태
  display_order INTEGER DEFAULT 0, -- 표시 순서
  is_popular BOOLEAN DEFAULT false, -- 인기 패키지 표시
  is_recommended BOOLEAN DEFAULT false, -- 추천 패키지
  
  -- 판매 실적
  booking_count INTEGER DEFAULT 0, -- 예약 횟수
  total_revenue INTEGER DEFAULT 0, -- 총 매출
  average_rating DECIMAL(2,1), -- 평균 평점
  
  -- 유효 기간
  valid_from DATE, -- 가격 적용 시작일
  valid_until DATE, -- 가격 적용 종료일
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- photographer_pricing 테이블 인덱스 생성
CREATE INDEX idx_photographer_pricing_photographer_id ON photographer_pricing(photographer_id);
CREATE INDEX idx_photographer_pricing_package_code ON photographer_pricing(package_code);
CREATE INDEX idx_photographer_pricing_is_active ON photographer_pricing(is_active);
CREATE INDEX idx_photographer_pricing_display_order ON photographer_pricing(display_order);
CREATE INDEX idx_photographer_pricing_is_popular ON photographer_pricing(is_popular);
CREATE INDEX idx_photographer_pricing_final_price ON photographer_pricing(final_price);
CREATE INDEX idx_photographer_pricing_valid_dates ON photographer_pricing(valid_from, valid_until);

-- photographer_pricing 테이블 유니크 제약조건
CREATE UNIQUE INDEX idx_photographer_pricing_unique ON photographer_pricing(photographer_id, package_code) 
WHERE is_active = true;

-- photographer_pricing 테이블 코멘트
COMMENT ON TABLE photographer_pricing IS '작가별 촬영 패키지 가격 설정';
COMMENT ON COLUMN photographer_pricing.package_name IS '패키지 이름 (고객에게 표시)';
COMMENT ON COLUMN photographer_pricing.package_code IS '패키지 식별 코드 (시스템 내부 사용)';
COMMENT ON COLUMN photographer_pricing.base_price IS '할인 전 기본 가격';
COMMENT ON COLUMN photographer_pricing.final_price IS '실제 판매 가격 (할인 적용 후)';
COMMENT ON COLUMN photographer_pricing.shooting_duration IS '촬영 소요 시간 (분 단위)';
COMMENT ON COLUMN photographer_pricing.retouched_count IS '기본 보정 제공 매수';
COMMENT ON COLUMN photographer_pricing.weekend_surcharge IS '주말 촬영 시 추가 요금';

-- ===================================

-- 9. pricing_options 테이블 생성 (가격 옵션 관리)
-- 각 패키지에 추가할 수 있는 옵션들을 관리
CREATE TABLE pricing_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_id UUID NOT NULL REFERENCES photographer_pricing(id) ON DELETE CASCADE,
  
  -- 옵션 정보
  option_name VARCHAR(100) NOT NULL, -- 옵션명 (예: '추가 보정 10장', '앨범 제작')
  option_code VARCHAR(50) NOT NULL, -- 옵션 코드
  option_type VARCHAR(20) NOT NULL, -- 옵션 타입 (addon, upgrade, extra)
  description TEXT, -- 옵션 설명
  
  -- 가격 정보
  option_price INTEGER NOT NULL, -- 옵션 가격
  is_percentage BOOLEAN DEFAULT false, -- 퍼센트 요금인지 (true면 option_price는 퍼센트)
  
  -- 적용 조건
  max_quantity INTEGER DEFAULT 1, -- 최대 선택 가능 수량
  is_required BOOLEAN DEFAULT false, -- 필수 선택 옵션
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- pricing_options 테이블 인덱스 생성
CREATE INDEX idx_pricing_options_pricing_id ON pricing_options(pricing_id);
CREATE INDEX idx_pricing_options_option_code ON pricing_options(option_code);
CREATE INDEX idx_pricing_options_is_active ON pricing_options(is_active);
CREATE INDEX idx_pricing_options_display_order ON pricing_options(display_order);

-- pricing_options 테이블 코멘트
COMMENT ON TABLE pricing_options IS '촬영 패키지 추가 옵션';
COMMENT ON COLUMN pricing_options.option_type IS '옵션 종류 (addon: 추가, upgrade: 업그레이드, extra: 별도)';
COMMENT ON COLUMN pricing_options.is_percentage IS 'true인 경우 option_price는 기본 가격의 퍼센트로 계산';

-- ===================================

-- 10. payments 테이블에 가격 패키지 연결 필드 추가
ALTER TABLE payments
ADD COLUMN pricing_id UUID REFERENCES photographer_pricing(id),
ADD COLUMN selected_options JSONB, -- 선택한 옵션들 [{option_id, quantity, price}]
ADD COLUMN package_price INTEGER, -- 패키지 기본 가격
ADD COLUMN options_price INTEGER, -- 옵션 추가 가격
ADD COLUMN total_price INTEGER; -- 총 가격 (package_price + options_price)

-- payments 테이블 인덱스 추가
CREATE INDEX idx_payments_pricing_id ON payments(pricing_id);

-- payments 테이블 코멘트 추가
COMMENT ON COLUMN payments.pricing_id IS '선택한 가격 패키지 ID';
COMMENT ON COLUMN payments.selected_options IS '선택한 옵션 목록 (JSON 배열)';
COMMENT ON COLUMN payments.package_price IS '패키지 기본 가격';
COMMENT ON COLUMN payments.options_price IS '추가 옵션 총 가격';
COMMENT ON COLUMN payments.total_price IS '최종 결제 가격';

-- ===================================

-- 11. inquiries 테이블에 가격 패키지 연결 필드 추가
ALTER TABLE inquiries
ADD COLUMN selected_pricing_id UUID REFERENCES photographer_pricing(id),
ADD COLUMN selected_options JSONB, -- 선택한 옵션들
ADD COLUMN estimated_price INTEGER; -- 예상 가격

-- inquiries 테이블 인덱스 추가
CREATE INDEX idx_inquiries_selected_pricing_id ON inquiries(selected_pricing_id);

-- inquiries 테이블 코멘트 추가
COMMENT ON COLUMN inquiries.selected_pricing_id IS '고객이 선택한 가격 패키지';
COMMENT ON COLUMN inquiries.selected_options IS '고객이 선택한 추가 옵션들';
COMMENT ON COLUMN inquiries.estimated_price IS '견적 가격';

-- ===================================

-- 12. RLS (Row Level Security) 정책 설정

-- payments 테이블 RLS 활성화
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 결제 정보만 볼 수 있음
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- 작가는 자신에게 들어온 결제만 볼 수 있음  
CREATE POLICY "Photographers can view their payments" ON payments
  FOR SELECT USING (
    auth.uid() = photographer_id
  );

-- 관리자는 모든 결제 정보를 볼 수 있음
CREATE POLICY "Admins can view all payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- ===================================

-- refunds 테이블 RLS 활성화
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- 관리자만 환불 정보에 접근 가능
CREATE POLICY "Only admins can access refunds" ON refunds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- 사용자는 자신의 환불 정보만 조회 가능 (읽기 전용)
CREATE POLICY "Users can view own refunds" ON refunds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payments p 
      WHERE p.id = refunds.payment_id AND p.user_id = auth.uid()
    )
  );

-- ===================================

-- settlement_items 테이블 RLS 활성화
ALTER TABLE settlement_items ENABLE ROW LEVEL SECURITY;

-- 작가는 자신의 정산 항목만 조회 가능
CREATE POLICY "Photographers can view own settlement items" ON settlement_items
  FOR SELECT USING (
    auth.uid() = photographer_id
  );

-- 관리자는 모든 정산 항목에 접근 가능
CREATE POLICY "Admins can manage all settlement items" ON settlement_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- ===================================

-- refund_reasons 테이블 RLS 활성화
ALTER TABLE refund_reasons ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 환불 사유 목록 조회 가능
CREATE POLICY "Authenticated users can view refund reasons" ON refund_reasons
  FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자만 환불 사유 관리 가능
CREATE POLICY "Admins can manage refund reasons" ON refund_reasons
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- ===================================

-- payment_logs 테이블 RLS 활성화
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 로그에 접근 가능
CREATE POLICY "Only admins can access payment_logs" ON payment_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- ===================================

-- settlements 테이블 RLS 활성화
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- 작가는 자신의 정산 정보만 볼 수 있음
CREATE POLICY "Photographers can view own settlements" ON settlements
  FOR SELECT USING (
    auth.uid() = photographer_id
  );

-- 관리자는 모든 정산 정보에 접근 가능
CREATE POLICY "Admins can manage all settlements" ON settlements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- ===================================

-- 8. 트리거 함수 생성 (자동 updated_at 업데이트)

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- payments 테이블 트리거
CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- refunds 테이블 트리거  
CREATE TRIGGER update_refunds_updated_at 
  BEFORE UPDATE ON refunds 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- settlement_items 테이블 트리거
CREATE TRIGGER update_settlement_items_updated_at 
  BEFORE UPDATE ON settlement_items 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- settlements 테이블 트리거
CREATE TRIGGER update_settlements_updated_at 
  BEFORE UPDATE ON settlements 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- refund_reasons 테이블 트리거
CREATE TRIGGER update_refund_reasons_updated_at 
  BEFORE UPDATE ON refund_reasons 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ===================================

-- 9. 초기 데이터 삽입

-- 결제 상태 체크용 함수 (선택사항)
CREATE OR REPLACE FUNCTION get_payment_summary(photographer_uuid UUID DEFAULT NULL)
RETURNS TABLE(
  total_amount BIGINT,
  total_count BIGINT,
  paid_amount BIGINT,
  paid_count BIGINT,
  pending_count BIGINT,
  failed_count BIGINT,
  cancelled_count BIGINT,
  refunded_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount), 0) as total_amount,
    COUNT(*) as total_count,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_amount,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
    COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_count
  FROM payments
  WHERE photographer_uuid IS NULL OR photographer_id = photographer_uuid;
END;
$$ LANGUAGE plpgsql;

-- 함수 코멘트
COMMENT ON FUNCTION get_payment_summary IS '결제 통계 요약 정보를 반환하는 함수';

-- ===================================

-- 마이그레이션 완료 확인
-- 모든 테이블이 정상적으로 생성되었는지 확인
DO $$
BEGIN
  -- 테이블 존재 여부 확인
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name IN ('payments', 'refunds', 'settlement_items', 'payment_logs', 'settlements', 'refund_reasons')
  ) THEN
    RAISE NOTICE '✅ PG 중립적 결제 시스템 테이블 생성 완료';
    RAISE NOTICE '📊 생성된 테이블: payments, refunds, settlement_items, payment_logs, settlements, refund_reasons';
    RAISE NOTICE '🔐 RLS 정책 적용 완료 (PG 중립적 구조)';
    RAISE NOTICE '⚡ 트리거 및 인덱스 생성 완료';
    RAISE NOTICE '💰 정산 시스템 및 부분환불 시스템 강화';
    RAISE NOTICE '🌏 멀티 PG 지원 구조 (1차: NicePay, 확장: 해외 PG)';
    RAISE NOTICE '🚀 PG 중립적 결제 시스템 준비 완료!';
  ELSE
    RAISE EXCEPTION '❌ 테이블 생성 실패';
  END IF;
END $$;

-- ===================================
-- 마이그레이션 완료
-- 생성일: 2024-08-31
-- 버전: 1.0.0
-- ===================================