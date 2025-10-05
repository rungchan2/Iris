# Design System - kindt

## 🎨 디자인 철학

### 핵심 디자인 컨셉
**"따뜻하고 개인화된 발견의 여정"**

- **따뜻함**: 친근하고 접근하기 쉬운 감성
- **개인화**: 각자의 성향에 맞는 맞춤형 경험
- **발견**: 새로운 자신을 찾아가는 즐거운 과정
- **신뢰**: 전문적이고 안정적인 서비스 품질

### 디자인 원칙
1. **직관적 사용성**: 복잡한 과정을 단순하고 명확하게
2. **감정적 연결**: 사용자의 감정에 공감하고 반응하는 UI
3. **개성 표현**: 9가지 성격유형의 고유한 특성 반영
4. **일관성**: 전체 여정에서 통일된 경험 제공

## 🌈 컬러 시스템

### Primary Colors (메인 브랜드 컬러)
```scss
// Primary Orange - 따뜻하고 친근한 브랜드 색상
$primary-50: #FFF7ED;   // 가장 연한 배경
$primary-100: #FFEDD5;  // 연한 배경
$primary-200: #FED7AA;  // 연한 accent
$primary-300: #FDBA74;  // 부드러운 accent
$primary-400: #FB923C;  // 중간 accent
$primary-500: #F97316;  // 메인 브랜드 컬러 ⭐
$primary-600: #EA580C;  // 진한 primary
$primary-700: #C2410C;  // 더 진한 primary
$primary-800: #9A3412;  // 가장 진한 primary
$primary-900: #7C2D12;  // 텍스트용 진한 색상
```

### Personality Colors (성격유형별 컬러)
```scss
// A1: 고요한 관찰자 - 차분하고 안정적인 그레이
$personality-a1: #6B7280;
$personality-a1-light: #F9FAFB;
$personality-a1-dark: #374151;

// A2: 따뜻한 동행자 - 따뜻한 주황/노랑
$personality-a2: #F59E0B;
$personality-a2-light: #FFFBEB;
$personality-a2-dark: #D97706;

// B1: 감성 기록자, 내추럴 힐러 - 자연스러운 그린
$personality-b1: #10B981;
$personality-b1-light: #ECFDF5;
$personality-b1-dark: #047857;

// C1: 시네마틱 몽상가, 시크한 미니멀리스트 - 시크한 블루
$personality-c1: #3B82F6;
$personality-c1-light: #EFF6FF;
$personality-c1-dark: #1D4ED8;

// D1: 활력 가득 리더, 캐주얼 낙천주의자 - 에너지 레드
$personality-d1: #EF4444;
$personality-d1-light: #FEF2F2;
$personality-d1-dark: #DC2626;

// E1: 도시의 드리머 - 도시적 퍼플
$personality-e1: #8B5CF6;
$personality-e1-light: #F5F3FF;
$personality-e1-dark: #7C3AED;

// E2: 무심한 예술가 - 예술적 인디고
$personality-e2: #6366F1;
$personality-e2-light: #EEF2FF;
$personality-e2-dark: #4F46E5;

// F1: 자유로운 탐험가 - 자유로운 오렌지
$personality-f1: #F97316;
$personality-f1-light: #FFF7ED;
$personality-f1-dark: #EA580C;

// F2: 감각적 실험가 - 실험적 핑크
$personality-f2: #EC4899;
$personality-f2-light: #FDF2F8;
$personality-f2-dark: #DB2777;
```

### Neutral Colors (기본 색상)
```scss
// Gray Scale
$gray-50: #F9FAFB;   // 배경색
$gray-100: #F3F4F6;  // 연한 배경
$gray-200: #E5E7EB;  // 구분선, 비활성
$gray-300: #D1D5DB;  // 테두리
$gray-400: #9CA3AF;  // Placeholder
$gray-500: #6B7280;  // 보조 텍스트
$gray-600: #4B5563;  // 본문 텍스트
$gray-700: #374151;  // 제목 텍스트
$gray-800: #1F2937;  // 강조 텍스트
$gray-900: #111827;  // 최고 강조 텍스트

// Semantic Colors
$success: #10B981;   // 성공 메시지
$warning: #F59E0B;   // 경고 메시지
$error: #EF4444;     // 오류 메시지
$info: #3B82F6;      // 정보 메시지
```

