'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TossPaymentPopup from '@/components/payment/toss-payment-popup';
import { createSimpleTestPayment } from '@/lib/actions/simple-test-payments';

export default function TestPaymentPage() {
  const [showWidget, setShowWidget] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  // 테스트 데이터
  const [testData, setTestData] = useState({
    buyerName: '홍길동',
    buyerEmail: 'test@example.com',
    buyerTel: '010-1234-5678',
    amount: 100000,
    orderName: '테스트 촬영 패키지',
    photographerName: '김작가'
  });

  const handleStartPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await createSimpleTestPayment(testData);
      
      if (result.success) {
        setPaymentData({
          inquiry: result.inquiry,
          product: result.product,
          photographer: result.photographer,
          orderId: result.orderId,
          customerKey: result.customerKey
        });
        
        setShowWidget(true);
      } else {
        setError(result.error || '결제 준비 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('결제 준비 실패:', err);
      setError('결제 준비 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = (paymentKey: string, orderId: string) => {
    console.log('결제 완료:', { paymentKey, orderId });
  };

  const handlePaymentError = (error: string) => {
    console.error('결제 오류:', error);
    setError(error);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setTestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (showWidget && paymentData) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setShowWidget(false)}
              className="mb-4"
            >
              ← 설정으로 돌아가기
            </Button>
            <h1 className="text-2xl font-bold">테스트 결제</h1>
            <p className="text-gray-600">토스페이먼츠 API 개별 연동 키로 결제창 테스트를 진행합니다.</p>
          </div>

          <TossPaymentPopup
            inquiry={paymentData.inquiry}
            product={paymentData.product}
            photographer={paymentData.photographer}
            customerKey={paymentData.customerKey}
            orderId={paymentData.orderId}
            onPaymentComplete={handlePaymentComplete}
            onPaymentError={handlePaymentError}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">결제 테스트 페이지</h1>
          <p className="text-gray-600">토스페이먼츠 테스트 환경에서 결제 플로우를 테스트할 수 있습니다.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>테스트 결제 정보</CardTitle>
            <CardDescription>
              결제 테스트를 위한 정보를 입력하세요. 실제 결제는 발생하지 않습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyerName">구매자명</Label>
                <Input
                  id="buyerName"
                  value={testData.buyerName}
                  onChange={(e) => handleInputChange('buyerName', e.target.value)}
                  placeholder="홍길동"
                />
              </div>
              <div>
                <Label htmlFor="buyerEmail">이메일</Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  value={testData.buyerEmail}
                  onChange={(e) => handleInputChange('buyerEmail', e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyerTel">연락처</Label>
                <Input
                  id="buyerTel"
                  value={testData.buyerTel}
                  onChange={(e) => handleInputChange('buyerTel', e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>
              <div>
                <Label htmlFor="amount">결제 금액</Label>
                <Input
                  id="amount"
                  type="number"
                  value={testData.amount}
                  onChange={(e) => handleInputChange('amount', parseInt(e.target.value) || 0)}
                  placeholder="100000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderName">상품명</Label>
                <Input
                  id="orderName"
                  value={testData.orderName}
                  onChange={(e) => handleInputChange('orderName', e.target.value)}
                  placeholder="테스트 촬영 패키지"
                />
              </div>
              <div>
                <Label htmlFor="photographerName">작가명</Label>
                <Input
                  id="photographerName"
                  value={testData.photographerName}
                  onChange={(e) => handleInputChange('photographerName', e.target.value)}
                  placeholder="김작가"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleStartPayment}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    결제 준비 중...
                  </>
                ) : (
                  '결제 테스트 시작'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">테스트 카드 정보</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>카드번호:</strong> 4111-1111-1111-1111</p>
            <p><strong>유효기간:</strong> 12/25</p>
            <p><strong>CVC:</strong> 123</p>
            <p><strong>카드 비밀번호:</strong> 00</p>
            <p className="text-xs mt-2">※ 테스트 환경에서만 사용 가능한 카드 정보입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}