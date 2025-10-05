import { Suspense } from 'react'
import { Metadata } from 'next'
import { PhotographersClient } from './photographers-client'
import { getPhotographers, getPersonalityTypes } from '@/lib/actions/photographers'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: '작가 목록 | kindt',
  description: '나에게 맞는 사진작가를 찾아보세요. 성격유형별 맞춤 작가 추천.',
  openGraph: {
    title: '작가 목록 | kindt',
    description: '나에게 맞는 사진작가를 찾아보세요. 성격유형별 맞춤 작가 추천.',
  },
}

function PhotographerCardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  )
}

function PhotographersGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <PhotographerCardSkeleton key={i} />
      ))}
    </div>
  )
}

async function PhotographersContent() {
  const [photographersResult, personalityTypesResult] = await Promise.all([
    getPhotographers(),
    getPersonalityTypes()
  ])

  if (photographersResult.error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">작가 목록을 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-sm text-red-600">{photographersResult.error}</p>
      </div>
    )
  }

  if (personalityTypesResult.error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">성격유형 정보를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-sm text-red-600">{personalityTypesResult.error}</p>
      </div>
    )
  }

  const photographers = photographersResult.data || []
  const personalityTypes = personalityTypesResult.data || []

  return (
    <PhotographersClient 
      initialPhotographers={photographers}
      personalityTypes={personalityTypes}
    />
  )
}

export default function PhotographersPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              나에게 맞는 작가 찾기
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              성격유형별 맞춤 추천으로 완벽한 작가를 만나보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>성격유형별 호환성 분석</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>포트폴리오 사전 확인</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>간편한 온라인 예약</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Suspense fallback={<PhotographersGridSkeleton />}>
            <PhotographersContent />
          </Suspense>
        </div>
      </section>
    </div>
  )
}