# Database Schema - Iris (2025년 8월 최신)

## 🏗️ 전체 DB 구조 개요

### 기본 정보
- **Database Type**: PostgreSQL (Supabase)
- **Project ID**: `kypwcsgwjtnkiiwjedcn`
- **Region**: ap-northeast-2
- **Major Update**: 2025년 8월 31일 - 결제 시스템 및 상품 관리 통합

### 최신 변경사항 (2025.08.31)
- **결제 시스템**: Multi-PG 지원 (NicePay, Eximbay, Adyen, Stripe, Toss 호환)
- **상품 관리**: `photographer_pricing` + `pricing_options` → `products` 테이블로 통합
- **사용자 시스템**: 일반 사용자 테이블 추가 (`users`)
- **승인 워크플로우**: 작가 생성 → 관리자 승인 구조

## 🔐 핵심 아키텍처 변경사항 (2025.08)

### 사용자 시스템 완전 재구성 (2단계 구조)
- **이전**: `photographers` 단일 테이블로 모든 사용자 관리
- **현재**: `admins`(관리자)와 `photographers`(작가) 완전 분리
- **권한 시스템**: 간소화된 2단계 RBAC (Admin → Photographer)
- **인증 방식**: 로그인 시 사용자 타입 자동 감지 및 권한별 리디렉션

## 📊 핵심 테이블 구조

### 1. 사용자 관리 시스템 (RBAC 기반)

#### `admins` - 시스템 관리자 (신규)
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role = 'admin'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- 인덱스
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_active ON admins(is_active);
```

**권한 체계 (간소화):**
- `admin`: 모든 시스템 권한 (사용자 생성/삭제, 사진 관리, 문의 처리, 시스템 설정 등)

#### `photographers` - 작가 정보 (기존 photographers에서 분리)
```sql
CREATE TABLE photographers (
  -- 기본 정보 (photographers에서 상속)
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 승인 시스템
  approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- 작가 프로필 정보
  phone VARCHAR,
  website_url TEXT,
  instagram_handle VARCHAR,
  gender VARCHAR CHECK (gender IN ('male', 'female', 'other')),
  birth_year INT,
  age_range VARCHAR,
  years_experience INT,
  specialties TEXT[],
  studio_location TEXT,
  equipment_info TEXT,
  bio TEXT,

  -- 가격 정보
  price_range_min INT,
  price_range_max INT,
  price_description TEXT,

  -- 지원서 상태
  application_status TEXT DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected')),
  portfolio_submitted_at TIMESTAMPTZ,
  profile_completed BOOLEAN DEFAULT false
);

-- 인덱스
CREATE INDEX idx_photographers_approval_status ON photographers(approval_status);
CREATE INDEX idx_photographers_application_status ON photographers(application_status);
CREATE INDEX idx_photographers_email ON photographers(email);
```

### 2. RBAC 권한 매트릭스

#### 권한 정의 (TypeScript) - 2단계 구조
```typescript
type Permission = 
  // 사용자 관리
  | 'users.create' | 'users.read' | 'users.update' | 'users.delete'
  // 사진 관리
  | 'photos.create' | 'photos.read' | 'photos.update' | 'photos.delete'
  // 카테고리 관리
  | 'categories.create' | 'categories.read' | 'categories.update' | 'categories.delete'
  // 문의 관리
  | 'inquiries.read' | 'inquiries.update' | 'inquiries.delete'
  // 일정 관리
  | 'schedule.create' | 'schedule.read' | 'schedule.update' | 'schedule.delete'
  // 시스템 설정
  | 'system.config' | 'system.logs'
  // 통계 및 분석
  | 'analytics.read'

