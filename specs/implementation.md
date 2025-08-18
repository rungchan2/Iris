# Implementation Guide - Photo4You (Based on sunset-cinema)

## 🔄 기존 프로젝트 기반 확장 전략

### 기존 sunset-cinema 프로젝트 분석
**sunset-cinema**는 이미 Photo4You에 필요한 핵심 인프라를 갖추고 있습니다:

#### ✅ 활용 가능한 기존 기능들
- **Next.js 14+ App Router** 구조
- **Supabase 인프라** (PostgreSQL, Auth, Storage)
- **shadcn/ui 디자인 시스템**
- **카테고리 기반 사진 관리 시스템**
- **문의/예약 시스템 (inquiries, available_slots)**
- **관리자 시스템 (photographers)**
- **사진 업로드/관리 (photos, photo_categories)**
- **반응형 UI 컴포넌트들**

#### 🆕 새로 추가할 기능들
- **성향 진단 시스템** (21문항 설문)
- **AI 이미지 생성**
- **성격유형별 작가 매칭**
- **성향 진단 결과 페이지**

## 🏗️ 단계별 구현 가이드

### Phase 1: 프로젝트 Fork 및 기본 설정 (1일)

#### 1.1 프로젝트 Fork 및 Clone
```bash
# GitHub에서 sunset-cinema를 Fork한 후
git clone https://github.com/your-username/photo4you.git
cd photo4you

# 원본 저장소를 upstream으로 추가
git remote add upstream https://github.com/rungchan2/sunset-cinema.git

# 기존 의존성 확인 및 업데이트
npm install
npm audit fix
```

#### 1.2 프로젝트명 및 설정 변경
```bash
# package.json 수정
{
  "name": "photo4you",
  "description": "스냅 성향 진단 & 작가 매칭 플랫폼",
  "version": "1.0.0"
}

# README.md 업데이트
# 기존 sunset-cinema 설명을 Photo4You로 변경
```

#### 1.3 추가 패키지 설치
```bash
# AI 이미지 생성을 위한 패키지
npm install openai

# 추가 shadcn/ui 컴포넌트
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add switch
```

