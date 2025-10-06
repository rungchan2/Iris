# SEO Setup Documentation

## Overview

kindt 프로젝트의 완전한 SEO 최적화가 완료되었습니다. 이 문서는 구현된 SEO 전략과 구성 요소를 설명합니다.

## 📋 구현된 SEO 기능

### 1. 기본 인프라

#### Sitemap (app/sitemap.ts)
- **동적 사이트맵 생성**: 모든 승인된 작가 페이지 자동 포함
- **우선순위 설정**:
  - 홈페이지: 1.0 (최우선)
  - 매칭 페이지: 0.9
  - 작가 목록: 0.8
  - 개별 작가 페이지: 0.8
  - 갤러리: 0.7
- **업데이트 빈도**:
  - 홈/작가 목록: daily
  - 매칭/갤러리: weekly
  - 작가 페이지: weekly

#### Robots.txt (app/robots.ts)
- **크롤링 허용**:
  - 모든 public 페이지 크롤링 허용
  - 사이트맵 자동 참조
- **크롤링 제외**:
  - /admin/ (관리자 페이지)
  - /api/ (API 엔드포인트)
  - /login/ (로그인 페이지)
  - /photographers/profile (작가 프로필 편집)
  - /_next/ (Next.js 내부 파일)

### 2. 메타데이터 시스템

#### 전역 메타데이터 (app/layout.tsx)
```typescript
{
  title: {
    default: "kindt | 나만의 성향을 찾아가는 포토 여정",
    template: "%s | kindt"
  },
  description: "AI 성향 진단으로 당신에게 딱 맞는 사진 스타일과 전문 작가를 추천해드립니다...",
  keywords: [
    "사진작가 추천", "포토그래퍼 매칭", "AI 사진작가 매칭",
    "사진 촬영 예약", "프로필 사진", "웨딩 촬영",
    "가족 사진", "스냅 사진", "포토그래퍼 찾기", "사진 스타일 진단"
  ]
}
```

#### 페이지별 메타데이터 (/lib/seo/metadata.ts)
모든 주요 페이지에 대한 동적 메타데이터 생성:

1. **작가 상세 페이지**:
   - 작가 이름 + 전문 분야 포함
   - 동적 description 생성
   - 작가별 Open Graph 이미지

2. **매칭 페이지**:
   - SEO 최적화된 제목/설명
   - FAQ 키워드 포함

3. **작가 목록 페이지**:
   - 카테고리별 키워드
   - 검색 최적화 설명

### 3. 구조화된 데이터 (JSON-LD)

#### 전역 스키마 (모든 페이지에 포함)
1. **Organization Schema**:
   - 회사 정보
   - 로고 및 연락처

2. **LocalBusiness Schema**:
   - 비즈니스 유형 및 위치
   - 영업 시간
   - 가격 범위

3. **WebSite Schema**:
   - 검색 기능 통합
   - 사이트 메타데이터

#### 페이지별 스키마

**작가 상세 페이지**:
```json
{
  "@type": "Person",
  "name": "작가 이름",
  "jobTitle": "포토그래퍼",
  "knowsAbout": ["사진 촬영", "전문 분야"],
  "worksFor": { "@type": "Organization", "name": "kindt" }
}
```

**작가 서비스 스키마**:
```json
{
  "@type": "Service",
  "name": "작가명 사진 촬영 서비스",
  "provider": { "@type": "Person", "name": "작가명" },
  "serviceType": "전문 분야",
  "areaServed": { "@type": "Country", "name": "대한민국" }
}
```

**매칭 페이지 FAQ**:
```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "kindt의 AI 매칭은 어떻게 작동하나요?",
      "acceptedAnswer": { ... }
    }
  ]
}
```

**Breadcrumb Navigation**:
- 모든 작가 페이지에 breadcrumb 스키마 포함
- 검색 엔진 탐색 경로 최적화

### 4. PWA 설정 (manifest.json)

```json
{
  "name": "kindt",
  "short_name": "kindt",
  "description": "AI 성향 진단으로 당신에게 딱 맞는 사진 스타일과 전문 작가를 추천해드립니다",
  "theme_color": "#9333ea",
  "background_color": "#ffffff",
  "display": "standalone",
  "categories": ["photography", "lifestyle", "productivity"]
}
```

### 5. Open Graph & Twitter Cards

모든 페이지에 다음 포함:
- Open Graph 이미지 (1200x630)
- Twitter Card (summary_large_image)
- 동적 title/description
- 한국어 locale 설정 (ko_KR)

## 🎯 SEO 키워드 전략

### 핵심 타겟 키워드
1. **매칭 관련**:
   - "사진작가 추천"
   - "포토그래퍼 매칭"
   - "AI 사진작가 매칭"
   - "사진 스타일 진단"

