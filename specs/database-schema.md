# Database Schema - Iris (2025년 9월 최신)

## 🏗️ 전체 DB 구조 개요

### 기본 정보
- **Database Type**: PostgreSQL (Supabase) with pgvector extension
- **Project ID**: `kypwcsgwjtnkiiwjedcn`
- **Region**: ap-northeast-2

## 📊 핵심 테이블 구조

### 1. 사용자 관리 시스템 (기존 유지)

#### `admins` - 시스템 관리자
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `photographers` - 작가 정보
```sql
CREATE TABLE photographers (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  approval_status TEXT DEFAULT 'approved',
  bio TEXT,
  price_range_min INT,
  price_range_max INT,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. 매칭 시스템 (2025.09.16 신규)

#### `survey_questions` - 10문항 질문 마스터
```sql
CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_order INTEGER NOT NULL UNIQUE, -- 1~10
  question_key VARCHAR(50) NOT NULL UNIQUE,
  question_title TEXT NOT NULL,
  question_type VARCHAR(30) NOT NULL, -- 'single_choice', 'image_choice', 'textarea'
  weight_category VARCHAR(30), -- 'style_emotion', 'communication_psychology', 'purpose_story', 'companion'
  base_weight DECIMAL(4,3) NOT NULL,
  is_hard_filter BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `survey_choices` - 선택지 (임베딩 포함)
```sql
CREATE TABLE survey_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES survey_questions(id),
  choice_key VARCHAR(50) NOT NULL,
  choice_label TEXT NOT NULL,
  choice_order INTEGER NOT NULL,
  choice_embedding vector(1536), -- OpenAI text-embedding-3-small
  embedding_generated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `survey_images` - 이미지 선택지 (Q7용)
```sql
CREATE TABLE survey_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES survey_questions(id),
  image_key VARCHAR(50) NOT NULL,
  image_label TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_order INTEGER NOT NULL,
  image_embedding vector(1536), -- 이미지 설명 기반 임베딩
  embedding_generated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `photographer_profiles` - 4차원 작가 프로필
```sql
CREATE TABLE photographer_profiles (
  photographer_id UUID PRIMARY KEY REFERENCES photographers(id),
  
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `photographer_keywords` - 전문 키워드 (하드 필터 + 보너스 점수)
```sql
CREATE TABLE photographer_keywords (
  photographer_id UUID NOT NULL REFERENCES photographers(id),
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
  session_id UUID NOT NULL REFERENCES matching_sessions(id),
  photographer_id UUID NOT NULL REFERENCES photographers(id),
  
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
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. 딥러닝 데이터 수집 테이블

#### `user_feedback` - 만족도 피드백 (딥러닝 라벨)
```sql
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES matching_sessions(id),
  photographer_id UUID REFERENCES photographers(id),
  
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

### 4. 관리자 도구

#### `embedding_jobs` - 임베딩 재생성 큐
```sql
CREATE TABLE embedding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(30) NOT NULL, -- 'choice_embedding', 'image_embedding', 'photographer_profile'
  target_id UUID NOT NULL,
  job_status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  requested_by UUID REFERENCES admins(id),
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
  updated_by UUID REFERENCES admins(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. 기존 시스템 테이블 (확장)

#### `photos` - 사진 관리 (임베딩 추가)
```sql
-- 기존 photos 테이블에 추가된 컬럼
ALTER TABLE photos ADD COLUMN image_embedding vector(1536);
ALTER TABLE photos ADD COLUMN embedding_generated_at TIMESTAMPTZ;
```

#### `inquiries`, `users`, `products`, `payments` 등
기존 예약/결제 시스템 테이블들은 그대로 유지

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
- **작가**: 본인 프로필/키워드 관리
- **관리자**: 모든 질문/프로필 관리, 매칭 분석 조회

## 📈 성능 최적화

### pgvector 인덱스
```sql
-- 임베딩 검색 최적화
CREATE INDEX USING ivfflat ON survey_choices (choice_embedding vector_cosine_ops);
CREATE INDEX USING ivfflat ON photographer_profiles (style_emotion_embedding vector_cosine_ops);
-- 4차원 모든 임베딩에 대해 인덱스 생성
```

### 기본 인덱스
```sql
CREATE INDEX idx_matching_sessions_token ON matching_sessions(session_token);
CREATE INDEX idx_matching_results_session ON matching_results(session_id);
CREATE INDEX idx_photographer_keywords_keyword ON photographer_keywords(keyword);
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