**참고 문서**: 
- [Git Fork 가이드](https://docs.github.com/en/get-started/quickstart/fork-a-repo)
- [shadcn/ui 컴포넌트 목록](https://ui.shadcn.com/docs/components)

### Phase 2: 데이터베이스 스키마 확장 (1일)

#### 2.1 기존 Supabase 프로젝트 활용
```bash
# 기존 Supabase 설정 확인
# .env.local에서 기존 환경 변수 활용
NEXT_PUBLIC_SUPABASE_URL=existing_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=existing_anon_key

# 새로운 환경 변수 추가
OPENAI_API_KEY=your_openai_api_key
RUNWAY_API_KEY=your_runway_api_key
```

#### 2.2 새로운 테이블 추가 (기존 테이블 유지)
```sql
-- Supabase SQL Editor에서 실행
-- 기존 테이블들 (photographers, categories, photos, inquiries 등)은 그대로 유지
-- 새로운 성향 진단 관련 테이블들만 추가

-- 이미 제공된 스키마에서 다음 테이블들 추가:
-- personality_types, quiz_questions, quiz_choices, choice_weights
-- quiz_sessions, quiz_responses, ai_image_generations
-- personality_admin_mapping, personality_photos, admin_portfolio_photos
```

#### 2.3 기존 inquiries 테이블 확장
```sql
-- 기존 컬럼들 유지하면서 새로운 컬럼들 추가
ALTER TABLE inquiries ADD COLUMN quiz_session_id UUID REFERENCES quiz_sessions(id);
ALTER TABLE inquiries ADD COLUMN selected_personality_code VARCHAR(10) REFERENCES personality_types(code);
ALTER TABLE inquiries ADD COLUMN ai_generation_id UUID REFERENCES ai_image_generations(id);
```

**참고 문서**:
- [Supabase Database Migration](https://supabase.com/docs/guides/database/migrate)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

### Phase 3: 타입 정의 및 유틸리티 확장 (1일)

#### 3.1 기존 타입 확장
```typescript
// types/database.ts (기존 파일 확장)
export interface Database {
  public: {
    Tables: {
      // 기존 테이블들 유지
      photographers: { ... }
      categories: { ... }
      photos: { ... }
      inquiries: { ... }
      
      // 새로운 테이블들 추가
      personality_types: {
        Row: PersonalityType
        Insert: PersonalityTypeInsert
        Update: PersonalityTypeUpdate
      }
      quiz_questions: { ... }
      // ... 기타 새로운 테이블들
    }
  }
}

// types/quiz.ts (새로 추가)
export interface QuizSession {
  id: string
  user_ip?: string
  started_at: string
  calculated_personality_code?: string
  is_completed: boolean
}

// types/personality.ts (새로 추가)
export interface PersonalityType {
  code: string
  name: string
  description: string
  ai_preview_prompt: string
  // ... 기타 필드들
}
```

#### 3.2 기존 API 함수 확장
```typescript
// lib/api.ts (기존 파일 확장)
// 기존 함수들 유지
export const getCategories = async () => { ... }
export const getPhotos = async () => { ... }
export const createInquiry = async () => { ... }

// 새로운 함수들 추가
export const createQuizSession = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert({ started_at: new Date().toISOString() })
    .select('id')
    .single()
  
  if (error) throw error
  return data.id
}

export const getQuizQuestions = async () => { ... }
export const calculatePersonalityResult = async () => { ... }
```

### Phase 4: 성향 진단 시스템 구현 (3일)

#### 4.1 성향 진단 API 라우트 추가
```typescript
// app/api/quiz/session/route.ts (새로 추가)
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert({ 
        started_at: new Date().toISOString(),
        user_ip: headers().get('x-forwarded-for') || 'unknown'
      })
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ sessionId: data.id })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
```

#### 4.2 성향 진단 컴포넌트 개발
```typescript
// components/quiz/QuizComponent.tsx (새로 추가)
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { QuizQuestion } from '@/types/quiz'

interface QuizComponentProps {
  questions: QuizQuestion[]
  onComplete: (sessionId: string) => void
}

export function QuizComponent({ questions, onComplete }: QuizComponentProps) {
  // 기존 sunset-cinema의 컴포넌트 패턴을 따라 구현
  // shadcn/ui 컴포넌트들 활용
}
```

#### 4.3 성향 진단 페이지 구현
```typescript
// app/quiz/page.tsx (새로 추가)
import { QuizComponent } from '@/components/quiz/QuizComponent'
import { getQuizQuestions } from '@/lib/api'

export default async function QuizPage() {
  const questions = await getQuizQuestions()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <QuizComponent 
        questions={questions}
        onComplete={(sessionId) => {
          // 결과 페이지로 리다이렉트
          window.location.href = `/quiz/result/${sessionId}`
        }}
      />
    </div>
  )
}
```

**참고 문서**:
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [React useState Hook](https://react.dev/reference/react/useState)

### Phase 5: AI 이미지 생성 시스템 구현 (2일)

#### 5.1 OpenAI API 연동
```typescript
// lib/openai.ts (새로 추가)
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateImage(prompt: string, imageUrl: string) {
  try {
    const response = await openai.images.edit({
      image: imageUrl,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    })
    
    return response.data[0].url
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw error
  }
}
```

#### 5.2 이미지 업로드 API 확장
```typescript
// app/api/upload/route.ts (기존 파일 확장 또는 새로 추가)
// 기존 sunset-cinema의 이미지 업로드 로직 활용
// Supabase Storage 설정 그대로 사용

export async function POST(request: Request) {
  // 기존 업로드 로직 활용
  // AI 이미지 생성용 임시 저장소에 업로드
}
```

#### 5.3 Edge Function으로 AI 생성 처리
```typescript
// supabase/functions/generate-ai-image/index.ts (새로 추가)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // AI 이미지 생성 백그라운드 처리
  // OpenAI API 호출 및 결과 저장
})
```

**참고 문서**:
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference/images)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

### Phase 6: 기존 시스템과 새 기능 통합 (2일)

#### 6.1 기존 문의 시스템 확장
```typescript
// components/inquiry/InquiryForm.tsx (기존 파일 확장)
// 기존 폼에 성향 진단 결과 연동 추가

interface ExtendedInquiryFormProps {
  personalityCode?: string // 새로 추가
  sessionId?: string // 새로 추가
  aiGenerationId?: string // 새로 추가
  prefilledData?: Partial<InquiryFormData> // 기존 데이터 활용
}

export function InquiryForm({ personalityCode, sessionId, ...props }: ExtendedInquiryFormProps) {
  // 기존 폼 로직 유지하면서 새로운 필드들 추가
  const handleSubmit = async (data: InquiryFormData) => {
    const inquiryData = {
      ...data,
      quiz_session_id: sessionId,
      selected_personality_code: personalityCode,
      ai_generation_id: aiGenerationId,
      // 기존 필드들도 유지
    }
    
    // 기존 createInquiry 함수 활용
    await createInquiry(inquiryData)
  }
}
```

#### 6.2 기존 작가 시스템에 매칭 로직 추가
```typescript
// lib/api.ts (기존 파일에 함수 추가)
export const getRecommendedPhotographers = async (personalityCode: string) => {
  const { data, error } = await supabase
    .from('personality_admin_mapping')
    .select(`
      compatibility_score,
      is_primary,
      photographers (
        id,
        name,
        email
      ),
      admin_portfolio_photos!admin_portfolio_photos_admin_id_fkey (
        photo_url,
        thumbnail_url,
        title,
        is_representative
      )
    `)
    .eq('personality_code', personalityCode)
    .eq('admin_portfolio_photos.is_representative', true)
    .order('is_primary', { ascending: false })
    .order('compatibility_score', { ascending: false })
    .limit(3)

  if (error) throw error
  return data
}
```

#### 6.3 기존 카테고리 시스템을 성격유형별 갤러리로 확장
```typescript
// components/gallery/PersonalityGallery.tsx (새로 추가, 기존 갤러리 컴포넌트 활용)
import { PhotoGrid } from '@/components/photos/PhotoGrid' // 기존 컴포넌트 재사용

interface PersonalityGalleryProps {
  personalityCode: string
}

export function PersonalityGallery({ personalityCode }: PersonalityGalleryProps) {
  // 기존 PhotoGrid 컴포넌트 재사용
  // 성격유형별 필터링만 추가
}
```

### Phase 7: 관리자 시스템 확장 (2일)

#### 7.1 기존 관리자 페이지에 새 기능 추가
```typescript
// app/admin/page.tsx (기존 파일 확장)
// 기존 대시보드에 성향 진단 통계 추가

export default async function AdminDashboard() {
  // 기존 통계 데이터 로딩
  const existingStats = await getAdminStats()
  
  // 새로운 성향 진단 통계 추가
  const personalityStats = await getPersonalityStats()
  
  return (
    <div className="space-y-6">
      {/* 기존 대시보드 컴포넌트들 유지 */}
      <ExistingDashboardCards stats={existingStats} />
      
      {/* 새로운 성향 진단 통계 카드 추가 */}
      <PersonalityStatsCard stats={personalityStats} />
    </div>
  )
}
```

#### 7.2 포트폴리오 관리에 성격유형 매핑 추가
```typescript
// app/admin/portfolio/page.tsx (기존 파일 확장)
// 기존 포트폴리오 관리에 성격유형 태깅 기능 추가

interface ExtendedPhotoData {
  // 기존 필드들 유지
  title: string
  description: string
  category_id: string
  
  // 새로 추가
  personality_types: string[] // 연관된 성격유형들
  is_representative: boolean // 대표 사진 여부
}
```

#### 7.3 새로운 관리 페이지 추가
```typescript
// app/admin/personality-mapping/page.tsx (새로 추가)
// 작가-성격유형 매칭 관리 페이지

export default function PersonalityMappingPage() {
  // 기존 관리자 페이지 레이아웃 패턴 따라서 구현
  return (
    <AdminLayout>
      <PersonalityMappingManager />
    </AdminLayout>
  )
}
```

**참고 문서**:
- [Supabase Multi-table Queries](https://supabase.com/docs/guides/database/joins-and-nesting)

### Phase 8: 리뷰 시스템 구현 (2일)

#### 8.1 데이터베이스 스키마 추가
```sql
-- reviews 테이블 생성
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  review_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  reviewer_name VARCHAR(100),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT[],
  is_public BOOLEAN DEFAULT true,
  is_anonymous BOOLEAN DEFAULT false,
  is_submitted BOOLEAN DEFAULT false,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 8.2 Server Actions 구현
```typescript
// lib/actions/reviews.ts
- generateReviewLink(inquiryId) - 리뷰 링크 생성
- getReviewByToken(token) - 토큰으로 리뷰 조회
- submitReview(token, data) - 리뷰 제출
- getReviewStats(photographerId) - 통계 조회
```

#### 8.3 리뷰 페이지 구현
- `/review/[token]` - 익명 리뷰 작성 페이지
- `/admin/reviews` - 작가용 리뷰 관리
- `/reviews` - 공개 리뷰 갤러리

#### 8.4 컴포넌트 개발
- `StarRating` - 별점 입력 컴포넌트
- `ReviewForm` - 리뷰 작성 폼
- `ReviewManagement` - 리뷰 관리 UI

### Phase 9: UI/UX 개선 및 통합 (2일)

#### 8.1 기존 디자인 시스템 확장
```typescript
// lib/utils.ts (기존 파일 확장)
// 기존 유틸리티 함수들 유지하면서 성격유형 관련 함수 추가

export function getPersonalityColor(code: string): string {
  const colors = {
    A1: '#6B7280', // 고요한 관찰자
    A2: '#F59E0B', // 따뜻한 동행자
    B1: '#10B981', // 감성 기록자
    C1: '#3B82F6', // 시네마틱 몽상가
    D1: '#EF4444', // 활력 리더
    E1: '#8B5CF6', // 도시 드리머
    E2: '#6366F1', // 무심한 예술가
    F1: '#F97316', // 자유로운 탐험가
    F2: '#EC4899', // 감각적 실험가
  }
  return colors[code as keyof typeof colors] || '#6B7280'
}

export function getPersonalityTheme(code: string) {
  return `personality-${code.toLowerCase()}`
}
```

#### 8.2 기존 컴포넌트에 성격유형 테마 적용
```scss
// styles/globals.css (기존 파일 확장)
/* 기존 스타일들 유지 */

/* 성격유형별 테마 추가 */
.personality-a1 {
  --personality-primary: #6B7280;
  --personality-bg: #F9FAFB;
}

.personality-a2 {
  --personality-primary: #F59E0B;
  --personality-bg: #FFFBEB;
}

/* ... 기타 성격유형들 */

.personality-theme {
  background-color: var(--personality-bg);
  border-color: var(--personality-primary);
}
```

#### 8.3 메인 네비게이션 확장
```typescript
// components/layout/Header.tsx (기존 파일 확장)
// 기존 네비게이션에 성향 진단 링크 추가

const navigationItems = [
  { href: '/', label: '홈' }, // 기존
  { href: '/gallery', label: '갤러리' }, // 기존
  { href: '/quiz', label: '성향 진단' }, // 새로 추가
  { href: '/photographers', label: '작가들' }, // 기존을 확장
  { href: '/admin', label: '관리자' }, // 기존
]
```

### Phase 10: 실시간 기능 및 최적화 (1일)

#### 9.1 기존 실시간 기능 확장
```typescript
// hooks/useRealtime.ts (기존 파일이 있다면 확장, 없다면 새로 추가)
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// 기존 실시간 기능에 AI 이미지 생성 상태 추가
export function useAIGenerationStatus(generationId: string) {
  const [status, setStatus] = useState('pending')
  
  useEffect(() => {
    const channel = supabase
      .channel('ai-generation-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ai_image_generations',
        filter: `id=eq.${generationId}`
      }, (payload) => {
        setStatus(payload.new.generation_status)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [generationId])

  return status
}
```

#### 9.2 기존 성능 최적화 유지 및 확장
```typescript
// 기존 이미지 최적화 설정 유지
// next.config.js (기존 파일 확장)
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 기존 설정들 유지
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      // 기존 도메인들 유지
      'supabase.co',
      'your-supabase-project.supabase.co',
      
      // AI 이미지 생성 관련 도메인 추가
      'oaidalleapiprodscus.blob.core.windows.net', // OpenAI
      'runway.com', // Runway
    ],
  },
}
```

### Phase 11: 테스팅 및 배포 (1일)

#### 10.1 기존 테스트 유지 및 확장
```bash
# 기존 테스트 설정이 있다면 확장
# 새로운 성향 진단 기능에 대한 테스트 추가

# Jest 설정 (package.json에 추가)
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

#### 10.2 기존 배포 설정 활용
```bash
# 기존 Vercel 설정 그대로 활용
# 환경 변수만 추가 설정

# Vercel 환경 변수 추가
vercel env add OPENAI_API_KEY
vercel env add RUNWAY_API_KEY

# 기존 배포 명령어 그대로 사용
vercel --prod
```

**참고 문서**:
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)

## 📋 마이그레이션 체크리스트

### ✅ 기존 기능 보존
- [ ] 기존 사진 업로드/관리 기능 정상 작동 확인
- [ ] 기존 문의/예약 시스템 정상 작동 확인  
- [ ] 기존 관리자 시스템 정상 작동 확인
- [ ] 기존 카테고리 시스템 정상 작동 확인
- [ ] 기존 UI/UX 패턴 유지 확인

### 🆕 신규 기능 추가
- [ ] 성향 진단 시스템 구현 및 테스트
- [ ] AI 이미지 생성 시스템 구현 및 테스트
- [ ] 작가 매칭 시스템 구현 및 테스트
- [ ] 성격유형별 갤러리 구현 및 테스트
- [ ] 통합 결과 페이지 구현 및 테스트

### 🔄 시스템 통합
- [ ] 기존 데이터베이스와 신규 스키마 통합
- [ ] 기존 API와 신규 API 연동
- [ ] 기존 컴포넌트와 신규 컴포넌트 통합
- [ ] 전체 사용자 플로우 테스트

## 🚨 주의사항

### 데이터 마이그레이션
- 기존 production 데이터가 있다면 백업 필수
- 새로운 컬럼 추가 시 기본값 설정
- 외래키 제약조건 설정 시 기존 데이터 정합성 확인

### API 호환성
- 기존 API 엔드포인트는 변경하지 않고 새로운 엔드포인트 추가
- 기존 API 응답 형식 유지
- 버전 관리를 통한 점진적 마이그레이션

### 성능 고려사항
- 새로운 테이블들에 적절한 인덱스 설정
- AI 이미지 생성으로 인한 서버 부하 모니터링
- 기존 성능 지표 유지 확인

이 가이드를 통해 기존 sunset-cinema 프로젝트를 안정적으로 Photo4You로 확장할 수 있습니다. 기존의 검증된 시스템을 최대한 활용하면서 새로운 기능을 점진적으로 추가하는 방식으로 리스크를 최소화합니다.# Implementation Guide - Photo4You

## 🏗️ 개발 순서 및 구현 가이드

### Phase 1: 프로젝트 기초 설정 (1-2일)

#### 1.1 Next.js 프로젝트 초기화
```bash
# Next.js 프로젝트 생성
npx create-next-app@latest photo4you --typescript --tailwind --eslint --app --src-dir

cd photo4you

# 필수 패키지 설치
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react date-fns clsx tailwind-merge
npm install @radix-ui/react-slot class-variance-authority

# 개발 도구 설치
npm install -D prettier prettier-plugin-tailwindcss
```

**참고 문서**: 
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

#### 1.2 shadcn/ui 설정
```bash
# shadcn/ui 초기화
npx shadcn-ui@latest init

# 기본 컴포넌트 설치
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add form
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dropdown-menu
```

**참고 문서**: 
- [shadcn/ui 공식 문서](https://ui.shadcn.com/docs)
- [shadcn/ui 설치 가이드](https://ui.shadcn.com/docs/installation/next)

#### 1.3 Supabase 설정
```bash
# Supabase CLI 설치
npm install -g supabase

# Supabase 프로젝트 초기화
supabase init

# 로컬 개발 환경 시작
supabase start
```

**환경 변수 설정**:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**참고 문서**: 
- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Next.js 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase CLI](https://supabase.com/docs/reference/cli)

### Phase 2: 데이터베이스 설정 (1일)

#### 2.1 데이터베이스 스키마 생성
```sql
-- 이미 제공된 스키마를 Supabase SQL Editor에서 실행
-- 또는 마이그레이션 파일로 관리
```

**참고 문서**:
- [Supabase Database](https://supabase.com/docs/guides/database)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)

#### 2.2 RLS (Row Level Security) 설정
```sql
-- 이미 제공된 RLS 정책들을 적용
-- 보안을 위해 필수적으로 설정해야 함
```

**참고 문서**:
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

#### 2.3 기본 데이터 입력
- 9가지 성격유형 데이터
- 21개 진단 질문과 선택지
- 가중치 데이터 (585개)

### Phase 3: 기본 타입 및 유틸리티 구현 (1일)

#### 3.1 TypeScript 타입 정의
```typescript
// types/database.ts
export interface PersonalityType {
  code: string
  name: string
  description: string
  // ... 기타 필드들
}

// types/quiz.ts
export interface QuizQuestion {
  id: string
  part: '감정' | '사진'
  question_text: string
  // ... 기타 필드들
}
```

#### 3.2 Supabase 클라이언트 설정
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**참고 문서**:
- [Supabase TypeScript 가이드](https://supabase.com/docs/guides/api/generating-types)

#### 3.3 유틸리티 함수 구현
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 성격유형별 색상 반환
export function getPersonalityColor(code: string): string {
  // 구현...
}
```

### Phase 4: 성향 진단 시스템 구현 (3-4일)

#### 4.1 성향 진단 API 구현
```typescript
// app/api/quiz/session/route.ts
export async function POST() {
  // 새로운 퀴즈 세션 생성
}

// app/api/quiz/questions/route.ts
export async function GET() {
  // 모든 질문과 선택지 반환
}

// app/api/quiz/responses/route.ts
export async function POST() {
  // 사용자 응답 저장
}

// app/api/quiz/calculate/route.ts
export async function POST() {
  // 성향 진단 결과 계산
}
```

**참고 문서**:
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

#### 4.2 성향 진단 컴포넌트 구현
```typescript
// components/quiz/QuizComponent.tsx
// components/quiz/QuizQuestion.tsx
// components/quiz/QuizChoice.tsx
// components/quiz/QuizProgress.tsx
```

#### 4.3 성향 진단 페이지 구현
```typescript
// app/quiz/page.tsx - 진단 시작 페이지
// app/quiz/result/[sessionId]/page.tsx - 결과 페이지
```

### Phase 5: AI 이미지 생성 구현 (2-3일)

#### 5.1 OpenAI DALL-E 3 API 연동
```typescript
// lib/openai.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateImage(prompt: string, imageUrl: string) {
  // DALL-E 3 API 호출
}
```

**참고 문서**:
- [OpenAI API 문서](https://platform.openai.com/docs/api-reference)
- [DALL-E 3 가이드](https://platform.openai.com/docs/guides/images)

#### 5.2 Runway API 연동 (선택사항)
```typescript
// lib/runway.ts
export async function runwayImageGeneration(prompt: string, imageUrl: string) {
  // Runway API 호출
}
```

**참고 문서**:
- [Runway API 문서](https://docs.runway.com/)

#### 5.3 이미지 업로드 및 처리
```typescript
// app/api/upload/route.ts
export async function POST(request: Request) {
  // Supabase Storage에 이미지 업로드
}
```

**참고 문서**:
- [Supabase Storage](https://supabase.com/docs/guides/storage)

#### 5.4 AI 이미지 생성 Edge Function
```typescript
// supabase/functions/generate-ai-image/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // AI 이미지 생성 백그라운드 처리
})
```

**참고 문서**:
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno 공식 문서](https://deno.land/manual)

### Phase 6: 작가 시스템 구현 (2-3일)

#### 6.1 작가 매칭 API
```typescript
// app/api/photographers/recommended/[personalityCode]/route.ts
export async function GET() {
  // 성격유형별 추천 작가 반환
}

// app/api/photographers/[id]/route.ts
export async function GET() {
  // 작가 상세 정보 반환
}
```

#### 6.2 작가 컴포넌트 구현
```typescript
// components/photographers/PhotographerCard.tsx
// components/photographers/PhotographerProfile.tsx
// components/photographers/PhotographerGallery.tsx
```

#### 6.3 작가 페이지 구현
```typescript
// app/photographers/page.tsx - 작가 목록
// app/photographers/[id]/page.tsx - 작가 상세
// app/photographers/[id]/portfolio/page.tsx - 포트폴리오
```

### Phase 7: 예약 시스템 구현 (2-3일)

#### 7.1 예약 API 구현
```typescript
// app/api/booking/slots/[photographerId]/route.ts
export async function GET() {
  // 예약 가능한 시간 슬롯 반환
}

// app/api/booking/inquiries/route.ts
export async function POST() {
  // 새로운 예약 요청 생성
}
```

#### 7.2 예약 컴포넌트 구현
```typescript
// components/booking/BookingFlow.tsx
// components/booking/SlotSelection.tsx
// components/booking/UserInfoForm.tsx
// components/booking/BookingConfirmation.tsx
```

#### 7.3 예약 페이지 구현
```typescript
// app/photographers/[id]/booking/page.tsx - 예약 페이지
// app/booking/[inquiryId]/page.tsx - 예약 확인 페이지
```

### Phase 8: 관리자 시스템 구현 (3-4일)

#### 8.1 인증 시스템 구현
```typescript
// app/api/auth/login/route.ts
// app/api/auth/logout/route.ts
// components/auth/LoginForm.tsx
```

**참고 문서**:
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)

#### 8.2 관리자 컴포넌트 구현
```typescript
// components/admin/PortfolioManager.tsx
// components/admin/BookingManager.tsx
// components/admin/SlotManager.tsx
```

#### 8.3 관리자 페이지 구현
```typescript
// app/admin/login/page.tsx - 로그인
// app/admin/page.tsx - 대시보드
// app/admin/portfolio/page.tsx - 포트폴리오 관리
// app/admin/bookings/page.tsx - 예약 관리
// app/admin/slots/page.tsx - 시간 슬롯 관리
```

### Phase 9: 실시간 기능 구현 (1-2일)

#### 9.1 실시간 업데이트 구현
```typescript
// hooks/useRealtime.ts
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useRealtimeUpdates(table: string, callback: Function) {
  // Supabase Realtime 구독
}
```

**참고 문서**:
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

### Phase 10: 최적화 및 배포 (2-3일)

#### 10.1 성능 최적화
```typescript
// 이미지 최적화
import Image from 'next/image'

// 코드 스플리팅
import dynamic from 'next/dynamic'
const DynamicComponent = dynamic(() => import('./Component'))

// 메모이제이션
import { memo, useMemo, useCallback } from 'react'
```

**참고 문서**:
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

#### 10.2 SEO 최적화
```typescript
// app/layout.tsx 또는 개별 페이지에서
export const metadata: Metadata = {
  title: 'Photo4You - 성향 진단 기반 스냅 사진 플랫폼',
  description: '나만의 사진 스타일을 찾고 완벽한 작가와 매칭되세요',
  // ... 기타 메타데이터
}
```

**참고 문서**:
- [Next.js SEO](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

#### 10.3 Vercel 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결 및 배포
vercel

# 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... 기타 환경 변수들
```

**참고 문서**:
- [Vercel 배포 가이드](https://vercel.com/docs/deployments/overview)
- [Next.js Vercel 배포](https://nextjs.org/docs/app/building-your-application/deploying)

## 🧪 테스팅 가이드

### 단위 테스트 설정
```bash
# Jest 및 Testing Library 설치
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D jest-environment-jsdom
```

**참고 문서**:
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### E2E 테스트 설정
```bash
# Playwright 설치
npm install -D @playwright/test
npx playwright install
```

**참고 문서**:
- [Playwright 공식 문서](https://playwright.dev/docs/intro)

## 🔍 디버깅 및 모니터링

### 에러 추적
```bash
# Sentry 설치 (선택사항)
npm install @sentry/nextjs
```

**참고 문서**:
- [Sentry Next.js 가이드](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

### 성능 모니터링
```typescript
// Next.js 내장 성능 측정
export function reportWebVitals(metric: NextWebVitalsMetric) {
  console.log(metric)
}
```

**참고 문서**:
- [Next.js Web Vitals](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)

## 📦 주요 패키지 및 버전

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "tailwindcss": "^3.3.0",
    "@radix-ui/react-*": "^1.0.0",
    "lucide-react": "^0.290.0",
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.0",
    "date-fns": "^2.30.0"
  }
}
```

## 🚨 중요 고려사항

### 보안
- RLS 정책을 반드시 설정하여 데이터 보안 확보
- API 키는 환경 변수로만 관리
- 사용자 입력 데이터는 항상 검증

### 성능
- 이미지 최적화 (Next.js Image 컴포넌트 사용)
- 적절한 캐싱 전략 구현
- 코드 스플리팅으로 번들 크기 최적화

### 사용자 경험
- 로딩 상태 및 에러 상태 UI 구현
- 오프라인 상황 고려
- 접근성 가이드라인 준수

이 가이드를 따라 단계적으로 구현하면 안정적이고 확장 가능한 Photo4You 플랫