type UserRole = 'admin' | 'photographer'
```

#### 역할별 권한 매트릭스 (2단계)
| 권한 | admin | photographer |
|------|-------|-------------|
| users.create | ✅ | ❌ |
| users.read | ✅ | ❌ |
| users.update | ✅ | 본인만 |
| users.delete | ✅ | ❌ |
| photos.* | ✅ | 본인 것만 |
| categories.* | ✅ | 읽기만 |
| inquiries.* | ✅ | 본인 관련만 |
| schedule.* | ✅ | 본인 것만 |
| system.* | ✅ | ❌ |
| analytics.read | ✅ | 제한적 |

### 3. ~~성향 진단 시스템~~ (2025.09.15 삭제)

**삭제된 테이블들:**
- ~~`personality_types`~~ - 성격유형 정의 (삭제됨)
- ~~`quiz_questions`~~ - 설문 질문 (삭제됨)
- ~~`quiz_choices`~~ - 질문별 선택지 (삭제됨)
- ~~`choice_weights`~~ - 선택지별 성격유형 가중치 (삭제됨)
- ~~`quiz_sessions`~~ - 진단 세션 추적 (삭제됨)
- ~~`quiz_responses`~~ - 사용자 응답 저장 (삭제됨)

**Note**: 2025년 9월 15일 가중치 관련 테이블들이 모두 삭제되었습니다. Quiz 페이지 UI는 유지되지만 기능은 제거되었습니다.

### 4. ~~매칭 시스템~~ (2025.09.15 삭제)

**삭제된 테이블들:**
- ~~`personality_admin_mapping`~~ - 성격유형별 작가 매칭 (삭제됨)
- ~~`personality_photos`~~ - 성격유형별 추천 사진 갤러리 (삭제됨)

**Note**: 성향 진단 시스템 삭제와 함께 관련 매칭 테이블들도 제거되었습니다.

### 5. AI 이미지 생성

#### `ai_image_generations` - AI 이미지 생성 전 과정 추적
```sql
CREATE TABLE ai_image_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_session_id UUID, -- quiz_sessions 테이블 삭제로 참조 제거
  personality_code VARCHAR(10), -- personality_types 테이블 삭제로 참조 제거
  user_uploaded_image_url TEXT NOT NULL,
  generated_prompt TEXT NOT NULL,
  api_provider TEXT CHECK (api_provider IN ('openai_dalle', 'runway', 'midjourney')),
  api_request_payload JSONB,
  api_response_data JSONB,
  generated_image_url TEXT,
  generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  processing_time_seconds INT,
  user_rating INT CHECK (user_rating >= 1 AND user_rating <= 5),
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Note**: quiz_session_id와 personality_code의 외래키 참조가 제거되었으나 컬럼은 유지됩니다.

### 6. 예약 시스템 (기존 유지)

#### `available_slots` - 예약 가능 시간
```sql
CREATE TABLE available_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT DEFAULT 45,
  is_available BOOLEAN DEFAULT true,
  admin_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `inquiries` - 문의/예약 정보
```sql
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- 성향 진단 관련 컬럼들 (참조 제거됨)
  quiz_session_id UUID, -- quiz_sessions 테이블 삭제로 참조 제거
  selected_personality_code VARCHAR(10), -- personality_types 테이블 삭제로 참조 제거
  matched_admin_id UUID REFERENCES photographers(id),
  selected_slot_id UUID REFERENCES available_slots(id),
  ai_generation_id UUID REFERENCES ai_image_generations(id),

  -- 기존 컬럼들
  instagram_id TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  desired_date DATE,
  people_count INT,
  relationship TEXT,
  current_mood_keywords TEXT[],
  desired_mood_keywords TEXT[],
  special_request TEXT,
  difficulty_note TEXT,
  selected_category_id UUID REFERENCES categories(id),
  selection_path TEXT[],
  selection_history JSONB,
  
  -- 추가 필드 (2025.08.24)
  conversation_preference VARCHAR,
  conversation_topics VARCHAR,
  favorite_music VARCHAR,
  shooting_meaning VARCHAR,
  photographer_id UUID REFERENCES photographers(id),
  product_id UUID REFERENCES products(id),
  user_id UUID REFERENCES users(id),

  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'reserved', 'completed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. 리뷰 시스템 (2025.08.18 추가)

