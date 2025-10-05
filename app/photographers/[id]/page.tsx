import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPhotographerById } from '@/lib/actions/photographers'
import { PhotographerProfile } from './photographer-profile'
import { Skeleton } from '@/components/ui/skeleton'

interface PhotographerPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PhotographerPageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getPhotographerById(id)
  
  if (result.error || !result.data) {
    return {
      title: '작가를 찾을 수 없습니다 | kindt'
    }
  }

  const photographer = result.data
  return {
    title: `${photographer.name} | kindt`,
    description: `${photographer.name} 작가의 프로필과 포트폴리오를 확인하고 예약하세요.`,
    openGraph: {
      title: `${photographer.name} | kindt`,
      description: `${photographer.name} 작가의 프로필과 포트폴리오를 확인하고 예약하세요.`,
    },
  }
}

function PhotographerProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex items-start gap-6 mb-8">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          </div>

          {/* Portfolio Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

async function PhotographerContent({ id }: { id: string }) {
  const result = await getPhotographerById(id)

  if (result.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">오류가 발생했습니다</h1>
          <p className="text-muted-foreground">{result.error}</p>
        </div>
      </div>
    )
  }

  if (!result.data) {
    notFound()
  }

  return <PhotographerProfile photographer={result.data} />
}

export default async function PhotographerPage({ params }: PhotographerPageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<PhotographerProfileSkeleton />}>
      <PhotographerContent id={id} />
    </Suspense>
  )
}