## 🔤 타이포그래피

### 폰트 패밀리
```scss
// Primary Font - 한글 최적화
$font-primary: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;

// Secondary Font - 영문 및 숫자
$font-secondary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

// Monospace - 코드 및 특수 표시
$font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 폰트 크기 및 행간
```scss
// Heading Styles
$text-5xl: 3rem;      // 48px - 메인 타이틀
$text-4xl: 2.25rem;   // 36px - 섹션 타이틀
$text-3xl: 1.875rem;  // 30px - 서브 타이틀
$text-2xl: 1.5rem;    // 24px - 큰 제목
$text-xl: 1.25rem;    // 20px - 제목
$text-lg: 1.125rem;   // 18px - 큰 본문
$text-base: 1rem;     // 16px - 기본 본문
$text-sm: 0.875rem;   // 14px - 작은 텍스트
$text-xs: 0.75rem;    // 12px - 캡션

// Line Heights
$leading-tight: 1.25;    // 제목용
$leading-normal: 1.5;    // 본문용
$leading-relaxed: 1.625; // 긴 글용

// Font Weights
$font-light: 300;
$font-normal: 400;
$font-medium: 500;
$font-semibold: 600;
$font-bold: 700;
$font-extrabold: 800;
```

## 📐 스페이싱 & 레이아웃

### 스페이싱 스케일
```scss
// Spacing Scale (4px 기준)
$space-0: 0;          // 0px
$space-1: 0.25rem;    // 4px
$space-2: 0.5rem;     // 8px
$space-3: 0.75rem;    // 12px
$space-4: 1rem;       // 16px
$space-5: 1.25rem;    // 20px
$space-6: 1.5rem;     // 24px
$space-8: 2rem;       // 32px
$space-10: 2.5rem;    // 40px
$space-12: 3rem;      // 48px
$space-16: 4rem;      // 64px
$space-20: 5rem;      // 80px
$space-24: 6rem;      // 96px
$space-32: 8rem;      // 128px
```

### 컨테이너 & 그리드
```scss
// Container Sizes
$container-sm: 640px;   // 모바일
$container-md: 768px;   // 태블릿
$container-lg: 1024px;  // 데스크탑
$container-xl: 1280px;  // 큰 데스크탑
$container-2xl: 1536px; // 매우 큰 화면

// Breakpoints
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;
$breakpoint-2xl: 1536px;
```

## 🎭 컴포넌트 스타일

### 버튼 컴포넌트
```bash
# shadcn/ui 버튼 컴포넌트 사용
npx shadcn-ui@latest add button
```

```scss
// 커스텀 버튼 스타일
.btn-personality {
  @apply transition-all duration-200 rounded-lg font-medium;
  
  &.personality-a1 {
    @apply bg-gray-500 hover:bg-gray-600 text-white;
  }
  
  &.personality-a2 {
    @apply bg-amber-500 hover:bg-amber-600 text-white;
  }
  
  // ... 다른 성격유형들
}

// 진단 선택지 버튼
.choice-button {
  @apply w-full p-4 border-2 border-gray-200 rounded-lg text-left 
         hover:border-primary-500 hover:bg-primary-50 
         transition-all duration-200 cursor-pointer;
  
  &.selected {
    @apply border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-opacity-20;
  }
  
  &:disabled {
    @apply opacity-50 cursor-not-allowed;
  }
}
```

### 카드 컴포넌트
```bash
# shadcn/ui 카드 컴포넌트 사용
npx shadcn-ui@latest add card
```

```scss
// 성격유형 결과 카드
.personality-card {
  @apply bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden;
  
  .personality-header {
    @apply p-6 text-center;
    background: linear-gradient(135deg, var(--personality-light) 0%, var(--personality-primary) 100%);
    
    .personality-badge {
      @apply inline-block px-4 py-2 bg-white bg-opacity-90 rounded-full 
             text-sm font-medium mb-4;
      color: var(--personality-primary);
    }
    
    .personality-title {
      @apply text-2xl font-bold text-white mb-2;
    }
    
    .personality-subtitle {
      @apply text-white text-opacity-90;
    }
  }
  
  .personality-content {
    @apply p-6 space-y-4;
  }
}