#### `reviews` - 익명 리뷰 시스템
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  review_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  reviewer_name VARCHAR(100),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT[], -- Array of photo URLs
  is_public BOOLEAN DEFAULT true,
  is_anonymous BOOLEAN DEFAULT false,
  is_submitted BOOLEAN DEFAULT false, -- Track if review is completed
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'), -- Token expiration
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_reviews_inquiry_id ON reviews(inquiry_id);
CREATE INDEX idx_reviews_token ON reviews(review_token);
CREATE INDEX idx_reviews_public ON reviews(is_public) WHERE is_public = true;
CREATE INDEX idx_reviews_submitted ON reviews(is_submitted);
```

**주요 특징:**
- 토큰 기반 익명 접근 (`review_token`)
- 30일 만료 기간 설정
- 공개/비공개, 익명/실명 옵션
- 1회용 링크 (제출 후 재사용 불가)

### 8. 결제 시스템 (2025.08.31 추가)

#### `users` - 일반 사용자 (고객)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 기본 프로필
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) UNIQUE,
  
  -- 추가 정보
  birth_year INTEGER,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  profile_image_url TEXT,
  
  -- 통계
  total_bookings INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_booking_at TIMESTAMPTZ,
  
  -- 설정
  marketing_consent BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `products` - 통합 촬영 상품 관리 (photographer_pricing + pricing_options 통합)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  name VARCHAR(100) NOT NULL,
  description TEXT,
  product_code VARCHAR(50) NOT NULL,
  
  -- 가격 정보
  price INTEGER NOT NULL, -- 기본 가격 (원 단위)
  weekend_surcharge INTEGER DEFAULT 0,
  holiday_surcharge INTEGER DEFAULT 0,
  
  -- 촬영 상세 옵션
  shooting_duration INTEGER NOT NULL, -- 촬영 시간 (분)
  photo_count_min INTEGER NOT NULL,
  photo_count_max INTEGER,
  retouched_count INTEGER DEFAULT 0,
  
  -- 부가 서비스
  includes_makeup BOOLEAN DEFAULT false,
  includes_styling BOOLEAN DEFAULT false,
  includes_props BOOLEAN DEFAULT false,
  
  -- 관리 정보
  photographer_id UUID NOT NULL REFERENCES photographers(id),
  created_by UUID NOT NULL REFERENCES photographers(id),
  approved_by UUID REFERENCES admins(id),
  
  -- 승인 시스템
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'inactive')),
  approval_notes TEXT,
  
  -- 메타데이터
  category VARCHAR(50),
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  
  UNIQUE(photographer_id, product_code)
);
```

#### `payments` - PG 중립적 결제 시스템
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 주문 정보
  order_id VARCHAR(100) UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- 원 단위
  currency VARCHAR(3) DEFAULT 'KRW',
  
  -- 연결 정보
  user_id UUID REFERENCES users(id),
  photographer_id UUID REFERENCES photographers(id),
  inquiry_id UUID REFERENCES inquiries(id),
  product_id UUID REFERENCES products(id),
  
  -- PG 정보 (중립적)
  provider VARCHAR(20) NOT NULL DEFAULT 'nicepay',
  provider_transaction_id VARCHAR(100),
  payment_method VARCHAR(20),
  
  -- 구매자 정보
  buyer_name VARCHAR(100),
  buyer_email VARCHAR(255),
  buyer_tel VARCHAR(20),
  
  -- 결제 상태
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- PG 응답 데이터
  raw_response JSONB,
  card_info JSONB,
  bank_info JSONB,
  wallet_info JSONB,
  
  -- 기타
  receipt_url TEXT,
  error_message TEXT,
  admin_memo TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `refunds` - 환불 관리
```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  
  -- 환불 정보
  refund_type VARCHAR(20) CHECK (refund_type IN ('full', 'partial')),
  refund_category VARCHAR(50) NOT NULL,
  refund_reason TEXT NOT NULL,
  original_amount INTEGER NOT NULL,
  refund_amount INTEGER NOT NULL,
  remaining_amount INTEGER NOT NULL,
  
  -- PG 처리
  provider VARCHAR(20) NOT NULL,
  provider_refund_id VARCHAR(100),
  refund_response JSONB,
  
  -- 계좌 정보 (계좌이체 환불시)
  refund_holder VARCHAR(100),
  refund_account VARCHAR(50),
  refund_bank_code VARCHAR(10),
  
  -- 처리 상태
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  requested_by UUID,
  processed_by UUID,
  
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
  settlement_date DATE NOT NULL,
  settlement_period VARCHAR(20) NOT NULL, -- 'YYYY-MM'
  
  -- 금액 계산
  total_payment_amount INTEGER NOT NULL,
  total_platform_fee INTEGER NOT NULL,
  total_gateway_fee INTEGER NOT NULL,
  total_tax_amount INTEGER NOT NULL,
  final_settlement_amount INTEGER NOT NULL,
  
  -- 통계
  payment_count INTEGER NOT NULL,
  settlement_item_count INTEGER NOT NULL,
  refund_count INTEGER DEFAULT 0,
  total_refund_amount INTEGER DEFAULT 0,
  
  -- 상태
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'transferred', 'completed')),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  transferred_at TIMESTAMPTZ,
  
  -- 계좌 정보
  transfer_holder VARCHAR(100),
  transfer_bank_name VARCHAR(50),
  transfer_account VARCHAR(50),
  transfer_receipt_url TEXT,
  
  settlement_data JSONB, -- 상세 정산 내역
  admin_note TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9. 기존 시스템 (레거시 유지)

#### `photos` - 사진 파일 관리
```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INT,
  height INT,
  size_kb INT,
  uploaded_by UUID REFERENCES photographers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `photo_categories` - 사진-카테고리 연결
