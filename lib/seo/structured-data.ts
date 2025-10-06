import type { Tables } from '@/types'

type Photographer = Tables<'photographers'>
type PhotographerProfile = Tables<'photographer_profiles'>

export interface PhotographerWithProfile extends Photographer {
  photographer_profile?: PhotographerProfile | null
}

/**
 * Generate Organization structured data for the main site
 */
export function generateOrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://kindt.kr'

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'kindt',
    url: baseUrl,
    logo: `${baseUrl}/og-image.png`,
    description: 'AI 성향 진단으로 당신에게 딱 맞는 사진 스타일과 전문 작가를 추천해드립니다',
    sameAs: [
      // Add social media URLs when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['ko', 'Korean'],
    },
  }
}

/**
 * Generate LocalBusiness structured data for kindt as a service
 */
export function generateLocalBusinessSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://kindt.kr'

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': baseUrl,
    name: 'kindt',
    image: `${baseUrl}/og-image.png`,
    description: 'AI 매칭 시스템으로 고객의 성향에 맞는 사진작가를 추천하는 사진 촬영 예약 플랫폼',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KR',
      addressLocality: '서울',
    },
    geo: {
      '@type': 'GeoCoordinates',
      addressCountry: 'KR',
    },
    url: baseUrl,
    telephone: '',
    priceRange: '₩₩-₩₩₩',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '0',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
  }
}

/**
 * Generate Person schema for a photographer
 */
export function generatePhotographerSchema(photographer: PhotographerWithProfile) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://kindt.kr'
  const photographerUrl = `${baseUrl}/photographers/${photographer.id}`

  const specialties = photographer.specialties?.join(', ') || '사진 촬영'

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': photographerUrl,
    name: photographer.name,
    url: photographerUrl,
    jobTitle: '포토그래퍼',
    knowsAbout: specialties,
    description: photographer.photographer_profile?.style_emotion_description ||
                 `${photographer.name} 작가의 프로필과 포트폴리오를 확인하세요.`,
  }

  // Add email if available (public)
  if (photographer.email && !photographer.email.includes('@')) {
    schema.email = photographer.email
  }

  // Add work examples if profile exists
  if (photographer.photographer_profile) {
    const profile = photographer.photographer_profile

    schema.worksFor = {
      '@type': 'Organization',
      name: 'kindt',
      url: baseUrl,
    }

    // Add areas of expertise based on specialties
    if (photographer.specialties && photographer.specialties.length > 0) {
      schema.knowsAbout = [
        '사진 촬영',
        ...photographer.specialties,
        ...(profile.purpose_story_description ? [profile.purpose_story_description.split(' ')[0]] : []),
      ]
    }
  }

  return schema
}

/**
 * Generate ImageObject schema for photographer portfolio
 */
export function generatePhotographerPortfolioSchema(
  photographer: PhotographerWithProfile,
  images: { url: string; caption?: string }[]
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://kindt.kr'

  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: `${photographer.name} 포트폴리오`,
    description: `${photographer.name} 작가의 작품 갤러리`,
    url: `${baseUrl}/photographers/${photographer.id}`,
    creator: {
      '@type': 'Person',
      name: photographer.name,
    },
    associatedMedia: images.map((image) => ({
      '@type': 'ImageObject',
      contentUrl: image.url,
      caption: image.caption || `${photographer.name} 작가의 작품`,
      creator: {
        '@type': 'Person',
        name: photographer.name,
      },
    })),
  }
}

/**
 * Generate Service schema for photographer services
 */
export function generatePhotographerServiceSchema(photographer: PhotographerWithProfile) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://kindt.kr'
  const serviceType = photographer.specialties?.[0] || '사진 촬영'

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${photographer.name} 사진 촬영 서비스`,
    description: photographer.photographer_profile?.style_emotion_description ||
                 `전문 사진작가 ${photographer.name}님의 촬영 서비스`,
    provider: {
      '@type': 'Person',
      name: photographer.name,
      url: `${baseUrl}/photographers/${photographer.id}`,
    },
    serviceType,
    areaServed: {
      '@type': 'Country',
      name: '대한민국',
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${baseUrl}/photographers/${photographer.id}/booking`,
    },
  }
}

/**
 * Generate FAQ schema for matching system
 */
export function generateMatchingFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'kindt의 AI 매칭은 어떻게 작동하나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '10개의 질문을 통해 고객님의 사진 스타일 선호도, 소통 방식, 촬영 목적을 분석하여 가장 적합한 사진작가를 추천해드립니다. AI 임베딩 기술을 활용하여 정확한 매칭을 제공합니다.',
        },
      },
      {
        '@type': 'Question',
        name: '매칭 테스트는 얼마나 걸리나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '10개의 질문에 답변하는데 약 3-5분 정도 소요됩니다. 모든 질문에 답변하시면 즉시 매칭 결과를 확인하실 수 있습니다.',
        },
      },
      {
        '@type': 'Question',
        name: '매칭 결과는 얼마나 정확한가요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'kindt는 4차원 매칭 알고리즘을 사용하여 스타일/감성(40%), 소통/심리(30%), 목적/스토리(20%), 동반자(10%)의 가중치로 최적의 작가를 추천합니다.',
        },
      },
      {
        '@type': 'Question',
        name: '로그인 없이도 매칭을 받을 수 있나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '네, 회원가입이나 로그인 없이도 매칭 테스트를 진행하고 결과를 확인하실 수 있습니다. 단, 예약을 진행하시려면 로그인이 필요합니다.',
        },
      },
      {
        '@type': 'Question',
        name: '어떤 종류의 사진작가가 등록되어 있나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '프로필 사진, 웨딩 촬영, 가족 사진, 반려동물 촬영, 스냅 사진 등 다양한 전문 분야의 사진작가들이 등록되어 있습니다. 각 작가의 전문성과 스타일을 확인하실 수 있습니다.',
        },
      },
    ],
  }
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://kindt.kr'

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  }
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebsiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://kindt.kr'

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name: 'kindt',
    description: 'AI 성향 진단으로 당신에게 딱 맞는 사진 스타일과 전문 작가를 추천해드립니다',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/photographers?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}
