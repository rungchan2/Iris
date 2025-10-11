# Database Schema - kindt (2025년 10월 최신)

## 🏗️ 전체 DB 구조 개요

### 기본 정보
- **Database Type**: PostgreSQL (Supabase) with pgvector extension
- **Project ID**: `kypwcsgwjtnkiiwjedcn`
- **Region**: ap-northeast-2

### 최근 업데이트
- **2025.10.11**: 데이터베이스 스키마 동기화 (terms.document_type 추가, inquiry_status enum 업데이트)
- **2025.10.10**: 약관 시스템 추가 (terms, terms_sections)
- **2025.10.06**: 타입 시스템 동기화 완료
- **2025.10.05**: 사용자 테이블 통합 (admins, photographers, users → users + photographers)
- **2025.09.16**: 매칭 시스템 추가 (10-question photographer matching)

## 📊 핵심 테이블 구조

### 1. 사용자 관리 시스템 (2025.10.05 업데이트)

#### `users` - 통합 사용자 테이블
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user', -- enum: 'user' | 'photographer' | 'admin'
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enum 정의
CREATE TYPE user_role AS ENUM ('user', 'photographer', 'admin');
```

**변경 사항 (2025.10.05):**
- ❌ **삭제**: `admins`, `users_old` 테이블 제거
- ✅ **통합**: 모든 사용자를 `users` 테이블로 통합
- ✅ **Role Enum**: `user_role` enum으로 역할 구분

#### `photographers` - 사진작가 상세 정보
```sql
CREATE TABLE photographers (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  phone TEXT,
  bio TEXT,
  profile_image_url TEXT,
  instagram_handle TEXT,
  website_url TEXT,
  youtube_intro_url TEXT,

  -- 프로필 정보
  years_experience INTEGER,
  birth_year INTEGER,
  gender TEXT,
  age_range TEXT,
  specialties TEXT[],
  equipment_info TEXT,
  directing_style TEXT,
  photography_approach TEXT,
  personality_type TEXT,
  studio_location TEXT,

  -- 가격 정보
  price_range_min INTEGER,
  price_range_max INTEGER,
  price_description TEXT,

  -- 승인 관련
  approval_status approval_status NOT NULL DEFAULT 'pending', -- enum: 'pending' | 'approved' | 'rejected'
  application_status TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  portfolio_submitted_at TIMESTAMPTZ,
  profile_completed BOOLEAN DEFAULT false,

  -- 정산 정보
  bank_name TEXT,
  bank_account TEXT,
  account_holder TEXT,
  settlement_ratio NUMERIC(5,2) DEFAULT 70.00,
  settlement_day INTEGER DEFAULT 10,
  tax_rate NUMERIC(5,2) DEFAULT 3.30,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enum 정의
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
```

**변경 사항 (2025.10.05):**
- ✅ **FK 변경**: `id` → `users(id)` 참조
- ✅ **Approval Enum**: `approval_status` enum 적용 (NOT NULL)
- ✅ **용도**: 사진작가 전용 상세 정보 저장

### 2. 매칭 시스템 (2025.09.16 신규)

#### `survey_questions` - 10문항 질문 마스터
```sql
CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_order INTEGER NOT NULL UNIQUE, -- 1~10
  question_key VARCHAR(50) NOT NULL UNIQUE,
  question_title TEXT NOT NULL,
  question_description TEXT,
  question_type VARCHAR(30) NOT NULL, -- 'single_choice', 'image_choice', 'textarea'
  weight_category VARCHAR(30), -- 'style_emotion', 'communication_psychology', 'purpose_story', 'companion'
  base_weight DECIMAL(4,3) NOT NULL,
  is_hard_filter BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `survey_choices` - 선택지 (임베딩 포함)
```sql
CREATE TABLE survey_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  choice_key VARCHAR(50) NOT NULL,
  choice_label TEXT NOT NULL,
  choice_description TEXT,
  choice_order INTEGER NOT NULL,
  choice_embedding vector(1536), -- OpenAI text-embedding-3-small
  embedding_generated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `survey_images` - 이미지 선택지 (Q7용)
```sql
CREATE TABLE survey_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  image_key VARCHAR(50) NOT NULL,
  image_label TEXT NOT NULL,
  image_description TEXT,
  image_url TEXT NOT NULL,
  image_order INTEGER NOT NULL,
  image_embedding vector(1536), -- 이미지 설명 기반 임베딩
  embedding_generated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `matching_sessions` - 사용자 설문 세션
```sql
CREATE TABLE matching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR(100) UNIQUE NOT NULL, -- 익명 접근용
  user_id UUID REFERENCES users(id), -- 로그인 사용자 (선택)
  responses JSONB NOT NULL, -- 질문별 응답
  subjective_text TEXT, -- Q10 주관식
  subjective_embedding vector(1536), -- Q10 실시간 임베딩
  final_user_embedding vector(1536), -- 가중 평균 결과
  completed_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `photographer_profiles` - 4차원 작가 프로필
```sql
CREATE TABLE photographer_profiles (
  photographer_id UUID PRIMARY KEY REFERENCES photographers(id) ON DELETE CASCADE,

  -- 서비스 기본 정보 (하드 필터용)
  service_regions TEXT[] NOT NULL DEFAULT '{}',
  price_min INTEGER NOT NULL DEFAULT 100000,
  price_max INTEGER NOT NULL DEFAULT 500000,
  companion_types TEXT[] NOT NULL DEFAULT '{}',

  -- 4차원 프로필 설명
  style_emotion_description TEXT, -- 40% 가중치
  communication_psychology_description TEXT, -- 30% 가중치
  purpose_story_description TEXT, -- 20% 가중치
  companion_description TEXT, -- 10% 가중치

  -- 4차원 임베딩
  style_emotion_embedding vector(1536),
  communication_psychology_embedding vector(1536),
  purpose_story_embedding vector(1536),
  companion_embedding vector(1536),

  embeddings_generated_at TIMESTAMPTZ,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `photographer_keywords` - 전문 키워드 (하드 필터 + 보너스 점수)
```sql
CREATE TABLE photographer_keywords (
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  keyword VARCHAR(50) NOT NULL,
  proficiency_level INTEGER DEFAULT 1, -- 1-5 전문도
  portfolio_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(photographer_id, keyword)
);
```

#### `matching_results` - 4차원 매칭 결과
```sql
CREATE TABLE matching_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES matching_sessions(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,

  -- 4차원 점수 (딥러닝 입력 특성)
  style_emotion_score DECIMAL(5,2) NOT NULL,
  communication_psychology_score DECIMAL(5,2) NOT NULL,
  purpose_story_score DECIMAL(5,2) NOT NULL,
  companion_score DECIMAL(5,2) NOT NULL,
  keyword_bonus DECIMAL(5,2) DEFAULT 0,
  total_score DECIMAL(5,2) NOT NULL,
  rank_position INTEGER NOT NULL,

  -- 사용자 행동 (딥러닝 라벨 데이터)
  viewed_at TIMESTAMPTZ,    -- 결과 확인
  clicked_at TIMESTAMPTZ,   -- 작가 클릭 ⭐ 핵심 라벨
  contacted_at TIMESTAMPTZ, -- 문의 전송 ⭐ 핵심 라벨

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. 예약/결제 시스템

#### `products` - 사진 패키지 상품
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES photographers(id),

  -- 상품 기본 정보
  name TEXT NOT NULL,
  product_code TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],

  -- 가격 정보
  price INTEGER NOT NULL,
  weekend_surcharge INTEGER DEFAULT 0,
  holiday_surcharge INTEGER DEFAULT 0,

  -- 촬영 정보
  shooting_duration INTEGER NOT NULL, -- 촬영 시간(분)
  photo_count_min INTEGER NOT NULL, -- 최소 사진 수
  photo_count_max INTEGER, -- 최대 사진 수
  retouched_count INTEGER, -- 보정 사진 수
  max_participants INTEGER, -- 최대 인원

  -- 서비스 옵션
  location_type TEXT, -- 'studio', 'outdoor', 'both'
  includes_makeup BOOLEAN DEFAULT false,
  includes_styling BOOLEAN DEFAULT false,
  includes_props BOOLEAN DEFAULT false,

  -- 승인 시스템
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'inactive'
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  -- 표시 설정
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `inquiries` - 예약 문의
```sql
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID REFERENCES photographers(id),
  product_id UUID REFERENCES products(id),
  user_id UUID REFERENCES users(id),

  -- 고객 정보
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT,
  instagram_id TEXT,

  -- 예약 정보
  desired_date DATE,
  selected_slot_id UUID REFERENCES available_slots(id),
  people_count INTEGER,
  relationship TEXT, -- 동반자 관계

  -- 추가 정보
  shooting_meaning TEXT, -- 촬영 목적
  conversation_preference TEXT,
  conversation_topics TEXT,
  favorite_music TEXT,
  special_request TEXT,
  difficulty_note TEXT,

  -- 상태 관리
  status inquiry_status DEFAULT 'new', -- enum: 'new' | 'contacted' | 'completed' | 'cancelled' | 'pending_payment' | 'payment_failed' | 'reserved' | 'expired'
  admin_note TEXT,
  deleted_at TIMESTAMPTZ,

  -- 결제 정보
  payment_id UUID REFERENCES payments(id),
  payment_required BOOLEAN DEFAULT false,
  payment_status TEXT,
  payment_amount INTEGER,
  payment_deadline TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `available_slots` - 촬영 예약 가능 시간
```sql
CREATE TABLE available_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES photographers(id), -- 작가 ID

  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER,

  is_available BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `payments` - 결제 정보
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,

  -- 연결 정보
  user_id UUID REFERENCES users(id),
  photographer_id UUID REFERENCES photographers(id),
  product_id UUID REFERENCES products(id),
  inquiry_id UUID REFERENCES inquiries(id),

  -- 결제 금액
  amount INTEGER NOT NULL,
  total_price INTEGER,
  currency TEXT DEFAULT 'KRW',

  -- PG사 정보
  provider TEXT NOT NULL DEFAULT 'tosspayments',
  provider_transaction_id TEXT,
  payment_method TEXT, -- 'card', 'transfer', 'vbank', 'mobile', 'wallet'

  -- 상태 정보
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'cancelled'
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  error_message TEXT,

  -- 구매자 정보
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_tel TEXT,

  -- 결제 수단 상세
  card_info JSONB, -- 카드 정보
  bank_info JSONB, -- 계좌이체 정보
  wallet_info JSONB, -- 간편결제 정보

  -- 상품 정보
  product_options JSONB,

  -- 기타
  receipt_url TEXT,
  raw_response JSONB,
  admin_memo TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `payment_logs` - 결제 로그
```sql
CREATE TABLE payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),

  event_type TEXT NOT NULL, -- 'request', 'approval', 'webhook', 'error'
  provider TEXT NOT NULL DEFAULT 'tosspayments',
  event_data JSONB,

  http_status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,

  ip_address INET,
  user_agent TEXT,
  referer TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `refunds` - 환불 정보
```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),

  -- 환불 금액
  original_amount INTEGER NOT NULL,
  refund_amount INTEGER NOT NULL,
  remaining_amount INTEGER NOT NULL,

  -- 환불 사유
  refund_category TEXT NOT NULL, -- 'customer_request', 'photographer_cancel', 'quality_issue'
  refund_reason TEXT NOT NULL,
  refund_type TEXT NOT NULL, -- 'full', 'partial'
  reason TEXT, -- 추가 사유

  -- PG사 정보
  provider TEXT NOT NULL DEFAULT 'tosspayments',
  provider_refund_id TEXT,
  refund_response JSONB,

  -- 환불 계좌 정보 (가상계좌 환불시)
  refund_bank_code TEXT,
  refund_account TEXT,
  refund_holder TEXT,

  -- 상태 정보
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  requested_by UUID REFERENCES users(id),
  requested_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ,

  admin_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `settlements` - 작가 정산
```sql
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES photographers(id),

  -- 정산 기간
  settlement_period TEXT NOT NULL, -- 'YYYY-MM'
  settlement_date DATE NOT NULL,

  -- 정산 금액 계산
  payment_count INTEGER NOT NULL,
  settlement_item_count INTEGER NOT NULL,
  total_payment_amount INTEGER NOT NULL,
  total_platform_fee INTEGER NOT NULL,
  total_gateway_fee INTEGER NOT NULL,
  total_tax_amount INTEGER NOT NULL,
  total_refund_amount INTEGER DEFAULT 0,
  refund_count INTEGER DEFAULT 0,
  final_settlement_amount INTEGER NOT NULL,

  -- 정산 상세 데이터
  settlement_data JSONB,

  -- 송금 정보
  transfer_bank_name TEXT,
  transfer_account TEXT,
  transfer_holder TEXT,
  transfer_receipt_url TEXT,

  -- 상태 정보
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'transferred', 'cancelled'
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  transferred_at TIMESTAMPTZ,

  admin_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `settlement_items` - 정산 항목
```sql
CREATE TABLE settlement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES photographers(id),
  payment_id UUID NOT NULL REFERENCES payments(id),

  -- 금액 분해
  payment_amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  platform_fee_rate DECIMAL(5,2) NOT NULL,
  payment_gateway_fee INTEGER NOT NULL,
  tax_amount INTEGER NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL,
  settlement_amount INTEGER NOT NULL,

  -- 정산 상태
  settlement_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'settled'
  settled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `reviews` - 리뷰 시스템
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id),
  review_token TEXT UNIQUE NOT NULL, -- 익명 접근용

  -- 리뷰 내용
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT[], -- 리뷰 사진 URLs

  -- 작성자 정보
  reviewer_name TEXT,
  is_anonymous BOOLEAN DEFAULT true,

  -- 상태 정보
  is_submitted BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. 갤러리 시스템

#### `categories` - 카테고리 (계층 구조)
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id),

  name TEXT NOT NULL,
  path TEXT, -- 계층 경로 (예: '/wedding/outdoor')
  depth INTEGER DEFAULT 0,

  representative_image_id UUID REFERENCES photos(id),
  representative_image_url TEXT,

  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `photos` - 사진 관리 (임베딩 추가)
```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID REFERENCES photographers(id),

  -- 파일 정보
  filename TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- 메타데이터
  title TEXT,
  description TEXT,
  style_tags TEXT[],

  -- 이미지 정보
  width INTEGER,
  height INTEGER,
  size_kb INTEGER,

  -- 임베딩 (매칭 시스템용)
  image_embedding vector(1536),
  embedding_generated_at TIMESTAMPTZ,

  -- 표시 설정
  display_order INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_representative BOOLEAN DEFAULT false,

  view_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `photo_categories` - 사진-카테고리 매핑
```sql
CREATE TABLE photo_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. 스토리 시스템

#### `stories` - 사용자 스토리
```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_token TEXT NOT NULL, -- 익명 접근용

  -- 스토리 내용
  body TEXT NOT NULL,
  images TEXT[], -- 스토리 이미지 URLs
  author_name TEXT,

  -- 연락처 정보
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_instagram TEXT NOT NULL,

  -- 제출 정보
  privacy_agreed BOOLEAN NOT NULL DEFAULT false,
  writing_duration_sec INTEGER, -- 작성 시간(초)
  ip_address INET NOT NULL,
  user_agent TEXT,
  submitted_from_url TEXT,

  -- 검수 정보
  moderation_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  moderation_note TEXT,
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,

  -- 스팸 감지
  is_suspicious BOOLEAN DEFAULT false,
  suspicious_reason TEXT,

  -- 표시 설정
  visibility TEXT DEFAULT 'public', -- 'public', 'hidden'
  is_featured BOOLEAN DEFAULT false,

  -- 통계
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `coupons` - 쿠폰 시스템
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES coupon_templates(id),

  code TEXT UNIQUE NOT NULL,

  -- 발급 정보
  user_id UUID REFERENCES users(id),
  session_token TEXT, -- 익명 사용자용
  story_id UUID REFERENCES stories(id),
  issued_reason TEXT NOT NULL, -- 'story_submission', 'event', 'promotion'

  -- 유효 기간
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,

  -- 사용 정보
  status TEXT DEFAULT 'active', -- 'active', 'used', 'expired'
  used_at TIMESTAMPTZ,
  payment_id UUID REFERENCES payments(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `coupon_templates` - 쿠폰 템플릿
```sql
CREATE TABLE coupon_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  code_prefix TEXT NOT NULL, -- 'STORY', 'EVENT', etc.

  -- 할인 정보
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
  discount_value INTEGER NOT NULL,
  max_discount_amount INTEGER,
  min_purchase_amount INTEGER,

  -- 유효 설정
  valid_days INTEGER NOT NULL, -- 발급 후 유효 일수
  terms_description TEXT,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. 딥러닝 데이터 수집 테이블

#### `user_feedback` - 만족도 피드백 (딥러닝 라벨)
```sql
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES matching_sessions(id),
  photographer_id UUID REFERENCES photographers(id),

  feedback_type TEXT NOT NULL, -- 'matching_quality', 'booking_experience'

  -- 피드백 점수 (딥러닝 핵심 라벨)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 만족도 점수
  feedback_text TEXT,

  -- 실제 행동 결과 (최종 성공 지표)
  was_contacted BOOLEAN DEFAULT false,
  was_booked BOOLEAN DEFAULT false,    -- ⭐ 최종 목표 라벨
  would_recommend BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `matching_performance_logs` - 시스템 성능 추적
```sql
CREATE TABLE matching_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES matching_sessions(id),

  -- 성능 지표
  total_candidates INTEGER,
  embedding_calculation_ms INTEGER,
  total_processing_ms INTEGER,

  -- 사용된 설정 (A/B 테스트 준비)
  weight_config_used JSONB,
  algorithm_version VARCHAR(20) DEFAULT 'v1.0',

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. 관리자 도구

#### `embedding_jobs` - 임베딩 재생성 큐
```sql
CREATE TABLE embedding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL, -- 'choice_embedding', 'image_embedding', 'photographer_profile'
  target_id UUID NOT NULL,
  job_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  requested_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `system_settings` - 시스템 설정
```sql
CREATE TABLE system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value JSONB NOT NULL,
  setting_description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. 약관 시스템 (2025.10.10 신규)

#### `terms` - 약관 버전 관리
```sql
CREATE TABLE terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL, -- 버전 번호 (예: '1.0', '1.1')
  document_type TEXT DEFAULT 'terms_of_service', -- 문서 타입 (예: 'terms_of_service', 'privacy_policy', 'photographer_terms')
  effective_date DATE NOT NULL, -- 약관 시행일
  is_active BOOLEAN DEFAULT true, -- 현재 활성 약관 여부
  created_by UUID REFERENCES users(id), -- 약관 작성자 (관리자)
  updated_by UUID REFERENCES users(id), -- 약관 수정자
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `terms_sections` - 약관 조항 내용
```sql
CREATE TABLE terms_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terms_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  article_number INTEGER NOT NULL, -- 조항 번호 (예: 1, 2, 3)
  title TEXT NOT NULL, -- 조항 제목 (예: '제1조 (목적)')
  content TEXT NOT NULL, -- 조항 내용
  display_order INTEGER NOT NULL, -- 표시 순서
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎯 매칭 알고리즘 구조

### 4차원 가중치 분배
- **스타일/감성 (40%)**: Q6 키워드(0.15) + Q7 이미지(0.15) + Q8 빛(0.05) + Q9 로케이션(0.05)
- **소통/심리 (30%)**: Q3 편안함(0.1) + Q4 분위기(0.1) + Q5 몰입(0.1)
- **목적/스토리 (20%)**: Q1 목적(0.15) + Q10 주관식(0.05)
- **동반자 (10%)**: Q2 동반자(0.1) - 하드 필터 겸용

### 매칭 파이프라인
1. **하드 필터링**: 지역, 예산, 동반자, 키워드 호환성
2. **4차원 유사도**: pgvector 코사인 유사도 계산
3. **키워드 보너스**: 1개(50%) → 2개(70%) → 3개+(100%)
4. **최종 순위**: 가중 점수 기반 정렬

## 🧠 딥러닝 데이터 수집 전략

### 핵심 수집 데이터
1. **입력 특성**: 4차원 점수, 순위, 키워드 보너스, 사용자 응답
2. **중간 라벨**: clicked_at (클릭 여부), contacted_at (문의 여부)
3. **최종 라벨**: was_booked (예약 완료), rating (만족도 1-5점)

### 학습 목표 (단계별)
- **V2**: 클릭 확률 예측 모델
- **V3**: 만족도 예측 + 가중치 자동 튜닝
- **V4**: 개인화 추천 시스템

## 🔐 RLS 정책 (익명 지원)

### 비로그인 접근 가능
- `survey_questions`, `survey_choices`, `survey_images`: 활성 항목 조회
- `matching_sessions`: 세션 생성 및 토큰 기반 접근
- `matching_results`: 토큰 기반 결과 조회
- `photographer_profiles`: 완성된 프로필 조회

### 권한별 접근 제어
- **일반 사용자**: 본인 데이터 조회/수정
- **사진작가**: 본인 프로필/키워드/예약 관리
- **관리자**: 모든 질문/프로필 관리, 매칭 분석 조회

## 📈 성능 최적화

### pgvector 인덱스
```sql
-- 임베딩 검색 최적화
CREATE INDEX idx_survey_choices_embedding ON survey_choices
  USING ivfflat (choice_embedding vector_cosine_ops);

CREATE INDEX idx_photographer_profiles_style_embedding ON photographer_profiles
  USING ivfflat (style_emotion_embedding vector_cosine_ops);

CREATE INDEX idx_photographer_profiles_comm_embedding ON photographer_profiles
  USING ivfflat (communication_psychology_embedding vector_cosine_ops);

CREATE INDEX idx_photographer_profiles_purpose_embedding ON photographer_profiles
  USING ivfflat (purpose_story_embedding vector_cosine_ops);

CREATE INDEX idx_photographer_profiles_companion_embedding ON photographer_profiles
  USING ivfflat (companion_embedding vector_cosine_ops);

CREATE INDEX idx_photos_image_embedding ON photos
  USING ivfflat (image_embedding vector_cosine_ops);
```

### 기본 인덱스
```sql
-- 매칭 시스템
CREATE INDEX idx_matching_sessions_token ON matching_sessions(session_token);
CREATE INDEX idx_matching_sessions_user ON matching_sessions(user_id);
CREATE INDEX idx_matching_results_session ON matching_results(session_id);
CREATE INDEX idx_matching_results_photographer ON matching_results(photographer_id);
CREATE INDEX idx_photographer_keywords_keyword ON photographer_keywords(keyword);

-- 예약/결제 시스템
CREATE INDEX idx_inquiries_photographer ON inquiries(photographer_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_settlements_photographer ON settlements(photographer_id);

-- 갤러리 시스템
CREATE INDEX idx_photos_photographer ON photos(uploaded_by);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

## 🎯 핵심 특징

**매칭 시스템**:
- pgvector 기반 semantic similarity search
- 4차원 프로필 시스템으로 정교한 매칭
- 익명 사용자도 전체 매칭 플로우 이용 가능

**데이터 수집**:
- 딥러닝을 위한 체계적인 사용자 행동 추적
- 클릭/문의/예약 단계별 전환 분석
- 실시간 성능 모니터링

**확장성**:
- V2/V3 딥러닝 모델을 위한 데이터 기반 구축
- 관리자 도구를 통한 실시간 시스템 조정
- A/B 테스트를 위한 기반 인프라 준비

## 📊 테이블 목록

### 사용자 관리
- `users` - 통합 사용자 테이블
- `photographers` - 사진작가 상세 정보

### 매칭 시스템
- `survey_questions` - 설문 질문
- `survey_choices` - 선택지
- `survey_images` - 이미지 선택지
- `matching_sessions` - 설문 세션
- `photographer_profiles` - 4차원 작가 프로필
- `photographer_keywords` - 전문 키워드
- `matching_results` - 매칭 결과

### 예약/결제
- `products` - 사진 패키지 상품
- `inquiries` - 예약 문의
- `available_slots` - 예약 가능 시간
- `payments` - 결제 정보
- `payment_logs` - 결제 로그
- `refunds` - 환불 정보
- `settlements` - 작가 정산
- `settlement_items` - 정산 항목
- `reviews` - 리뷰

### 갤러리
- `categories` - 카테고리
- `photos` - 사진
- `photo_categories` - 사진-카테고리 매핑

### 스토리/쿠폰
- `stories` - 사용자 스토리
- `coupons` - 쿠폰
- `coupon_templates` - 쿠폰 템플릿

### 분석/관리
- `user_feedback` - 사용자 피드백
- `matching_performance_logs` - 성능 로그
- `embedding_jobs` - 임베딩 작업 큐
- `system_settings` - 시스템 설정

### 약관 시스템
- `terms` - 약관 버전 관리
- `terms_sections` - 약관 조항 내용
