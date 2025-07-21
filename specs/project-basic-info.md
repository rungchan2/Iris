# Project Basic Information - Iris

## 🎯 프로젝트 개요

### 제품명
**아이리즈(Iris)** - 스냅 성향 진단 & 작가 매칭 플랫폼

### 핵심 목적
스냅사진을 찍어본 적 없는 사용자도 부담 없이 "나도 찍을 수 있겠다"는 확신을 갖게 하고, 자신의 성향에 맞는 사진 스타일과 작가를 진단 → 매칭 → 예약까지 연결하는 진단 기반 스냅 플랫폼

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
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **API**: Supabase REST API + Custom Edge Functions

### AI Integration
- **Image Generation**: OpenAI DALL-E 3 또는 Runway API
- **Image Processing**: 사용자 업로드 이미지 → AI 스타일 변환

### Deployment
- **Frontend**: Vercel (Next.js 최적화)
- **Backend**: Supabase Cloud
- **CDN**: Supabase Storage + Vercel Edge Network

## 📱 핵심 기능 플로우

### 1. 성향 진단 플로우
```
사용자 방문 → 성향 진단 시작 → 21개 질문 응답 → 
점수 계산 → 성격유형 결정 → 결과 페이지 표시
```

### 2. AI 이미지 생성 플로우
```
사진 업로드 → 성격유형 기반 프롬프트 생성 → 
AI API 호출 → 이미지 생성 → 결과 표시
```

### 3. 작가 매칭 플로우
```
성격유형 결정 → 호환성 점수 기반 작가 매칭 → 
추천 작가 리스트 표시 → 작가 선택 → 예약 진행
```

### 4. 예약 플로우
```
작가 선택 → 예약 가능 시간 조회 → 
시간 선택 → 연락처 입력 → 예약 완료
```

## 🎨 9가지 성격유형

| 코드 | 유형명 | 특징 |
|------|--------|------|
| A1 | 고요한 관찰자 | 혼자만의 시선과 조용한 분위기를 선호 |
| A2 | 따뜻한 동행자 | 따뜻하고 감정적인 관계를 선호 |
| B1 | 감성 기록자, 내추럴 힐러 | 일상의 감성을 포착하고 편안한 분위기 추구 |
| C1 | 시네마틱 몽상가, 시크한 미니멀리스트 | 구조적 아름다움과 도시적 감성 선호 |
| D1 | 활력 가득 리더, 캐주얼 낙천주의자 | 밝고 에너지 넘치는 구도 선호 |
| E1 | 도시의 드리머 | 도시적인 빛과 그림자를 사랑함 |
| E2 | 무심한 예술가 | 실험적이고 감성적인 접근을 선호 |
| F1 | 자유로운 탐험가 | 틀에 얽매이지 않는 역동적 탐색형 |
| F2 | 감각적 실험가 | 콘셉트 있고 독특한 시도를 선호 |

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
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Image Generation
OPENAI_API_KEY=your_openai_key
RUNWAY_API_KEY=your_runway_key

# Other
NEXT_PUBLIC_APP_URL=your_app_url
```

### 개발 환경 설정
```bash
# 프로젝트 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 타입 체크
npm run type-check
```

## 📊 성능 목표

### 사용자 경험
- 성향 진단 완료 시간: 5-7분
- AI 이미지 생성 시간: 30초 이내
- 페이지 로딩 속도: 2초 이내

### 기술적 목표
- Core Web Vitals 최적화
- 모바일 우선 반응형 디자인
- 다국어 지원 (한국어/영어)

## 🔍 SEO 및 마케팅

### 핵심 키워드
- 성향 진단
- 스냅 사진
- 작가 매칭
- AI 이미지 생성
- 외국인 관광객 사진

### 소셜 미디어 연동
- 결과 공유 기능
- 인스타그램 스토리 연동
- 바이럴 마케팅 요소

## 🚀 향후 확장 계획

### Phase 1 (MVP)
- 성향 진단 시스템
- AI 이미지 생성
- 기본 작가 매칭
- 예약 시스템

### Phase 2
- 다국어 지원
- 작가 평가 시스템
- 고급 AI 필터
- 모바일 앱

### Phase 3
- 추천 촬영 루트
- 스타일링 패키지
- 구독 서비스
- 글로벌 확장