// 작가 카드
.photographer-card {
  @apply bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden
         hover:shadow-lg hover:-translate-y-1 transition-all duration-300;
  
  .photographer-image {
    @apply aspect-square overflow-hidden;
    
    img {
      @apply w-full h-full object-cover hover:scale-105 transition-transform duration-300;
    }
  }
  
  .photographer-info {
    @apply p-4;
    
    .compatibility-badge {
      @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
             bg-primary-100 text-primary-800 mb-2;
    }
  }
}
```

### 폼 컴포넌트
```bash
# shadcn/ui 폼 관련 컴포넌트들
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add form
```

```scss
// 진단 질문 스타일
.quiz-question {
  @apply max-w-2xl mx-auto;
  
  .question-header {
    @apply text-center mb-8;
    
    .question-part {
      @apply inline-block px-3 py-1 rounded-full text-sm font-medium mb-4
             bg-primary-100 text-primary-800;
    }
    
    .question-text {
      @apply text-xl md:text-2xl font-semibold text-gray-800 leading-tight;
    }
  }
  
  .question-image {
    @apply mb-6 rounded-lg overflow-hidden;
    
    img {
      @apply w-full h-auto;
    }
  }
  
  .choices-grid {
    @apply grid gap-3;
    
    &.text-only {
      @apply grid-cols-1;
    }
    
    &.with-images {
      @apply grid-cols-1 md:grid-cols-2;
    }
  }
}
```

### 진행률 컴포넌트
```bash
# shadcn/ui 프로그레스 컴포넌트
npx shadcn-ui@latest add progress
```

```scss
// 진단 진행률 스타일
.quiz-progress {
  @apply mb-8;
  
  .progress-info {
    @apply flex justify-between items-center mb-2;
    
    .progress-text {
      @apply text-sm font-medium text-gray-600;
    }
    
    .progress-count {
      @apply text-sm text-gray-500;
    }
  }
  
  .progress-bar {
    @apply w-full bg-gray-200 rounded-full h-2 overflow-hidden;
    
    .progress-fill {
      @apply h-full bg-gradient-to-r from-primary-500 to-primary-600 
             rounded-full transition-all duration-500 ease-out;
    }
  }
}
```

## 🎨 AI 이미지 생성 UI

### 업로드 영역
```scss
## 🎨 AI 이미지 생성 UI

### 업로드 영역
```scss
.ai-upload-area {
  @apply border-2 border-dashed border-gray-300 rounded-xl p-8 text-center
         cursor-pointer hover:border-primary-500 hover:bg-primary-50
         transition-all duration-200;
  
  &.dragover {
    @apply border-primary-500 bg-primary-50;
  }
  
  .upload-icon {
    @apply w-12 h-12 mx-auto mb-4 text-gray-400;
  }
  
  .upload-text {
    @apply text-gray-600 mb-2;
  }
  
  .upload-hint {
    @apply text-sm text-gray-400;
  }
}

// AI 생성 중 상태
.ai-generating {
  @apply bg-white rounded-xl p-8 text-center border border-gray-200;
  
  .generating-spinner {
    @apply w-8 h-8 mx-auto mb-4 text-primary-500 animate-spin;
  }
  
  .generating-text {
    @apply text-gray-600 mb-2;
  }
  
  .generating-hint {
    @apply text-sm text-gray-400;
  }
}

// AI 생성 결과
.ai-result {
  @apply bg-white rounded-xl overflow-hidden border border-gray-200;
  
  .result-image {
    @apply aspect-square w-full;
    
    img {
      @apply w-full h-full object-cover;
    }
  }
  
  .result-actions {
    @apply p-4 flex gap-2;
    
    .action-btn {
      @apply flex-1 py-2 px-4 rounded-lg font-medium text-sm
             transition-colors duration-200;
      
      &.download {
        @apply bg-primary-500 text-white hover:bg-primary-600;
      }
      
      &.regenerate {
        @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
      }
    }
  }
}
```

