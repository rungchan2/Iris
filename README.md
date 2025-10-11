# Project Basic Information - kindt

## 🎯 프로젝트 개요

### 제품명
**아이리즈(kindt)** - AI 기반 작가 매칭 & 예약 플랫폼

### 핵심 목적
10문항 설문을 통한 4차원 프로필 매칭으로 사용자에게 최적의 작가를 추천하고, 원활한 예약과 결제까지 연결하는 AI 매칭 기반 사진 플랫폼

### 최신 업데이트 (2025.09.18)
- ✅ **AI 매칭 시스템**: pgvector 기반 10문항 설문 → 4차원 작가 매칭
- ✅ **관리자 도구**: 전체 매칭 시스템 관리 및 상품 관리 기능
- ✅ **상품 관리**: 작가 상품 CRUD 및 승인 워크플로우
- ✅ **임베딩 시스템**: OpenAI + CLIP 기반 semantic similarity search

## 👥 타겟 사용자

### 1차 타겟
- **외국인 관광객** (주로 20-40대 여성)
- SNS를 통한 콘텐츠 소비에 익숙한 Z세대~밀레니얼
- MBTI·퍼스널 컬러 등 진단 콘텐츠에 익숙함

### 2차 타겟
- **국내 일반 사용자** 중 스냅사진을 한 번도 시도해보지 않은 사람
- 외모 부담, 촬영 경험 부족, 심리적 장벽 존재
- '나도 괜찮게 나올 수 있을까?'에 대한 심리적 확신이 필요한 층

## 🏗️ 기술 스택

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React State (useState, useReducer)
- **UI Components**: shadcn/ui (선택적)

### Backend
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **Authentication**: Supabase Auth with RLS (Row Level Security)
- **Storage**: Supabase Storage
- **API**: Supabase REST API + Custom Edge Functions

### AI Integration
- **텍스트 임베딩**: OpenAI text-embedding-3-small (1536차원)
- **이미지 임베딩**: OpenAI CLIP via Replicate API
- **벡터 검색**: pgvector 코사인 유사도 기반 매칭
- **이미지 생성**: OpenAI DALL-E 3 또는 Runway API

### Deployment
- **Frontend**: Vercel (Next.js 최적화)
- **Backend**: Supabase Cloud
- **CDN**: Supabase Storage + Vercel Edge Network

## 📱 핵심 기능 플로우

### 1. AI 매칭 플로우 (신규)
```
사용자 방문 → 10문항 설문 시작 → 텍스트/이미지 선택 응답 → 
4차원 임베딩 생성 → pgvector 유사도 계산 → 작가 매칭 결과 표시
```

### 2. 관리자 매칭 시스템 관리
```
질문 관리 → 선택지/이미지 편집 → 임베딩 재생성 → 
작가 프로필 4차원 설정 → 가중치 조정 → 성능 분석
```

### 3. 상품 관리 플로우 (신규)
```
상품 생성 → 작가 배정 → 가격/정보 설정 → 
관리자 승인 → 활성화 → 예약 가능
```

### 4. 예약 플로우
```
매칭 결과 → 작가 선택 → 상품 선택 → 
시간 선택 → 연락처 입력 → 결제 → 예약 완료
```

### 5. 익명 매칭 시스템
```
비로그인 접근 → 세션 토큰 생성 → 전체 매칭 플로우 → 
결과 확인 → 선택적 회원가입 → 예약 진행
```

## 🧠 4차원 매칭 시스템

### 매칭 알고리즘 구조
- **스타일/감성 (40%)**: Q6 키워드 + Q7 이미지 + Q8 빛 + Q9 로케이션
- **소통/심리 (30%)**: Q3 편안함 + Q4 분위기 + Q5 몰입
- **목적/스토리 (20%)**: Q1 목적 + Q10 주관식 텍스트
- **동반자 (10%)**: Q2 동반자 (하드 필터 겸용)

### 매칭 파이프라인
1. **하드 필터링**: 지역, 예산, 동반자, 키워드 호환성
2. **4차원 유사도**: pgvector 코사인 유사도 계산  
3. **키워드 보너스**: 1개(50%) → 2개(70%) → 3개+(100%)
4. **최종 순위**: 가중 점수 기반 정렬

### 임베딩 전략
- **사전 계산**: 모든 선택지 + 작가 프로필
- **실시간 생성**: Q10 주관식 응답만
- **관리자 제어**: 텍스트 수정 시 자동 재생성

## 🔄 기존 시스템과의 차이점

| 기존 플랫폼 | 포토포유 |
|-------------|-----------|
| 감성 콘텐츠 타겟 | 일반 사용자 / 외국인 대상 확장 |
| 작가 프로필 중심 | 유저 성향 중심 작가 매칭 |
| 폼 기반 예약 | 심리 + 이미지 기반 진단 경험 |
| 경험 미리보기 없음 | AI 이미지 기반 프리뷰 제공 |
| 예약 후 커뮤니케이션 | 예약 전 확신 형성 |

