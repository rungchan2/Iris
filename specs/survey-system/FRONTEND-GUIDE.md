# 📸 매칭 시스템 프론트엔드 개발 계획

## 🎯 개발 목표

10문항 설문 기반 사진작가 매칭 시스템의 완전한 프론트엔드 구현
- 익명 사용자 매칭 플로우 (로그인 불필요)
- 4차원 점수 기반 매칭 결과 시각화
- 관리자용 매칭 시스템 설정 도구

---

## 📋 전체 개발 단계

### Phase 1: 기반 구축 (1-2주)
### Phase 2: 매칭 플로우 구현 (2-3주)  
### Phase 3: 관리자 도구 (1-2주)
### Phase 4: 최적화 및 분석 (1주)

---

## Phase 1: 기반 구축

### 1.1 TypeScript 타입 정의

**작업 내용:**
- Supabase 스키마에서 TypeScript 타입 생성
- 매칭 시스템 전용 인터페이스 정의

**체크리스트:**
- [ ] `npm run gen-types` 실행하여 최신 DB 타입 생성
- [ ] `types/matching.types.ts` 파일 생성
- [ ] 매칭 세션, 결과, 질문 인터페이스 정의
- [ ] 4차원 점수 타입 정의

**구현 세부사항:**
```typescript
// types/matching.types.ts
export interface MatchingSession {
  id: string;
  session_token: string;
  responses: Record<string, any>;
  subjective_text?: string;
  completed_at?: string;
}

export interface MatchingResult {
  photographer_id: string;
  style_emotion_score: number;
  communication_psychology_score: number;
  purpose_story_score: number;
  companion_score: number;
  total_score: number;
  rank_position: number;
}

export interface PhotographerProfile4D {
  photographer_id: string;
  style_emotion_description?: string;
  communication_psychology_description?: string;
  purpose_story_description?: string;
  companion_description?: string;
  profile_completed: boolean;
}
```

### 1.2 Supabase 클라이언트 설정

**작업 내용:**
- 매칭 시스템용 데이터베이스 쿼리 함수 구현
- 익명 접근을 위한 RLS 정책 테스트

**체크리스트:**
- [ ] `lib/supabase/matching.ts` 파일 생성
- [ ] 설문 질문/선택지 조회 함수 구현
- [ ] 매칭 세션 생성/조회 함수 구현
- [ ] 매칭 결과 조회 함수 구현
- [ ] 익명 사용자 액세스 테스트

**구현 세부사항:**
```typescript
// lib/supabase/matching.ts
export async function getSurveyQuestions() {
  const { data, error } = await supabase
    .from('survey_questions')
    .select(`
      *,
      survey_choices(*),
      survey_images(*)
    `)
    .eq('is_active', true)
    .order('question_order');
  
  return { data, error };
}

export async function createMatchingSession(responses: any) {
  const sessionToken = generateSessionToken();
  const { data, error } = await supabase
    .from('matching_sessions')
    .insert({
      session_token: sessionToken,
      responses,
    })
    .select()
    .single();
  
  return { data, error };
}
```

### 1.3 OpenAI 임베딩 서비스

**작업 내용:**
- 실시간 텍스트 임베딩 생성 API 구현
- 관리자용 일괄 임베딩 재생성 도구

**체크리스트:**
- [ ] `lib/services/embedding.ts` 파일 생성
- [ ] OpenAI API 연동 함수 구현
- [ ] 에러 처리 및 재시도 로직 추가
- [ ] 임베딩 생성 큐 시스템 구현

**구현 세부사항:**
```typescript
// lib/services/embedding.ts
export async function generateTextEmbedding(text: string): Promise<number[]> {
  const response = await fetch('/api/embedding/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  
  const { embedding } = await response.json();
  return embedding;
}
```

---

## Phase 2: 매칭 플로우 구현

### 2.1 설문 질문 플로우 컴포넌트

**작업 내용:**
- 10개 질문을 순차적으로 보여주는 인터페이스
- 진행률 표시 및 이전/다음 네비게이션
- 반응형 디자인 및 애니메이션

**체크리스트:**
- [ ] `components/matching/QuestionFlow.tsx` 컴포넌트 생성
- [ ] `components/matching/QuestionCard.tsx` 개별 질문 컴포넌트
- [ ] `components/matching/ProgressBar.tsx` 진행률 표시
- [ ] 질문별 입력 검증 로직 구현
- [ ] 모바일 최적화 UI

**구현 세부사항:**
```typescript
// components/matching/QuestionFlow.tsx
export default function QuestionFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const { data: questions } = useSurveyQuestions();
  
  const handleAnswer = (questionKey: string, answer: any) => {
    setResponses(prev => ({ ...prev, [questionKey]: answer }));
  };
  
  const handleSubmit = async () => {
    // 매칭 세션 생성 및 결과 페이지 이동
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <ProgressBar current={currentStep + 1} total={questions.length} />
      <QuestionCard 
        question={questions[currentStep]}
        value={responses[questions[currentStep].question_key]}
        onChange={handleAnswer}
      />
    </div>
  );
}
```

