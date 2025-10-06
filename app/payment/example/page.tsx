"use client";

import { useState } from "react";
import { TossPaymentWidget } from "@/components/payment/toss-payment-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateOrderId } from "@/lib/payments/toss-client";
import { paymentLogger } from "@/lib/logger";

/**
 * TossPayments 결제 위젯 통합 예제 페이지
 *
 * 이 페이지는 TossPaymentWidget 컴포넌트의 사용법을 보여줍니다.
 * 실제 프로덕션에서는 이 페이지를 삭제하고, 예약 플로우에 통합하세요.
 */
export default function PaymentExamplePage() {
  const [showPayment, setShowPayment] = useState(false);

  // 예시 데이터
  const mockInquiry = {
    id: "inquiry_123",
    name: "김고객",
    phone: "010-1234-5678",
    email: "customer@example.com",
  };

  const mockProduct = {
    id: "product_456",
    name: "프리미엄 프로필 촬영",
    price: 150000,
    photographer_id: "photographer_789",
  };

  const mockPhotographer = {
    id: "photographer_789",
    name: "박작가",
  };

  const customerKey = `customer_${mockInquiry.id}`;

  const handlePaymentComplete = (paymentKey: string, orderId: string) => {
    paymentLogger.info("결제 완료:", { paymentKey, orderId });
    alert(
      `결제가 완료되었습니다!\n주문번호: ${orderId}\n결제키: ${paymentKey}`
    );
  };

  const handlePaymentError = (error: string) => {
    paymentLogger.error("결제 오류:", error);
    alert(`결제 중 오류가 발생했습니다: ${error}`);
  };

  if (!showPayment) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              TossPayments 결제 위젯 테스트
              <Badge variant="outline">개발용</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-medium text-yellow-800 mb-2">⚠️ 주의사항</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 이 페이지는 개발/테스트용입니다.</li>
                <li>• 환경변수에 테스트 키가 설정되어 있어야 합니다.</li>
                <li>• 실제 결제는 발생하지 않습니다.</li>
                <li>• 프로덕션 배포 시 이 페이지를 삭제하세요.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">테스트 주문 정보</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">고객명</span>
                  <p className="font-medium">{mockInquiry.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">연락처</span>
                  <p className="font-medium">{mockInquiry.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">작가</span>
                  <p className="font-medium">{mockPhotographer.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">상품</span>
                  <p className="font-medium">{mockProduct.name}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">결제금액</span>
                  <p className="font-medium text-lg text-blue-600">
                    {mockProduct.price.toLocaleString("ko-KR")}원
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => setShowPayment(true)}
                className="w-full"
                size="lg"
              >
                결제 위젯 테스트 시작
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 사용법 가이드 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>사용법 가이드</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. 컴포넌트 import</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`import { TossPaymentWidget } from '@/components/payment/toss-payment-widget';`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. 컴포넌트 사용</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`<TossPaymentWidget
  inquiry={inquiry}
  product={product} 
  photographer={photographer}
  customerKey="고유한_고객_키"
  onPaymentComplete={(paymentKey, orderId) => {
    // 결제 완료 처리
  }}
  onPaymentError={(error) => {
    // 결제 오류 처리
  }}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. 필수 환경변수</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_docs_...
TOSS_SECRET_KEY=test_gsk_docs_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 text-center">
          <Button
            variant="outline"
            onClick={() => setShowPayment(false)}
            className="mb-4"
          >
            ← 테스트 정보로 돌아가기
          </Button>
          <h1 className="text-2xl font-bold">결제 테스트</h1>
          <p className="text-gray-600 mt-2">
            아래에서 TossPayments 결제 위젯을 테스트할 수 있습니다.
          </p>
        </div>

        <TossPaymentWidget
          inquiry={mockInquiry}
          product={mockProduct}
          photographer={mockPhotographer}
          customerKey={customerKey}
          onPaymentComplete={handlePaymentComplete}
          onPaymentError={handlePaymentError}
        />

        {/* 개발자 정보 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-2xl mx-auto">
          <h3 className="font-medium text-blue-900 mb-2">개발자 정보</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              <strong>Customer Key:</strong> {customerKey}
            </p>
            <p>
              <strong>Order ID 형식:</strong> ORDER_[timestamp]_[random]
            </p>
            <p>
              <strong>결제 성공 URL:</strong> /payment/success
            </p>
            <p>
              <strong>결제 실패 URL:</strong> /payment/fail
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
