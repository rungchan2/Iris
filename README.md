# 🌅 Sunset Gallery

## 프로젝트 개요
영화적 감성의 프로필 사진 촬영 문의 관리 시스템입니다. 사진작가들이 고객의 선호도에 따라 포트폴리오를 보여주고, 고객은 원하는 분위기, 스타일, 장소를 선택한 후 관련 사진 레퍼런스를 확인할 수 있습니다.

## 🛠 기술 스택
- **프론트엔드**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **백엔드**: Supabase (PostgreSQL, Auth, Storage)
- **배포**: Vercel
- **이미지 저장소**: Supabase Storage (Pro 플랜 100GB 포함)

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+ 
- npm 또는 yarn
- Supabase 계정

### 설치 및 실행

1. 저장소 클론
```bash
git clone https://github.com/your-username/sunset-gallery.git
cd sunset-gallery
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

4. 개발 서버 실행
```bash
npm run dev
```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📋 주요 기능

### 고객용 기능
- 📝 촬영 문의 양식 작성
- 🎨 분위기 및 스타일 선택
- 📅 촬영 일정 예약
- 🖼️ 카테고리별 포트폴리오 조회

### 관리자용 기능
- 👥 문의 관리 및 상태 추적
- 📂 카테고리 및 사진 관리
- 📊 예약 현황 관리
- ⏰ 촬영 가능 시간 설정

## 🗄️ 데이터베이스 구조

### 주요 테이블
- `admin_users`: 관리자 정보
- `categories`: 계층적 카테고리 구조 (최대 10단계)
- `photos`: 사진 정보 및 메타데이터
- `photo_categories`: 사진-카테고리 다대다 관계
- `available_slots`: 촬영 가능 시간대
- `inquiries`: 고객 문의 정보
- `keywords`: 분위기 키워드

## 🎯 성능 최적화

- React Server Components 기본 사용
- 대용량 리스트를 위한 가상 스크롤링
- Intersection Observer를 활용한 이미지 지연 로딩
- 카테고리 트리 구조 캐싱
- 더 나은 UX를 위한 낙관적 업데이트

## 📝 스크립트 명령어

```bash
# 개발 서버 실행 (Turbopack 사용)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린트 검사
npm run lint
```

## 🔧 개발 환경

- **Node.js**: 20+
- **TypeScript**: 5+
- **ESLint**: 코드 품질 관리
- **Tailwind CSS**: 스타일링
- **React Query**: 서버 상태 관리

## 📁 프로젝트 구조