### 갤러리 그리드
```scss
.personality-gallery {
  @apply grid grid-cols-2 md:grid-cols-3 gap-4 mb-8;
  
  .gallery-item {
    @apply aspect-square rounded-lg overflow-hidden cursor-pointer
           hover:opacity-90 transition-opacity duration-200;
    
    img {
      @apply w-full h-full object-cover;
    }
  }
}

// 이미지 라이트박스
.image-lightbox {
  @apply fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center
         z-50 p-4;
  
  .lightbox-content {
    @apply max-w-4xl max-h-full;
    
    img {
      @apply max-w-full max-h-full object-contain;
    }
  }
  
  .lightbox-close {
    @apply absolute top-4 right-4 w-8 h-8 text-white hover:text-gray-300
           cursor-pointer;
  }
}
```

## 🎭 애니메이션 & 트랜지션

### 기본 애니메이션
```scss
// 페이드 인 애니메이션
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

// 슬라이드 업 애니메이션
@keyframes slideUp {
  from { 
    transform: translateY(20px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}

.slide-up {
  animation: slideUp 0.3s ease-out;
}

// 스케일 인 애니메이션
@keyframes scaleIn {
  from { 
    transform: scale(0.95); 
    opacity: 0; 
  }
  to { 
    transform: scale(1); 
    opacity: 1; 
  }
}

.scale-in {
  animation: scaleIn 0.2s ease-out;
}

// 부드러운 바운스
@keyframes gentleBounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.gentle-bounce {
  animation: gentleBounce 2s infinite;
}
```

### 로딩 애니메이션
```scss
// 스피너
.spinner {
  @apply animate-spin rounded-full border-4 border-gray-200 border-t-primary-500;
}

// 펄스 로딩
.pulse-loading {
  @apply animate-pulse bg-gray-200 rounded;
}

// 스켈레톤 로딩
.skeleton {
  @apply bg-gray-200 rounded animate-pulse;
  
  &.text {
    @apply h-4 mb-2;
    
    &.title {
      @apply h-6 mb-4;
    }
  }
  
  &.image {
    @apply aspect-square;
  }
  
  &.button {
    @apply h-10 w-24;
  }
}
```

### 인터랙션 애니메이션
```scss
// 호버 효과
.hover-lift {
  @apply transition-transform duration-200;
  
  &:hover {
    @apply transform -translate-y-1;
  }
}

.hover-scale {
  @apply transition-transform duration-200;
  
  &:hover {
    @apply transform scale-105;
  }
}

.hover-glow {
  @apply transition-shadow duration-200;
  
  &:hover {
    @apply shadow-lg;
  }
}

// 클릭 피드백
.click-feedback {
  @apply transition-transform duration-100;
  
  &:active {
    @apply transform scale-95;
  }
}

// 선택 애니메이션
.choice-selected {
  @apply relative overflow-hidden;
  
  &::after {
    content: '';
    @apply absolute inset-0 bg-primary-500 opacity-20;
    animation: flashSuccess 0.3s ease-out;
  }
}

@keyframes flashSuccess {
  0% { opacity: 0; }
  50% { opacity: 0.3; }
  100% { opacity: 0; }
}
```

## 📱 반응형 디자인

### 모바일 우선 접근법
```scss
// 기본 모바일 스타일
.responsive-container {
  @apply px-4 py-6;
  
  // 태블릿 이상
  @media (min-width: 768px) {
    @apply px-6 py-8;
  }
  
  // 데스크탑 이상
  @media (min-width: 1024px) {
    @apply px-8 py-12;
  }
}

// 반응형 그리드
.responsive-grid {
  @apply grid grid-cols-1 gap-4;
  
  @media (min-width: 640px) {
    @apply grid-cols-2 gap-6;
  }
  
  @media (min-width: 1024px) {
    @apply grid-cols-3 gap-8;
  }
}

// 반응형 텍스트
.responsive-heading {
  @apply text-2xl font-bold;
  
  @media (min-width: 768px) {
    @apply text-3xl;
  }
  
  @media (min-width: 1024px) {
    @apply text-4xl;
  }
}
```

