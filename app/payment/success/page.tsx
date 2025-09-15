import { Suspense } from 'react';
import { CheckCircle, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { formatAmount } from '@/lib/payments/toss-client';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PaymentSuccessPageProps {
  searchParams: {
    orderId?: string;
    paymentKey?: string;
  };
}

async function PaymentSuccessContent({ 
  orderId, 
  paymentKey 
}: { 
  orderId: string; 
  paymentKey: string; 
}) {
  const supabase = await createClient();

  // 결제 정보 조회
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select(`
      *,
      inquiries (
        id,
        name,
        phone,
        email,
        desired_date
      ),
      photographers (
        id,
        name,
        phone,
        email
      ),
      products (
        id,
        name,
        description
      )
    `)
    .eq('order_id', orderId)
    .eq('status', 'paid')
    .single();

  if (paymentError || !payment) {
    console.error('결제 정보 조회 실패:', paymentError);
    notFound();
  }

  const inquiry = payment.inquiries;
  const photographer = payment.photographers;
  const product = payment.products;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 성공 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            결제가 완료되었습니다!
          </h1>
          <p className="text-gray-600">
            예약이 확정되었으며, 작가님께 알림이 전송되었습니다.
          </p>
        </div>

        {/* 결제 정보 카드 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              결제 정보
              <Badge variant="outline" className="bg-green-50 text-green-700">
                결제 완료
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">주문번호</span>
                <p className="font-medium">{payment.order_id}</p>
              </div>
              <div>
                <span className="text-gray-500">결제금액</span>
                <p className="font-medium text-lg text-blue-600">
                  {formatAmount(payment.amount)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">결제방법</span>
                <p className="font-medium">{payment.payment_method}</p>
              </div>
              <div>
                <span className="text-gray-500">결제일시</span>
                <p className="font-medium">
                  {new Date(payment.paid_at).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>

            {/* 영수증 다운로드 */}
            {payment.receipt_url && (
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="w-full"
                >
                  <a 
                    href={payment.receipt_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    영수증 다운로드
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 예약 정보 카드 */}
        {inquiry && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>예약 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">예약자</span>
                  <p className="font-medium">{inquiry.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">연락처</span>
                  <p className="font-medium">{inquiry.phone}</p>
                </div>
                {inquiry.email && (
                  <div>
                    <span className="text-gray-500">이메일</span>
                    <p className="font-medium">{inquiry.email}</p>
                  </div>
                )}
                {product && (
                  <div>
                    <span className="text-gray-500">선택 상품</span>
                    <p className="font-medium">{product.name}</p>
                    {product.description && (
                      <p className="text-gray-600 text-sm mt-1">
                        {product.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 작가 정보 카드 */}
        {photographer && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>담당 작가 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">작가명</span>
                  <p className="font-medium">{photographer.name}</p>
                </div>
                {photographer.phone && (
                  <div>
                    <span className="text-gray-500">연락처</span>
                    <p className="font-medium">{photographer.phone}</p>
                  </div>
                )}
                {photographer.email && (
                  <div>
                    <span className="text-gray-500">이메일</span>
                    <p className="font-medium">{photographer.email}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">
                  곧 작가님께서 연락드릴 예정입니다. 
                  촬영 일정 및 세부사항을 조율해주세요.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="w-full"
                >
                  <Link href={`/photographers/${photographer.id}`}>
                    작가 프로필 보기
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 액션 버튼들 */}
        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/gallery">
              다른 작품 둘러보기
            </Link>
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                홈으로 가기
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Share2 className="w-4 h-4 mr-2" />
              결과 공유하기
            </Button>
          </div>
        </div>

        {/* 안내사항 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">촬영 안내사항</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 촬영 24시간 전까지는 일정 변경이 가능합니다.</li>
            <li>• 촬영 당일 10분 이상 지각 시 촬영 시간이 단축될 수 있습니다.</li>
            <li>• 날씨로 인한 일정 변경 시 작가님께서 먼저 연락드립니다.</li>
            <li>• 문의사항이 있으시면 언제든 작가님께 연락주세요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const { orderId, paymentKey } = searchParams;

  if (!orderId || !paymentKey) {
    notFound();
  }

  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">결제 정보를 확인하고 있습니다...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent orderId={orderId} paymentKey={paymentKey} />
    </Suspense>
  );
}