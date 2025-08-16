import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPhotographerById } from '@/lib/actions/photographers'
import { PhotographerBookingPage } from './photographer-booking'
import { Skeleton } from '@/components/ui/skeleton'

interface BookingPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getPhotographerById(id)
  
  if (result.error || !result.data) {
    return {
      title: '예약할 수 없습니다 | Photo4You'
    }
  }

  const photographer = result.data
  return {
    title: `${photographer.name} 작가 예약 | Photo4You`,
    description: `${photographer.name} 작가와 함께하는 특별한 촬영을 예약하세요.`,
    openGraph: {
      title: `${photographer.name} 작가 예약 | Photo4You`,
      description: `${photographer.name} 작가와 함께하는 특별한 촬영을 예약하세요.`,
    },
  }
}

function BookingFormSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

async function BookingContent({ id }: { id: string }) {
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

  return <PhotographerBookingPage photographer={result.data} />
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<BookingFormSkeleton />}>
      <BookingContent id={id} />
    </Suspense>
  )
}