```sql
CREATE TABLE photo_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `categories` - 카테고리 시스템
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  depth INT CHECK (depth >= 1 AND depth <= 10),
  path TEXT,
  display_order INT,
  is_active BOOLEAN DEFAULT true,
  representative_image_url TEXT,
  representative_image_id UUID REFERENCES photos(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `keywords` - 무드 키워드 시스템
```sql
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔍 핵심 쿼리 패턴

### 사용자 타입 자동 감지 (로그인 시)
```sql
-- 1단계: admins 테이블에서 확인
SELECT id, role FROM admins WHERE id = $1;

-- 2단계: 없으면 photographers 테이블에서 확인
SELECT id, approval_status FROM photographers WHERE id = $1;
```

### 권한 기반 네비게이션 필터링
```sql
-- 사용자 권한에 따른 메뉴 표시
WITH user_permissions AS (
  SELECT role FROM admins WHERE id = $1
  UNION
  SELECT 'photographer' as role FROM photographers WHERE id = $1
)
SELECT menu_items.*
FROM navigation_permissions np
JOIN user_permissions up ON np.required_role = up.role
JOIN menu_items mi ON np.menu_id = mi.id;
```

### ~~성향 진단 점수 계산~~ (삭제됨)
관련 테이블들이 삭제되어 더 이상 사용되지 않습니다.

### ~~작가 매칭 로직~~ (삭제됨)
personality_admin_mapping 테이블이 삭제되어 더 이상 사용되지 않습니다.

## 🔐 RLS (Row Level Security) 정책

### 공개 접근 허용 (익명 사용자)
```sql
-- AI 이미지 생성 (생성 및 읽기)
ALTER TABLE ai_image_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own generations" ON ai_image_generations
  FOR ALL USING (true); -- quiz_sessions 테이블 삭제로 인해 정책 단순화
```

**Note**: 성향 진단 관련 테이블들이 삭제되어 해당 RLS 정책들도 제거되었습니다.

### 관리자 권한 (RBAC 기반)
```sql
-- Admins 테이블 접근 제어
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view their own profile or other admins can view all" ON admins
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid() AND admins.role = 'admin'
    )
  );

CREATE POLICY "Only admins can manage admin users" ON admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid() AND admins.role = 'admin'
    )
  );

-- Photographers 테이블 접근 제어
ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photographers can update their own profile" ON photographers
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage photographers" ON photographers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );
```

### 사진 및 콘텐츠 관리
```sql
-- 사진 관리 권한
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photographers can manage their own photos" ON photos
  FOR ALL USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all photos" ON photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );
```

## 📈 성능 최적화 인덱스

```sql
-- 사용자 관리 관련
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_photographers_approval ON photographers(approval_status);
CREATE INDEX idx_photographers_application ON photographers(application_status);

-- 성향 진단 관련 인덱스 (삭제됨)
-- 관련 테이블들이 모두 삭제되어 인덱스도 제거되었습니다.

-- AI 이미지 생성 관련
CREATE INDEX idx_ai_generations_session_id ON ai_image_generations(quiz_session_id);
CREATE INDEX idx_ai_generations_status ON ai_image_generations(generation_status);

-- 예약 시스템 관련
CREATE INDEX idx_available_slots_admin_date ON available_slots(admin_id, date);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_personality ON inquiries(selected_personality_code);
```

## 🔄 마이그레이션 이력

### 2025년 9월 15일 - 초대 코드 시스템 제거
1. **테이블 삭제**:
   - `admin_invite_codes` 테이블 완전 제거
   - 초대 코드 기반 가입 시스템 폐기