### 모바일 터치 최적화
```scss
// 터치 친화적 버튼 크기
.touch-friendly {
  @apply min-h-[44px] min-w-[44px]; // 최소 터치 영역
}

// 모바일 네비게이션
.mobile-nav {
  @apply fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200
         p-4 grid grid-cols-4 gap-1 z-40;
  
  .nav-item {
    @apply flex flex-col items-center justify-center p-2 rounded-lg
           text-xs font-medium text-gray-600 hover:bg-gray-50;
    
    &.active {
      @apply text-primary-600 bg-primary-50;
    }
    
    .nav-icon {
      @apply w-6 h-6 mb-1;
    }
  }
}
```

## 🌓 다크 모드 준비 (향후 확장)

### CSS 변수 기반 테마
```scss
:root {
  // 라이트 모드 (기본)
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --accent-color: #f97316;
}

[data-theme="dark"] {
  // 다크 모드
  --bg-primary: #1f2937;
  --bg-secondary: #111827;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --border-color: #374151;
  --accent-color: #fb923c;
}

// 테마 변수 사용
.themed-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-color);
}
```

## 🎨 성격유형별 테마 시스템

### CSS 변수를 활용한 동적 테마
```scss
// 성격유형별 CSS 변수
:root {
  --personality-primary: #f97316;
  --personality-light: #fff7ed;
  --personality-dark: #ea580c;
}

[data-personality="a1"] {
  --personality-primary: #6b7280;
  --personality-light: #f9fafb;
  --personality-dark: #374151;
}

[data-personality="a2"] {
  --personality-primary: #f59e0b;
  --personality-light: #fffbeb;
  --personality-dark: #d97706;
}

// ... 다른 성격유형들

// 테마 적용 컴포넌트
.personality-themed {
  &.result-card {
    border-color: var(--personality-primary);
    
    .card-header {
      background: linear-gradient(135deg, var(--personality-light) 0%, var(--personality-primary) 100%);
    }
  }
  
  &.cta-button {
    background-color: var(--personality-primary);
    
    &:hover {
      background-color: var(--personality-dark);
    }
  }
  
  &.badge {
    background-color: var(--personality-light);
    color: var(--personality-dark);
    border-color: var(--personality-primary);
  }
}
```

## 🎯 아이콘 시스템

### Lucide React 아이콘 사용
```bash
# 이미 설치되어 있는 lucide-react 활용
npm install lucide-react
```

```typescript
// 주요 아이콘들
import {
  Camera,           // 사진 관련
  Heart,            // 좋아요, 선호
  User,             // 사용자
  Users,            // 사용자들
  Star,             // 평점, 추천
  Clock,            // 시간
  Calendar,         // 일정
  MapPin,           // 위치
  Phone,            // 연락처
  Mail,             // 이메일
  ArrowRight,       // 다음
  ArrowLeft,        // 이전
  Check,            // 완료
  X,                // 닫기
  Plus,             // 추가
  Minus,            // 제거
  Edit,             // 편집
  Trash,            // 삭제
  Download,         // 다운로드
  Upload,           // 업로드
  Share,            // 공유
  Settings,         // 설정
  Menu,             // 메뉴
  Search,           // 검색
  Filter,           // 필터
  Sort,             // 정렬
  Grid,             // 그리드 뷰
  List,             // 리스트 뷰
  Image,            // 이미지
  Play,             // 재생
  Pause,            // 일시정지
  RefreshCw,        // 새로고침
  Loader,           // 로딩
  AlertCircle,      // 경고
  CheckCircle,      // 성공
  XCircle,          // 오류
  Info,             // 정보
} from 'lucide-react'
```

