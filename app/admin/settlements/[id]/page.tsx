import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SettlementDetail } from '@/components/admin/settlement-detail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getSettlementById } from '@/lib/actions/settlements';

interface SettlementDetailPageProps {
  params: {
    id: string;
  };
}

export default async function SettlementDetailPage({ params }: SettlementDetailPageProps) {
  const result = await getSettlementById(params.id);
  
  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">정산 상세</h2>
      </div>
      
      <div className="space-y-4">
        <Suspense fallback={<SettlementDetailSkeleton />}>
          <SettlementDetail settlement={result.data} />
        </Suspense>
      </div>
    </div>
  );
}

function SettlementDetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* 기본 정보 스켈레톤 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 결제 내역 스켈레톤 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}