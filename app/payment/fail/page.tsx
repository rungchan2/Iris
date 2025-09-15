import { Suspense } from 'react';
import { XCircle, RefreshCw, Home, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/server';
import { getTossErrorMessage } from '@/lib/payments/toss-client';
import Link from 'next/link';

interface PaymentFailPageProps {
  searchParams: {
    code?: string;
    message?: string;
    orderId?: string;
  };
}

async function PaymentFailContent({ 
  code, 
  message, 
  orderId 
}: { 
  code: string; 
  message: string; 
  orderId?: string; 
}) {
  const supabase = await createClient();
  
  let payment = null;
  let inquiry = null;
  let photographer = null;

  // 주문번호가 있으면 관련 정보 조회
  if (orderId) {
    const { data: paymentData } = await supabase
      .from('payments')
      .select(`
        *,
        inquiries (
          id,
          name,
          phone,
          photographer_id
        ),
        photographers (
          id,
          name,
          phone
        )
      `)
      .eq('order_id', orderId)
      .single();

    if (paymentData) {
      payment = paymentData;
      inquiry = paymentData.inquiries;
      photographer = paymentData.photographers;
    }
  }

  // 에러 메시지 정제
  const userFriendlyMessage = getTossErrorMessage(code) || message || '결제 처리 중 오류가 발생했습니다.';

  // 재시도 가능한 오류인지 판단
  const retryableErrors = [
    'PROVIDER_ERROR',
    'FAILED_INTERNAL_SYSTEM_PROCESSING',
    'FAILED_PG_PROCESSING',
    'PAYMENT_TIMEOUT'
  ];
  const isRetryable = retryableErrors.includes(code);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 실패 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            결제에 실패했습니다
          </h1>
          <p className="text-gray-600">
            결제 과정에서 문제가 발생했습니다. 다시 시도해주세요.
          </p>
        </div>

        {/* 오류 정보 카드 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              오류 정보
              <Badge variant="destructive">
                결제 실패
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {userFriendlyMessage}
              </AlertDescription>
            </Alert>

            {orderId && (
              <div className="text-sm">
                <span className="text-gray-500">주문번호</span>
                <p className="font-medium">{orderId}</p>
              </div>
            )}

            {code && (
              <div className="text-sm">
                <span className="text-gray-500">오류 코드</span>
                <p className="font-mono text-xs text-gray-600">{code}</p>
              </div>
            )}

            <div className="text-sm">
              <span className="text-gray-500">발생 시간</span>
              <p className="font-medium">
                {new Date().toLocaleString('ko-KR')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 예약 정보 (있는 경우) */}
        {inquiry && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>예약 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">예약자</span>
                  <p className="font-medium">{inquiry.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">연락처</span>
                  <p className="font-medium">{inquiry.phone}</p>
                </div>
              </div>
              
              <Alert className="mt-4">
                <AlertDescription>
                  예약 정보는 유지되었습니다. 결제만 다시 진행해주세요.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* 해결 방법 안내 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>해결 방법</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  1
                </div>
                <div>
                  <h4 className="font-medium">카드 정보 확인</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    카드 번호, 유효기간, CVC 번호를 정확히 입력했는지 확인해주세요.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  2
                </div>
                <div>
                  <h4 className="font-medium">한도 및 잔액 확인</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    카드 한도나 계좌 잔액이 충분한지 확인해주세요.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  3
                </div>
                <div>
                  <h4 className="font-medium">다른 결제 수단 이용</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    다른 카드나 계좌이체, 간편결제를 이용해보세요.
                  </p>
                </div>
              </div>

              {!isRetryable && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm font-medium text-orange-600">
                    !
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-800">카드사 문의</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      계속 같은 오류가 발생하면 카드사에 문의해주세요.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 액션 버튼들 */}
        <div className="space-y-3">
          {isRetryable && orderId && (
            <Button size="lg" className="w-full" asChild>
              <Link href={inquiry ? `/photographers/${inquiry.photographer_id}/booking?retry=${orderId}` : '/gallery'}>
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도하기
              </Link>
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                홈으로 가기
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/gallery">
                갤러리 보기
              </Link>
            </Button>
          </div>
        </div>

        {/* 고객 지원 */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-2">
            <HelpCircle className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="font-medium text-gray-900">도움이 필요하신가요?</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            결제 문제가 계속 발생하거나 다른 문의사항이 있으시면 언제든 연락주세요.
          </p>
          
          <div className="space-y-2 text-sm">
            {photographer && (
              <div>
                <span className="text-gray-500">담당 작가: </span>
                <span className="font-medium">{photographer.name}</span>
                {photographer.phone && (
                  <span className="text-gray-600 ml-2">({photographer.phone})</span>
                )}
              </div>
            )}
            <div>
              <span className="text-gray-500">고객센터: </span>
              <span className="font-medium">1588-0000 (평일 9:00-18:00)</span>
            </div>
          </div>
        </div>

        {/* 오류 신고 */}
        {code && (
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" className="text-gray-500">
              기술적 문제 신고하기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentFailPage({ searchParams }: PaymentFailPageProps) {
  const { code = 'UNKNOWN_ERROR', message = '', orderId } = searchParams;

  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">오류 정보를 확인하고 있습니다...</p>
          </div>
        </div>
      }
    >
      <PaymentFailContent code={code} message={message} orderId={orderId} />
    </Suspense>
  );
}