2. **코드 정리**:
   - `lib/actions/admin-auth.ts` 파일 완전 삭제
   - `components/admin/invite-code-manager.tsx` 컴포넌트 제거
   - `components/admin/admin-signup-form.tsx` 컴포넌트 제거
   - `app/admin/signup/` 및 `app/admin/invites/` 페이지 제거

3. **간소화된 인증 시스템**:
   - Admin 사용자는 `auth.users`에만 저장
   - 초대 코드 없이 직접 생성 방식으로 변경
   - 기존 signup-form.tsx에서 Admin 관련 기능 모두 제거

### 2025년 9월 15일 (이전) - 성향 진단 시스템 제거
1. **가중치 관련 테이블 삭제**:
   - `personality_types` - 성격유형 정의 테이블 삭제
   - `quiz_questions` - 설문 질문 테이블 삭제
   - `quiz_choices` - 질문별 선택지 테이블 삭제
   - `choice_weights` - 가중치 테이블 삭제
   - `quiz_sessions` - 진단 세션 테이블 삭제
   - `quiz_responses` - 응답 저장 테이블 삭제
   - `personality_admin_mapping` - 작가 매칭 테이블 삭제
   - `personality_photos` - 추천 사진 테이블 삭제

2. **관련 기능 정리**:
   - Quiz 페이지 UI는 유지되나 기능은 제거
   - Admin 패널의 성향 관리 페이지 삭제
   - 서버 액션 파일 삭제 (quiz.ts, personality.ts, personality-mapping.ts)
   - 외래키 참조 제거 (ai_image_generations, inquiries 테이블의 참조 컬럼은 유지)

3. **영향받는 테이블**:
   - `ai_image_generations`: quiz_session_id, personality_code 컬럼 유지 (참조 제거)
   - `inquiries`: quiz_session_id, selected_personality_code 컬럼 유지 (참조 제거)

### 2025년 8월 31일 - Multi-PG 결제 시스템 및 상품 관리 통합
1. **상품 관리 통합**:
   - `photographer_pricing` + `pricing_options` → `products` 테이블로 통합
   - 작가 생성 → 관리자 승인 워크플로우 구축
   - 카테고리, 태그, 추천 상품 관리 기능 추가

2. **Multi-PG 결제 시스템 구축**:
   - PG 중립적 `payments` 테이블 설계 (NicePay, Eximbay, Adyen, Stripe, Toss 호환)
   - 종합적인 `refunds` 시스템 (부분/전체 환불, 계좌이체 지원)
   - 자동화된 `settlements` 정산 시스템 (수수료, 세금 계산)
   - 상세한 `payment_logs` 감사 추적

3. **사용자 시스템 확장**:
   - 일반 사용자 `users` 테이블 추가 (결제/환불 지원)
   - `inquiries`, `payments` 테이블에 `user_id` 연결
   - 고객 프로필 및 통계 관리 기능

4. **보안 및 정책 강화**:
   - 모든 새 테이블에 RLS 정책 적용
   - 사용자별 데이터 접근 제어 (본인/작가/관리자)
   - 결제 데이터 보안 정책 강화

### 2025년 8월 17일 - 간소화된 2단계 RBAC 시스템 도입
1. **사용자 테이블 분리**:
   - `photographers` → `photographers` (작가 정보)
   - 새로운 `admins` 테이블 생성 (관리자)

2. **간소화된 권한 시스템 구축**:
   - TypeScript 기반 2단계 RBAC 모듈 (`lib/rbac/`)
   - Admin → Photographer 권한 구조
   - 컴포넌트 레벨 권한 제어

3. **보안 강화**:
   - Service Role 기반 사용자 생성
   - 강화된 RLS 정책 (Admin 권한 기반)
   - 권한별 네비게이션 필터링

4. **사용자 생성 방식 변경**:
   - ~~초대 코드 시스템~~ 제거
   - ~~Super Admin 개념~~ 제거 (단순화)
   - Admin 직접 생성 방식 (`/admin/users`)
   - 초기 Admin 생성 시스템 (`/admin-setup`)

5. **인증 플로우 개선**:
   - 로그인 시 사용자 타입 자동 감지 (Admin/Photographer)
   - 권한별 자동 리디렉션
   - 간소화된 네비게이션 시스템

이 스키마는 기존 사진 예약 시스템의 안정성을 유지하면서, 현대적인 RBAC 기반 권한 관리와 성향 진단 시스템을 완전히 지원하도록 설계되었습니다.