### 2.2 개별 질문 유형별 컴포넌트

**작업 내용:**
- 단일 선택, 이미지 선택, 주관식 입력 컴포넌트
- 각 질문 유형별 최적화된 UI/UX

**체크리스트:**
- [ ] `SingleChoiceQuestion.tsx` - 일반 선택지 질문
- [ ] `ImageChoiceQuestion.tsx` - 이미지 선택 질문 (Q7)
- [ ] `TextAreaQuestion.tsx` - 주관식 질문 (Q10)
- [ ] 각 컴포넌트별 애니메이션 효과
- [ ] 접근성 고려 (키보드 네비게이션, 스크린 리더)

**구현 세부사항:**
```typescript
// components/matching/ImageChoiceQuestion.tsx
export default function ImageChoiceQuestion({ 
  images, 
  value, 
  onChange 
}: ImageChoiceProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {images.map(image => (
        <div 
          key={image.image_key}
          className={`cursor-pointer rounded-lg overflow-hidden transition-all ${
            value === image.image_key ? 'ring-4 ring-blue-500' : 'hover:scale-105'
          }`}
          onClick={() => onChange(image.image_key)}
        >
          <img 
            src={image.image_url} 
            alt={image.image_label}
            className="w-full h-48 object-cover"
          />
          <div className="p-3 text-center">
            <p className="font-medium">{image.image_label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 2.3 매칭 결과 화면

**작업 내용:**
- 4차원 점수 시각화
- 작가별 매칭 설명 및 하이라이트
- 작가 프로필 미리보기 및 문의 연결

**체크리스트:**
- [ ] `components/matching/MatchingResults.tsx` 메인 결과 화면
- [ ] `components/matching/PhotographerCard.tsx` 개별 작가 카드
- [ ] `components/matching/ScoreVisualization.tsx` 점수 시각화
- [ ] `components/matching/MatchingExplanation.tsx` 매칭 이유 설명
- [ ] 문의하기 버튼 연동

**구현 세부사항:**
```typescript
// components/matching/PhotographerCard.tsx
export default function PhotographerCard({ 
  result, 
  photographer, 
  onContact 
}: PhotographerCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
            result.rank_position === 1 ? 'bg-yellow-500' : 
            result.rank_position === 2 ? 'bg-gray-400' : 
            result.rank_position === 3 ? 'bg-orange-400' : 'bg-gray-300'
          }`}>
            {result.rank_position}
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{photographer.name}</h3>
          
          {/* 4차원 점수 시각화 */}
          <ScoreVisualization scores={result} />
          
          {/* 매칭 하이라이트 */}
          <MatchingExplanation result={result} />
          
          <button 
            onClick={() => onContact(photographer.id)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            문의하기
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2.4 매칭 알고리즘 API 구현

**작업 내용:**
- 서버 액션으로 매칭 로직 구현
- 4차원 점수 계산 및 순위 결정
- 성능 로깅 및 에러 처리

**체크리스트:**
- [ ] `lib/actions/matching.ts` 서버 액션 구현
- [ ] 하드 필터링 로직 (지역, 예산, 동반자)
- [ ] 임베딩 유사도 계산
- [ ] 키워드 보너스 점수 적용
- [ ] 최종 순위 결정 및 결과 저장

**구현 세부사항:**
```typescript
// lib/actions/matching.ts
export async function executeMatching(sessionId: string) {
  try {
    // 1. 사용자 세션 데이터 조회
    const session = await getMatchingSession(sessionId);
    
    // 2. 하드 필터 적용
    const candidates = await getFilteredPhotographers(session.responses);
    
    // 3. 각 후보별 4차원 점수 계산
    const results = await Promise.all(
      candidates.map(async photographer => {
        const scores = await calculate4DScore(session, photographer);
        return {
          photographer_id: photographer.id,
          ...scores,
          total_score: calculateTotalScore(scores)
        };
      })
    );
    
    // 4. 순위 결정 및 저장
    const rankedResults = results
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, 20)
      .map((result, index) => ({
        ...result,
        rank_position: index + 1
      }));
    
    await saveMatchingResults(sessionId, rankedResults);
    return rankedResults;
    
  } catch (error) {
    console.error('Matching error:', error);
    throw error;
  }
}
```

---

## Phase 3: 관리자 도구

### 3.1 질문 관리 인터페이스

**작업 내용:**
- 질문/선택지 CRUD 인터페이스
- 임베딩 자동 재생성 시스템
- 가중치 설정 도구

**체크리스트:**
- [ ] `app/admin/matching/questions/page.tsx` 질문 관리 페이지
- [ ] `components/admin/matching/QuestionEditor.tsx` 질문 편집기
- [ ] `components/admin/matching/ChoiceManager.tsx` 선택지 관리
- [ ] `components/admin/matching/WeightSettings.tsx` 가중치 설정
- [ ] 실시간 임베딩 상태 표시

**구현 세부사항:**
```typescript
// components/admin/matching/QuestionEditor.tsx
export default function QuestionEditor() {
  const { data: questions, refetch } = useSurveyQuestions();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const handleUpdateChoice = async (choiceId: string, newText: string) => {
    // 1. 선택지 텍스트 업데이트
    await updateSurveyChoice(choiceId, { choice_label: newText });
    
    // 2. 임베딩 재생성 작업 큐에 추가
    await createEmbeddingJob('choice_embedding', choiceId);
    
    refetch();
  };
  
  return (
    <div className="space-y-6">
      {questions.map(question => (
        <QuestionCard key={question.id}>
          <h3>{question.question_title}</h3>
          <ChoiceList 
            choices={question.survey_choices}
            onUpdate={handleUpdateChoice}
          />
        </QuestionCard>
      ))}
    </div>
  );
}
```

### 3.2 작가 프로필 관리

**작업 내용:**
- 4차원 프로필 작성 인터페이스
- 프로필 완성도 체크
- 키워드 관리 도구

**체크리스트:**
- [ ] `app/admin/matching/photographers/page.tsx` 작가 관리 페이지
- [ ] `components/admin/matching/ProfileEditor4D.tsx` 4차원 프로필 편집기
- [ ] `components/admin/matching/KeywordManager.tsx` 키워드 관리
- [ ] `components/admin/matching/ProfileCompleteness.tsx` 완성도 표시
- [ ] 일괄 임베딩 생성 도구

### 3.3 매칭 성능 분석

**작업 내용:**
- 매칭 결과 통계 대시보드
- A/B 테스트 관리
- 사용자 피드백 분석

**체크리스트:**
- [ ] `app/admin/matching/analytics/page.tsx` 분석 대시보드
- [ ] `components/admin/matching/MatchingStats.tsx` 통계 차트
- [ ] `components/admin/matching/ABTestManager.tsx` A/B 테스트 도구
- [ ] `components/admin/matching/FeedbackAnalysis.tsx` 피드백 분석
- [ ] 성능 지표 모니터링

---

## Phase 4: 최적화 및 분석

### 4.1 성능 최적화

**작업 내용:**
- 페이지 로딩 속도 최적화
- 이미지 최적화 및 지연 로딩
- API 응답 캐싱 전략

**체크리스트:**
- [ ] React Query 캐싱 전략 구현
- [ ] 이미지 최적화 (Next.js Image 컴포넌트)
- [ ] 코드 스플리팅 적용
- [ ] SEO 메타태그 설정
- [ ] 로딩 상태 및 스켈레톤 UI

### 4.2 사용자 경험 개선

**작업 내용:**
- 접근성 개선
- 모바일 최적화
- 에러 처리 및 사용자 가이드

**체크리스트:**
- [ ] WCAG 접근성 가이드라인 준수
- [ ] 키보드 네비게이션 지원
- [ ] 에러 바운더리 및 폴백 UI
- [ ] 사용자 도움말 및 툴팁
- [ ] 다국어 지원 준비

### 4.3 테스트 및 배포

**작업 내용:**
- 단위 테스트 및 통합 테스트
- E2E 테스트 시나리오
- 프로덕션 배포 준비

**체크리스트:**
- [ ] Jest 단위 테스트 작성
- [ ] React Testing Library 컴포넌트 테스트
- [ ] Playwright E2E 테스트 구현
- [ ] 매칭 알고리즘 정확성 테스트
- [ ] 프로덕션 환경 설정 검증

---

## 🔧 개발 환경 설정

### 필수 패키지 설치
```bash
# 매칭 시스템 관련 패키지
npm install @tanstack/react-query openai
npm install framer-motion # 애니메이션
npm install recharts # 차트 라이브러리
npm install date-fns # 날짜 유틸리티