### 커스텀 아이콘 스타일
```scss
.icon {
  @apply inline-block;
  
  &.xs { @apply w-3 h-3; }
  &.sm { @apply w-4 h-4; }
  &.md { @apply w-5 h-5; }
  &.lg { @apply w-6 h-6; }
  &.xl { @apply w-8 h-8; }
  &.2xl { @apply w-10 h-10; }
  
  // 컬러 변형
  &.primary { @apply text-primary-500; }
  &.secondary { @apply text-gray-500; }
  &.success { @apply text-green-500; }
  &.warning { @apply text-yellow-500; }
  &.error { @apply text-red-500; }
  &.info { @apply text-blue-500; }
}
```

## 🎨 그래픽 요소

### 그라데이션
```scss
// 브랜드 그라데이션
.gradient-primary {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.gradient-warm {
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
}

// 성격유형별 그라데이션
.gradient-personality {
  background: linear-gradient(135deg, var(--personality-light) 0%, var(--personality-primary) 100%);
}

// 애니메이션 그라데이션
.gradient-animated {
  background: linear-gradient(-45deg, #f97316, #ea580c, #f97316, #fb923c);
  background-size: 400% 400%;
  animation: gradientShift 4s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

### 그림자 시스템
```scss
// 그림자 레벨
.shadow-subtle {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.shadow-soft {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.shadow-medium {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
              0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.shadow-strong {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.shadow-dramatic {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

// 컬러 그림자
.shadow-primary {
  box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.1), 
              0 4px 6px -2px rgba(249, 115, 22, 0.05);
}
```

## 📄 페이지별 디자인 가이드

### 홈페이지
```scss
.hero-section {
  @apply bg-gradient-to-br from-primary-50 to-primary-100 py-16 lg:py-24;
  
  .hero-content {
    @apply text-center max-w-4xl mx-auto px-4;
    
    .hero-title {
      @apply text-4xl lg:text-6xl font-bold text-gray-900 mb-6;
      
      .highlight {
        @apply text-primary-600;
      }
    }
    
    .hero-subtitle {
      @apply text-lg lg:text-xl text-gray-600 mb-8 max-w-2xl mx-auto;
    }
    
    .hero-cta {
      @apply inline-flex items-center px-8 py-4 bg-primary-600 text-white
             rounded-lg font-semibold text-lg hover:bg-primary-700
             transition-colors duration-200;
    }
  }
}
```

### 성향 진단 페이지
```scss
.quiz-layout {
  @apply min-h-screen bg-gray-50 py-8;
  
  .quiz-container {
    @apply max-w-2xl mx-auto px-4;
  }
  
  .quiz-card {
    @apply bg-white rounded-2xl shadow-lg p-8 mb-6;
  }
  
  .quiz-navigation {
    @apply flex justify-between items-center mt-8;
    
    .nav-button {
      @apply px-6 py-3 rounded-lg font-medium transition-colors duration-200;
      
      &.back {
        @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
      }
      
      &.next {
        @apply bg-primary-600 text-white hover:bg-primary-700;
      }
      
      &:disabled {
        @apply opacity-50 cursor-not-allowed;
      }
    }
  }
}
```

### 결과 페이지
```scss
.result-layout {
  @apply min-h-screen bg-gray-50;
  
  .result-hero {
    @apply py-16 text-center;
    background: linear-gradient(135deg, var(--personality-light) 0%, var(--personality-primary) 100%);
    
    .result-badge {
      @apply inline-block px-4 py-2 bg-white bg-opacity-90 rounded-full
             text-sm font-medium mb-4;
      color: var(--personality-primary);
    }
    
    .result-title {
      @apply text-3xl lg:text-4xl font-bold text-white mb-4;
    }
    
    .result-description {
      @apply text-lg text-white text-opacity-90 max-w-2xl mx-auto;
    }
  }
  
  .result-sections {
    @apply space-y-16 py-16;
    
    .section {
      @apply container mx-auto px-4;
      
      .section-title {
        @apply text-2xl lg:text-3xl font-bold text-center mb-8;
      }
    }
  }
}
```

이 디자인 시스템을 기반으로 일관되고 아름다운 kindt 인터페이스를 구축할 수 있습니다. shadcn/ui 컴포넌트들과 잘 어우러지면서도 브랜드 고유의 개성을 표현하는 디자인입니다.