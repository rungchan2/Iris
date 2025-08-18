# Database Schema - Photo4You (2025년 8월 최신)

## 🏗️ 전체 DB 구조 개요

### 기본 정보
- **Database Type**: PostgreSQL (Supabase)
- **Project ID**: `kypwcsgwjtnkiiwjedcn`
- **Region**: ap-northeast-2
- **Major Update**: 2025년 8월 - RBAC 시스템 도입 및 사용자 테이블 분리

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

### 3. 성향 진단 시스템

#### `personality_types` - 성격유형 정의
```sql
CREATE TABLE personality_types (
  code VARCHAR(10) PRIMARY KEY, -- 'A1', 'A2', 'B1', 'C1', 'D1', 'E1', 'E2', 'F1', 'F2'
  name TEXT NOT NULL, -- '고요한 관찰자', '따뜻한 동행자' 등
  description TEXT NOT NULL,
  example_person TEXT,
  style_keywords TEXT[],
  recommended_locations TEXT[],
  recommended_props TEXT[],
  ai_preview_prompt TEXT NOT NULL,
  representative_image_url TEXT,
  display_order INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `quiz_questions` - 설문 질문 (21개)
```sql
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part TEXT NOT NULL CHECK (part IN ('감정', '사진')),
  question_text TEXT NOT NULL,
  question_image_url TEXT,
  type TEXT CHECK (type IN ('text', 'image', 'image_text')),
  display_order INT NOT NULL UNIQUE, -- 1-21
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `quiz_choices` - 질문별 선택지 (65개)
```sql
CREATE TABLE quiz_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  choice_image_url TEXT,
  display_order INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `choice_weights` - 선택지별 성격유형 가중치 (585개)
```sql
CREATE TABLE choice_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  choice_id UUID REFERENCES quiz_choices(id) ON DELETE CASCADE,
  personality_code VARCHAR(10) REFERENCES personality_types(code),
  weight INT NOT NULL CHECK (weight >= 0 AND weight <= 3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `quiz_sessions` - 진단 세션 추적
```sql
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ip INET,
  user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  calculated_personality_code VARCHAR(10) REFERENCES personality_types(code),
  total_score_data JSONB,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `quiz_responses` - 사용자 응답 저장
```sql
CREATE TABLE quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id),
  choice_id UUID REFERENCES quiz_choices(id),
  response_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. 매칭 시스템

#### `personality_admin_mapping` - 성격유형별 작가 매칭
```sql
CREATE TABLE personality_admin_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_code VARCHAR(10) REFERENCES personality_types(code),
  admin_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  compatibility_score INT CHECK (compatibility_score >= 1 AND compatibility_score <= 10),
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `personality_photos` - 성격유형별 추천 사진 갤러리
```sql
CREATE TABLE personality_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_code VARCHAR(10) REFERENCES personality_types(code),
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  is_representative BOOLEAN DEFAULT false,
  display_order INT CHECK (display_order >= 1 AND display_order <= 9),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. AI 이미지 생성

#### `ai_image_generations` - AI 이미지 생성 전 과정 추적
```sql
CREATE TABLE ai_image_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_session_id UUID REFERENCES quiz_sessions(id),
  personality_code VARCHAR(10) REFERENCES personality_types(code),
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

#### `inquiries` - 문의/예약 정보 (확장됨)
```sql
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- 새로운 성향 진단 관련 컬럼들
  quiz_session_id UUID REFERENCES quiz_sessions(id),
  selected_personality_code VARCHAR(10) REFERENCES personality_types(code),
  matched_admin_id UUID REFERENCES photographers(id),
  selected_slot_id UUID REFERENCES available_slots(id),
  ai_generation_id UUID REFERENCES ai_image_generations(id),

  -- 기존 레거시 컬럼들 (하위 호환)
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

### 8. 기존 시스템 (레거시 유지)

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

### 성향 진단 점수 계산
```sql
WITH user_responses AS (
  SELECT 
    qr.session_id,
    cw.personality_code,
    SUM(cw.weight) as total_score
  FROM quiz_responses qr
  JOIN choice_weights cw ON qr.choice_id = cw.choice_id
  WHERE qr.session_id = $1
  GROUP BY qr.session_id, cw.personality_code
)
SELECT personality_code 
FROM user_responses 
ORDER BY total_score DESC 
LIMIT 1;
```

### 작가 매칭 로직 (권한 고려)
```sql
SELECT 
  p.id,
  p.name,
  p.email,
  p.phone,
  p.bio,
  p.years_experience,
  p.specialties,
  p.studio_location,
  p.price_range_min,
  p.price_range_max,
  pam.compatibility_score,
  pam.is_primary
FROM personality_admin_mapping pam
JOIN photographers p ON pam.admin_id = p.id
WHERE pam.personality_code = $1
  AND p.approval_status = 'approved'
  AND p.application_status = 'approved'
ORDER BY pam.is_primary DESC, pam.compatibility_score DESC
LIMIT 3;
```

## 🔐 RLS (Row Level Security) 정책

### 공개 접근 허용 (익명 사용자)
```sql
-- 성격유형 시스템 (읽기 전용)
ALTER TABLE personality_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read personality types" ON personality_types FOR SELECT USING (is_active = true);

-- 퀴즈 시스템 (읽기 및 생성)
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create and read their own sessions" ON quiz_sessions
  FOR ALL USING (user_ip = inet_client_addr());

-- AI 이미지 생성 (생성 및 읽기)
ALTER TABLE ai_image_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own generations" ON ai_image_generations
  FOR ALL USING (
    quiz_session_id IN (
      SELECT id FROM quiz_sessions 
      WHERE user_ip = inet_client_addr()
    )
  );
```

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

-- 성향 진단 관련
CREATE INDEX idx_quiz_responses_session_id ON quiz_responses(session_id);
CREATE INDEX idx_choice_weights_choice_id ON choice_weights(choice_id);
CREATE INDEX idx_quiz_sessions_completed ON quiz_sessions(is_completed, completed_at);

-- 매칭 시스템 관련
CREATE INDEX idx_personality_admin_mapping_personality ON personality_admin_mapping(personality_code);
CREATE INDEX idx_personality_admin_mapping_admin ON personality_admin_mapping(admin_id);
CREATE INDEX idx_personality_photos_personality ON personality_photos(personality_code);

-- AI 이미지 생성 관련
CREATE INDEX idx_ai_generations_session_id ON ai_image_generations(quiz_session_id);
CREATE INDEX idx_ai_generations_status ON ai_image_generations(generation_status);

-- 예약 시스템 관련
CREATE INDEX idx_available_slots_admin_date ON available_slots(admin_id, date);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_personality ON inquiries(selected_personality_code);
```

## 🔄 마이그레이션 이력

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