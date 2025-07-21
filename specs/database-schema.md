# Database Schema - Photo4You

## 🏗️ 전체 DB 구조

### 기본 정보
- **Database Type**: PostgreSQL (Supabase)
- **Project ID**: `kypwcsgwjtnkiiwjedcn`
- **Region**: ap-northeast-2

## 📊 핵심 테이블 구조

### 1. 성향 진단 시스템

#### `personality_types` - 성격유형 정의
```sql
- code: VARCHAR(10) (PK) -- 'A1', 'A2', 'B1', 'C1', 'D1', 'E1', 'E2', 'F1', 'F2'
- name: TEXT (NOT NULL) -- '고요한 관찰자', '따뜻한 동행자' 등
- description: TEXT (NOT NULL) -- 상세 설명
- example_person: TEXT -- 예시 인물
- style_keywords: TEXT[] -- 스타일 키워드 배열
- recommended_locations: TEXT[] -- 추천 장소
- recommended_props: TEXT[] -- 추천 소품
- ai_preview_prompt: TEXT (NOT NULL) -- AI 이미지 생성용 프롬프트
- representative_image_url: TEXT -- 대표 이미지
- display_order: INT -- 표시 순서
- is_active: BOOLEAN (DEFAULT true)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `quiz_questions` - 설문 질문 (21개)
```sql
- id: UUID (PK)
- part: TEXT (NOT NULL) -- '감정', '사진'
- question_text: TEXT (NOT NULL)
- question_image_url: TEXT -- 질문에 이미지가 있는 경우
- type: TEXT ('text', 'image', 'image_text')
- display_order: INT (NOT NULL) -- 1-21
- is_active: BOOLEAN (DEFAULT true)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `quiz_choices` - 질문별 선택지 (65개)
```sql
- id: UUID (PK)
- question_id: UUID (FK to quiz_questions)
- choice_text: TEXT (NOT NULL)
- choice_image_url: TEXT -- 선택지에 이미지가 있는 경우
- display_order: INT (NOT NULL)
- is_active: BOOLEAN (DEFAULT true)
- created_at: TIMESTAMPTZ
```

#### `choice_weights` - 선택지별 성격유형 가중치 (585개)
```sql
- id: UUID (PK)
- choice_id: UUID (FK to quiz_choices)
- personality_code: VARCHAR(10) (FK to personality_types)
- weight: INT (NOT NULL) -- 0-3 점수
- created_at: TIMESTAMPTZ
```

#### `quiz_sessions` - 진단 세션 추적
```sql
- id: UUID (PK)
- user_ip: INET -- 익명 사용자 추적용
- user_agent: TEXT -- 브라우저 정보
- started_at: TIMESTAMPTZ (NOT NULL)
- completed_at: TIMESTAMPTZ -- 완료 시간
- calculated_personality_code: VARCHAR(10) (FK to personality_types)
- total_score_data: JSONB -- 전체 점수 데이터 저장
- is_completed: BOOLEAN (DEFAULT false)
- created_at: TIMESTAMPTZ
```

#### `quiz_responses` - 사용자 응답 저장
```sql
- id: UUID (PK)
- session_id: UUID (FK to quiz_sessions)
- question_id: UUID (FK to quiz_questions)
- choice_id: UUID (FK to quiz_choices)
- response_time_ms: INT -- 응답 시간 (분석용)
- created_at: TIMESTAMPTZ
```

### 2. 사용자 관리 시스템

#### `admin_users` - 관리자/작가 정보
```sql
- id: UUID (PK, references auth.users)
- email: TEXT (UNIQUE, NOT NULL)
- name: TEXT (NOT NULL)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `admin_portfolio_photos` - 작가 포트폴리오
```sql
- id: UUID (PK)
- admin_id: UUID (FK to admin_users)
- photo_url: TEXT (NOT NULL)
- thumbnail_url: TEXT
- title: TEXT
- description: TEXT
- style_tags: TEXT[]
- display_order: INT (NOT NULL)
- is_representative: BOOLEAN (DEFAULT false) -- 메인 대표 사진
- is_public: BOOLEAN (DEFAULT true) -- 공개 설정
- view_count: INT (DEFAULT 0)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 3. 매칭 시스템

#### `personality_admin_mapping` - 성격유형별 작가 매칭
```sql
- id: UUID (PK)
- personality_code: VARCHAR(10) (FK to personality_types)
- admin_id: UUID (FK to admin_users)
- compatibility_score: INT (1-10) -- 추천 우선순위
- notes: TEXT -- 매칭 이유나 특이사항
- is_primary: BOOLEAN (DEFAULT false) -- 주력 담당 여부
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `personality_photos` - 성격유형별 추천 사진 갤러리
```sql
- id: UUID (PK)
- personality_code: VARCHAR(10) (FK to personality_types)
- photo_id: UUID (FK to photos)
- is_representative: BOOLEAN (DEFAULT false)
- display_order: INT (1-9) -- 갤러리 순서
- created_at: TIMESTAMPTZ
```

### 4. AI 이미지 생성

#### `ai_image_generations` - AI 이미지 생성 전 과정 추적
```sql
- id: UUID (PK)
- quiz_session_id: UUID (FK to quiz_sessions)
- personality_code: VARCHAR(10) (FK to personality_types)
- user_uploaded_image_url: TEXT (NOT NULL) -- 사용자 업로드 원본
- generated_prompt: TEXT (NOT NULL) -- AI 생성 프롬프트
- api_provider: TEXT ('openai_dalle', 'runway', 'midjourney')
- api_request_payload: JSONB -- API 요청 파라미터
- api_response_data: JSONB -- API 응답 데이터
- generated_image_url: TEXT -- 생성된 이미지 URL
- generation_status: TEXT ('pending', 'processing', 'completed', 'failed')
- error_message: TEXT
- processing_time_seconds: INT
- user_rating: INT (1-5) -- 사용자 만족도
- is_shared: BOOLEAN (DEFAULT false)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 5. 예약 시스템

