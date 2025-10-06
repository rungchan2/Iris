import { Metadata } from 'next'
import type { Tables } from '@/types'

type Photographer = Tables<'photographers'>

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://kindt.kr'

/**
 * Default metadata for the site
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'kindt | 나만의 성향을 찾아가는 포토 여정',
    template: '%s | kindt',
  },
  description: 'AI 성향 진단으로 당신에게 딱 맞는 사진 스타일과 전문 작가를 추천해드립니다. 10개의 질문으로 나에게 완벽한 포토그래퍼를 찾아보세요.',
  keywords: [
    '사진작가 추천',
    '포토그래퍼 매칭',
    'AI 사진작가 매칭',
    '사진 촬영 예약',
    '프로필 사진',
    '웨딩 촬영',
    '가족 사진',
    '스냅 사진',
    '포토그래퍼 찾기',
    '사진 스타일 진단',
  ],
  authors: [{ name: 'kindt' }],
  creator: 'kindt',
  publisher: 'kindt',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: baseUrl,
    siteName: 'kindt',
    title: 'kindt | 나만의 성향을 찾아가는 포토 여정',
    description: 'AI 성향 진단으로 당신에게 딱 맞는 사진 스타일과 전문 작가를 추천해드립니다',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'kindt - AI 사진작가 매칭 플랫폼',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'kindt | 나만의 성향을 찾아가는 포토 여정',
    description: 'AI 성향 진단으로 당신에게 딱 맞는 사진 스타일과 전문 작가를 추천해드립니다',
    images: [`${baseUrl}/og-image.png`],
    creator: '@kindt',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '', // Add Google Search Console verification code
    // yandex: '',
    // other: '',
  },
}

/**
 * Generate metadata for photographer detail page
 */
export function generatePhotographerMetadata(photographer: Photographer): Metadata {
  const photographerUrl = `${baseUrl}/photographers/${photographer.id}`
  const specialties = photographer.specialties?.join(', ') || ''

  const title = `${photographer.name} | 전문 사진작가`
  const description = specialties
    ? `${specialties} 전문 ${photographer.name} 작가의 프로필과 포트폴리오를 확인하고 예약하세요. kindt AI 매칭으로 추천받은 작가입니다.`
    : `${photographer.name} 작가의 프로필과 포트폴리오를 확인하고 예약하세요.`

  const keywords = [
    photographer.name || '',
    '사진작가',
    '포토그래퍼',
    ...(photographer.specialties || []),
    '사진 촬영',
    '예약',
    '포트폴리오',
  ].filter(Boolean) as string[]

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: photographerUrl,
      type: 'profile',
      images: [
        {
          url: `${baseUrl}/og-image.png`, // Use photographer's portfolio image if available
          width: 1200,
          height: 630,
          alt: `${photographer.name} 포트폴리오`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.png`],
    },
    alternates: {
      canonical: photographerUrl,
    },
  }
}

/**
 * Generate metadata for matching page
 */
export function generateMatchingMetadata(): Metadata {
  const matchingUrl = `${baseUrl}/matching`

  const title = 'AI 사진작가 매칭 테스트 | 나에게 맞는 포토그래퍼 찾기'
  const description = '10개의 질문으로 3분 안에 나에게 완벽한 사진작가를 찾아보세요. AI 성향 분석을 통해 스타일, 소통 방식, 촬영 목적에 맞는 전문 포토그래퍼를 추천해드립니다.'

  const keywords = [
    'AI 사진작가 매칭',
    '포토그래퍼 추천',
    '사진 스타일 진단',
    '사진작가 찾기',
    '매칭 테스트',
    '성향 분석',
    '맞춤 추천',
    '스냅 사진',
    '프로필 사진',
  ]

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: matchingUrl,
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'kindt AI 매칭 테스트',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.png`],
    },
    alternates: {
      canonical: matchingUrl,
    },
  }
}

/**
 * Generate metadata for photographers list page
 */
export function generatePhotographersListMetadata(): Metadata {
  const photographersUrl = `${baseUrl}/photographers`

  const title = '전문 사진작가 목록 | 포토그래퍼 찾기'
  const description = '다양한 전문 분야의 사진작가들을 만나보세요. 프로필 사진, 웨딩 촬영, 가족 사진, 스냅 사진 등 전문 포토그래퍼들의 포트폴리오를 확인하고 예약할 수 있습니다.'

  const keywords = [
    '사진작가 목록',
    '포토그래퍼 리스트',
    '전문 사진작가',
    '프로필 사진작가',
    '웨딩 사진작가',
    '가족 사진작가',
    '스냅 사진작가',
    '촬영 예약',
  ]

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: photographersUrl,
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'kindt 전문 사진작가 목록',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.png`],
    },
    alternates: {
      canonical: photographersUrl,
    },
  }
}

/**
 * Generate metadata for gallery page
 */
export function generateGalleryMetadata(): Metadata {
  const galleryUrl = `${baseUrl}/gallery`

  const title = '포토 갤러리 | 작가들의 작품 모음'
  const description = 'kindt 전문 사진작가들의 다양한 작품을 감상하세요. 프로필 사진, 웨딩 촬영, 가족 사진, 스냅 사진 등 고품질 포토그래피 갤러리입니다.'

  const keywords = [
    '사진 갤러리',
    '포토 갤러리',
    '사진작가 작품',
    '포트폴리오',
    '프로필 사진 예시',
    '웨딩 사진 예시',
    '가족 사진 예시',
  ]

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: galleryUrl,
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'kindt 포토 갤러리',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.png`],
    },
    alternates: {
      canonical: galleryUrl,
    },
  }
}