## 🌐 환경 설정

### 필수 환경 변수
```env
# Supabase (pgvector extension enabled)
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Integration
OPENAI_API_KEY=your_openai_key  # text-embedding-3-small + DALL-E
RUNWAY_API_KEY=your_runway_key  # Image generation
REPLICATE_API_TOKEN=your_replicate_token  # CLIP embeddings

# Other
NEXT_PUBLIC_APP_URL=your_app_url
```

### 개발 환경 설정
```bash
# 프로젝트 설치
npm install

# 개발 서버 실행 (Turbopack)
npm run dev

# 빌드
npm run build

# 타입 체크
npm run type-check

# Supabase 타입 생성
npm run update-types

# 코드 스타일 검사
npm run lint
```

### 주요 관리자 기능
- **AI 매칭 시스템 관리**: `/admin/matching/`
  - 질문 관리: 10문항 편집, 가중치 설정
  - 선택지 관리: 텍스트/이미지 임베딩 자동 생성
  - 작가 프로필: 4차원 설명 + 임베딩 관리
  - 성능 분석: 매칭 정확도 모니터링

- **상품 관리**: `/admin/products/`
  - CRUD 기능: 생성, 수정, 삭제
  - 승인 워크플로우: pending → approved/rejected
  - 작가별 상품 관리

- **계층형 네비게이션**: 
  - 접이식 메뉴 구조
  - 권한 기반 메뉴 표시
  - breadcrumb 자동 생성

## 📊 성능 목표

### 사용자 경험
- 10문항 매칭 완료 시간: 3-5분
- 매칭 결과 생성: 실시간 (pgvector 최적화)
- 임베딩 생성 시간: 2초 이내
- 페이지 로딩 속도: 2초 이내

### 기술적 목표
- pgvector 인덱스 최적화 (IVFFLAT)
- Core Web Vitals 최적화
- 모바일 우선 반응형 디자인
- 익명 매칭 지원 (세션 토큰)

## 🔍 SEO 및 마케팅

### 핵심 키워드
- AI 작가 매칭
- 작가 추천
- 스냅 사진
- 개인 촬영
- 외국인 관광객 사진

### 소셜 미디어 연동
- 결과 공유 기능
- 인스타그램 스토리 연동
- 바이럴 마케팅 요소

## 🚀 향후 확장 계획

### Phase 1 (✅ 완료 - 2025.09.18)
- ✅ AI 매칭 시스템 (10문항 + 4차원)
- ✅ 관리자 도구 (질문/작가/상품 관리)
- ✅ 상품 승인 워크플로우
- ✅ 익명 매칭 (세션 토큰)
- ✅ 임베딩 자동 생성

### Phase 2 (진행 예정)
- 사용자 매칭 플로우 구현
- 예약 시스템 연동
- 결제 시스템 통합
- 딥러닝 V2 (클릭 예측 모델)

### Phase 3
- 만족도 예측 모델 (V3)
- 개인화 추천 시스템 (V4)
- A/B 테스트 자동화
- 글로벌 확장

## 🗃️ 최신 변경 사항 (2025.09.18)

### ✅ **AI 매칭 시스템 구축**
- **계층형 사이드바**: 접이식 메뉴로 관리자 도구 체계화
- **질문 관리**: 10문항 편집, 가중치 설정, 임베딩 자동 생성
- **이미지 업로더**: CLIP 임베딩 지원, 재사용 가능한 컴포넌트
- **RLS 정책**: 익명 매칭 지원, 권한별 접근 제어

### ✅ **상품 관리 시스템**
- **CRUD 기능**: 생성, 수정, 삭제, 승인/거부
- **작가 연동**: 상품-작가 관계 관리
- **승인 워크플로우**: pending → approved/rejected
- **UUID 기반**: 올바른 외래키 관계 설정

### ✅ **UI/UX 개선**
- **Breadcrumb**: 자동 경로 표시
- **Dialog 커스터마이징**: 크기 조절 가능
- **임베딩 상태**: 생성 여부 시각적 표시
- **에러 처리**: 포괄적인 오류 관리

### 🔧 **기술적 수정사항**
- **pgvector 통합**: semantic similarity search
- **OpenAI + CLIP**: 텍스트/이미지 임베딩
- **RLS 정책 수정**: products 테이블 정책 완전 재구성
- **컴포넌트 재사용**: photo-uploader 다목적 활용

## 📁 Context Reference
주요 문서:
- `specs/database-schema.md` - 매칭 시스템 DB 스키마
- `CLAUDE.md` - 개발 가이드라인
- `app/admin/matching/` - 매칭 시스템 관리자 도구
- `app/admin/products/` - 상품 관리 시스템