#### `available_slots` - 예약 가능 시간
```sql
- id: UUID (PK)
- date: DATE (NOT NULL)
- start_time: TIME (NOT NULL)
- end_time: TIME (NOT NULL)
- duration_minutes: INT (default: 45)
- is_available: BOOLEAN (default: true)
- admin_id: UUID (FK to admin_users)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `inquiries` - 문의/예약 정보
```sql
- id: UUID (PK)
- name: TEXT (NOT NULL)
- phone: TEXT (NOT NULL)

-- 새로운 성향 진단 관련 컬럼들
- quiz_session_id: UUID (FK to quiz_sessions)
- selected_personality_code: VARCHAR(10) (FK to personality_types)
- matched_admin_id: UUID (FK to admin_users)
- selected_slot_id: UUID (FK to available_slots)
- ai_generation_id: UUID (FK to ai_image_generations)

-- 기존 레거시 컬럼들 (하위 호환)
- instagram_id: TEXT
- gender: TEXT ('male', 'female', 'other')
- desired_date: DATE
- people_count: INT
- relationship: TEXT
- current_mood_keywords: TEXT[]
- desired_mood_keywords: TEXT[]
- special_request: TEXT
- difficulty_note: TEXT
- selected_category_id: UUID (FK to categories)
- selection_path: TEXT[]
- selection_history: JSONB

- status: TEXT ('new', 'contacted', 'reserved', 'completed')
- admin_note: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 6. 기존 시스템 (레거시)

#### `photos` - 사진 파일 관리
```sql
- id: UUID (PK)
- filename: TEXT (NOT NULL)
- storage_url: TEXT (NOT NULL)
- thumbnail_url: TEXT
- width: INT
- height: INT
- size_kb: INT
- uploaded_by: UUID (FK to admin_users)
- is_active: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `categories` - 기존 카테고리 시스템
```sql
- id: UUID (PK)
- parent_id: UUID (FK to categories)
- name: TEXT (NOT NULL)
- depth: INT (1-10)
- path: TEXT
- display_order: INT
- is_active: BOOLEAN
- representative_image_url: TEXT
- representative_image_id: UUID (FK to photos)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## 🔍 핵심 쿼리 패턴

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

### 작가 매칭 로직
```sql
SELECT 
  au.id,
  au.name,
  au.email,
  pam.compatibility_score,
  pam.is_primary,
  app.photo_url as representative_photo
FROM personality_admin_mapping pam
JOIN admin_users au ON pam.admin_id = au.id
LEFT JOIN admin_portfolio_photos app ON (
  au.id = app.admin_id 
  AND app.is_representative = true 
  AND app.is_public = true
)
WHERE pam.personality_code = $1
ORDER BY pam.is_primary DESC, pam.compatibility_score DESC
LIMIT 3;
```

### 추천 사진 갤러리
```sql
SELECT 
  p.id,
  p.storage_url,
  p.thumbnail_url,
  pp.display_order,
  pp.is_representative
FROM personality_photos pp
JOIN photos p ON pp.photo_id = p.id
WHERE pp.personality_code = $1 
  AND p.is_active = true
ORDER BY pp.display_order ASC
LIMIT 9;
```

## 🔐 RLS (Row Level Security) 정책

### 공개 접근 허용 (익명 사용자)
- `personality_types` - 읽기 전용
- `quiz_questions` - 읽기 전용
- `quiz_choices` - 읽기 전용
- `choice_weights` - 읽기 전용
- `quiz_sessions` - 생성, 읽기, 수정
- `quiz_responses` - 생성, 읽기
- `ai_image_generations` - 생성, 읽기, 수정
- `inquiries` - 생성, 읽기
- `admin_portfolio_photos` - 공개 설정된 것만 읽기
- `available_slots` - 예약 가능한 것만 읽기

### 관리자 권한
- 본인 데이터 관리 (포트폴리오, 예약 슬롯)
- 할당된 문의 관리
- 성향 진단 시스템 데이터 읽기 (분석용)

## 📈 성능 최적화 인덱스

```sql
-- 성향 진단 관련
CREATE INDEX idx_quiz_responses_session_id ON quiz_responses(session_id);
CREATE INDEX idx_choice_weights_choice_id ON choice_weights(choice_id);
CREATE INDEX idx_quiz_sessions_completed ON quiz_sessions(is_completed, completed_at);

-- 매칭 시스템 관련
CREATE INDEX idx_personality_admin_mapping_personality ON personality_admin_mapping(personality_code);
CREATE INDEX idx_personality_photos_personality ON personality_photos(personality_code);

-- AI 이미지 생성 관련
CREATE INDEX idx_ai_generations_session_id ON ai_image_generations(quiz_session_id);
CREATE INDEX idx_ai_generations_status ON ai_image_generations(generation_status);

-- 포트폴리오 관련
CREATE INDEX idx_admin_portfolio_admin_id ON admin_portfolio_photos(admin_id);
CREATE INDEX idx_admin_portfolio_public ON admin_portfolio_photos(is_public, display_order);
```