# 개발/테스트 패키지
npm install -D @types/jest jest @testing-library/react
npm install -D playwright @playwright/test
```

### 환경 변수 설정
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📊 프로젝트 마일스톤

### 주차별 목표

**1주차**: TypeScript 타입 정의, Supabase 연동, 기본 UI 컴포넌트
**2주차**: 설문 플로우 완성, 개별 질문 컴포넌트 구현
**3주차**: 매칭 알고리즘 구현, 결과 화면 개발
**4주차**: 관리자 도구 개발 (질문 관리, 작가 프로필)
**5주차**: 성능 분석 도구,
**6주차**: 최적화, 테스트, 버그 수정, 배포 준비

### 품질 체크포인트

**기능 완성도**: 모든 매칭 플로우 정상 동작
**성능**: 매칭 결과 3초 이내 응답
**사용자 경험**: 모바일/데스크톱 완벽 지원
**관리 편의성**: 관리자가 쉽게 설정 변경 가능
**확장성**: V2/V3 분석 시스템 기반 구축

---

이 개발 계획을 따라 단계적으로 구현하면 완전한 매칭 시스템을 구축할 수 있습니다. 각 단계별로 테스트를 진행하고, 사용자 피드백을 수집하여 지속적으로 개선해나가는 것이 중요합니다.