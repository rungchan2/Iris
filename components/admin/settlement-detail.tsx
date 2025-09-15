'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  User, 
  Calendar,
  DollarSign,
  FileText,
  ExternalLink,
  Check,
  X,
  Send
} from 'lucide-react';
import { 
  approveSettlement,
  rejectSettlement,
  completeSettlementTransfer,
  type SettlementData 
} from '@/lib/actions/settlements';
import { formatAmount } from '@/lib/payments/toss-client';
import { toast } from 'sonner';

interface SettlementDetailProps {
  settlement: SettlementData & {
    payments?: Array<{
      id: string;
      order_id: string;
      amount: number;
      payment_method: string;
      status: string;
      paid_at: string;
      buyer_name: string;
      created_at: string;
    }>;
  };
}

const statusConfig = {
  pending: { 
    label: '대기중', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: Clock 
  },
  approved: { 
    label: '승인됨', 
    color: 'bg-blue-100 text-blue-800', 
    icon: CheckCircle 
  },
  completed: { 
    label: '완료됨', 
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircle 
  },
} as const;

export function SettlementDetail({ settlement }: SettlementDetailProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | null>(null);

  const config = statusConfig[settlement.status as keyof typeof statusConfig];
  const Icon = config.icon;

  // 정산 액션 실행
  const handleSettlementAction = async (formData: FormData) => {
    if (!actionType) return;

    setActionLoading(true);
    try {
      let result;
      
      switch (actionType) {
        case 'approve':
          result = await approveSettlement(formData);
          break;
        case 'reject':
          result = await rejectSettlement(formData);
          break;
        case 'complete':
          result = await completeSettlementTransfer(formData);
          break;
      }

      if (result.success) {
        toast.success(result.message);
        setActionType(null);
        router.refresh(); // 페이지 새로고침
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('정산 액션 실행 오류:', error);
      toast.error('처리 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{settlement.settlement_period} 정산</h1>
            <p className="text-gray-500">{settlement.photographer_name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge className={config.color}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
          
          {/* 액션 버튼 */}
          {settlement.status === 'pending' && (
            <div className="flex space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setActionType('approve')}>
                    <Check className="w-4 h-4 mr-2" />
                    승인
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>정산 승인</DialogTitle>
                  </DialogHeader>
                  <form action={handleSettlementAction} className="space-y-4">
                    <input type="hidden" name="settlementId" value={settlement.id} />
                    
                    <div className="space-y-2">
                      <Label>정산 금액</Label>
                      <p className="text-lg font-bold text-green-600">
                        {formatAmount(settlement.final_settlement_amount)}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="adminNote">관리자 메모</Label>
                      <Textarea
                        id="adminNote"
                        name="adminNote"
                        placeholder="승인 메모 (선택사항)"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActionType(null)}
                        disabled={actionLoading}
                      >
                        취소
                      </Button>
                      <Button type="submit" disabled={actionLoading}>
                        {actionLoading ? '처리 중...' : '승인하기'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setActionType('reject')}>
                    <X className="w-4 h-4 mr-2" />
                    거부
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>정산 거부</DialogTitle>
                  </DialogHeader>
                  <form action={handleSettlementAction} className="space-y-4">
                    <input type="hidden" name="settlementId" value={settlement.id} />
                    
                    <div className="space-y-2">
                      <Label htmlFor="rejectionReason">거부 사유 *</Label>
                      <Textarea
                        id="rejectionReason"
                        name="rejectionReason"
                        placeholder="거부 사유를 입력하세요..."
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActionType(null)}
                        disabled={actionLoading}
                      >
                        취소
                      </Button>
                      <Button type="submit" variant="destructive" disabled={actionLoading}>
                        {actionLoading ? '처리 중...' : '거부하기'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
          
          {settlement.status === 'approved' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setActionType('complete')}>
                  <Send className="w-4 h-4 mr-2" />
                  이체 완료
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>이체 완료 처리</DialogTitle>
                </DialogHeader>
                <form action={handleSettlementAction} className="space-y-4">
                  <input type="hidden" name="settlementId" value={settlement.id} />
                  
                  <div className="space-y-2">
                    <Label>이체 금액</Label>
                    <p className="text-lg font-bold text-green-600">
                      {formatAmount(settlement.final_settlement_amount)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transferReceiptUrl">이체 증빙서류 URL</Label>
                    <Input
                      id="transferReceiptUrl"
                      name="transferReceiptUrl"
                      placeholder="이체 완료 증빙 URL (선택사항)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="adminNote">관리자 메모</Label>
                    <Textarea
                      id="adminNote"
                      name="adminNote"
                      placeholder="이체 완료 메모 (선택사항)"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActionType(null)}
                      disabled={actionLoading}
                    >
                      취소
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading ? '처리 중...' : '이체 완료'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 작가 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              작가 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">이름:</span>
              <span className="font-medium">{settlement.photographer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">이메일:</span>
              <span className="font-medium">{settlement.photographer_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">정산 기간:</span>
              <span className="font-medium">{settlement.settlement_period}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">정산일:</span>
              <span className="font-medium">
                {new Date(settlement.settlement_date).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 금액 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              금액 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">총 결제액:</span>
              <span className="font-medium">
                {formatAmount(settlement.total_payment_amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">플랫폼 수수료:</span>
              <span className="text-red-600">
                -{formatAmount(settlement.total_platform_fee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">결제 수수료:</span>
              <span className="text-red-600">
                -{formatAmount(settlement.total_gateway_fee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">세금:</span>
              <span className="text-red-600">
                -{formatAmount(settlement.total_tax_amount)}
              </span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="font-semibold">최종 정산액:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatAmount(settlement.final_settlement_amount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 통계 정보 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">총 결제 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settlement.payment_count}</div>
            <p className="text-xs text-muted-foreground">건</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">환불 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settlement.refund_count}</div>
            <p className="text-xs text-muted-foreground">
              {formatAmount(settlement.total_refund_amount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">수수료율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((settlement.total_platform_fee + settlement.total_gateway_fee) / settlement.total_payment_amount * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">플랫폼 + 결제</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">정산율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(settlement.final_settlement_amount / settlement.total_payment_amount * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">최종 정산 비율</p>
          </CardContent>
        </Card>
      </div>

      {/* 계좌 정보 */}
      {settlement.transfer_holder && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              계좌 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <span className="text-gray-500 block text-sm">예금주</span>
                <span className="font-medium">{settlement.transfer_holder}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-sm">은행</span>
                <span className="font-medium">{settlement.transfer_bank_name}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-sm">계좌번호</span>
                <span className="font-medium">{settlement.transfer_account}</span>
              </div>
            </div>
            
            {settlement.transfer_receipt_url && (
              <div className="pt-3 border-t">
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={settlement.transfer_receipt_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    이체 증빙서류 보기
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 관리자 메모 */}
      {settlement.admin_note && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              관리자 메모
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{settlement.admin_note}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 결제 내역 */}
      {settlement.payments && settlement.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              결제 내역 ({settlement.payments.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>주문번호</TableHead>
                    <TableHead>구매자</TableHead>
                    <TableHead>결제수단</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>결제일</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlement.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.order_id}
                      </TableCell>
                      <TableCell>{payment.buyer_name}</TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(payment.amount)}
                      </TableCell>
                      <TableCell>
                        {new Date(payment.paid_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                          {payment.status === 'paid' ? '완료' : payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 시간 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            처리 이력
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">생성일:</span>
                <span>{new Date(settlement.created_at).toLocaleString('ko-KR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">수정일:</span>
                <span>{new Date(settlement.updated_at).toLocaleString('ko-KR')}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {settlement.approved_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">승인일:</span>
                  <span>{new Date(settlement.approved_at).toLocaleString('ko-KR')}</span>
                </div>
              )}
              {settlement.transferred_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">이체일:</span>
                  <span>{new Date(settlement.transferred_at).toLocaleString('ko-KR')}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}