2. **서비스 카테고리**:
   - "프로필 사진"
   - "웨딩 촬영"
   - "가족 사진"
   - "스냅 사진"

3. **액션 키워드**:
   - "사진 촬영 예약"
   - "포토그래퍼 찾기"
   - "작가 예약"

### 작가별 SEO 최적화
- 작가 이름 + 전문 분야 조합
- 지역 + 서비스 타입 (예: "서울 웨딩 사진작가")
- 작가 specialty 키워드 자동 포함

## 📊 검색 엔진 최적화 체크리스트

### ✅ 완료된 항목
- [x] Dynamic sitemap.xml 생성
- [x] robots.txt 설정
- [x] 모든 페이지 메타데이터
- [x] Open Graph 태그
- [x] Twitter Card 태그
- [x] JSON-LD 구조화된 데이터
- [x] PWA manifest.json
- [x] Canonical URLs
- [x] 작가별 동적 메타데이터
- [x] 다국어 설정 (lang="ko")
- [x] 시맨틱 HTML 구조

### 🔄 향후 개선 사항
- [ ] Google Search Console 연동
- [ ] 네이버 웹마스터 도구 연동
- [ ] 성능 모니터링 (Core Web Vitals)
- [ ] 작가별 리뷰 리치 스니펫
- [ ] 이미지 alt 텍스트 자동화
- [ ] Schema.org AggregateRating 실제 데이터 연동

## 🚀 검색 엔진 등록

### Google Search Console
1. https://search.google.com/search-console
2. 사이트맵 제출: `https://kindt.kr/sitemap.xml`
3. URL 검사 및 색인 요청

### 네이버 웹마스터 도구
1. https://searchadvisor.naver.com
2. 사이트 등록 및 소유 확인
3. 사이트맵 제출

### 기타 검색 엔진
- Bing Webmaster Tools
- Daum 검색등록

## 📈 모니터링 메트릭

### 추적해야 할 SEO 지표
1. **검색 노출**:
   - 핵심 키워드 순위
   - 작가 이름 검색 노출
   - 클릭률 (CTR)

2. **기술적 SEO**:
   - 페이지 로딩 속도
   - Core Web Vitals
   - 모바일 최적화 점수

3. **콘텐츠 성과**:
   - 페이지별 방문자 수
   - 이탈률
   - 평균 체류 시간

## 🔧 유지보수 가이드

### 정기 작업
1. **월간**:
   - 검색 순위 모니터링
   - 메타데이터 A/B 테스트
   - 키워드 트렌드 분석

2. **분기별**:
   - 구조화된 데이터 검증
   - 사이트맵 품질 검사
   - 경쟁사 SEO 분석

3. **새 작가 등록 시**:
   - 작가 프로필 완전성 확인
   - 포트폴리오 이미지 최적화
   - 전문 분야 키워드 설정

### 작가 프로필 SEO 체크리스트
- [ ] 프로필 사진 설정
- [ ] 4차원 설명 작성 (style_emotion, communication, purpose_story, companion)
- [ ] 전문 분야(specialty) 명확히 설정
- [ ] 포트폴리오 이미지 최소 3개 이상
- [ ] 이미지 alt 텍스트 작성
- [ ] 소개 영상 (선택사항)

## 📚 참고 문서

### 구현 파일 위치
- **SEO 유틸리티**: `/lib/seo/`
  - `metadata.ts`: 메타데이터 생성 함수
  - `structured-data.ts`: JSON-LD 스키마 생성

- **컴포넌트**: `/components/seo/`
  - `json-ld.tsx`: 구조화된 데이터 렌더링
  - `global-structured-data.tsx`: 전역 스키마
  - `matching-structured-data.tsx`: 매칭 페이지 스키마

- **인프라**:
  - `/app/sitemap.ts`: 동적 사이트맵
  - `/app/robots.ts`: robots.txt
  - `/public/manifest.json`: PWA 설정

### 외부 리소스
- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)

## 🎉 결론

kindt 프로젝트의 SEO는 다음과 같이 최적화되었습니다:

1. **기술적 SEO**: 사이트맵, robots.txt, 구조화된 데이터
2. **온페이지 SEO**: 메타데이터, 키워드, 콘텐츠 최적화
3. **작가 개별 SEO**: 동적 메타데이터, 프로필 최적화
4. **소셜 미디어 최적화**: Open Graph, Twitter Cards
5. **모바일 최적화**: PWA 설정, 반응형 디자인

이제 검색 엔진에서 "사진작가 추천", "포토그래퍼 매칭" 등의 키워드로 kindt를 쉽게 찾을 수 있으며, 각 작가들도 개별적으로 검색 노출이 최적화되었습니다.
