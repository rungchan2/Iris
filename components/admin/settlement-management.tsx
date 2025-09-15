'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Calendar,
  Eye,
  Check,
  X,
  Send
} from 'lucide-react';
import { 
  getSettlements, 
  getSettlementStats, 
  approveSettlement,
  rejectSettlement,
  completeSettlementTransfer,
  type SettlementData 
} from '@/lib/actions/settlements';
import { formatAmount } from '@/lib/payments/toss-client';
import { toast } from 'sonner';

interface SettlementStats {
  totalCount: number;
  totalAmount: number;
  totalPayments: number;
  pendingCount: number;
  approvedCount: number;
  completedCount: number;
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

export function SettlementManagement() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [settlements, setSettlements] = useState<SettlementData[]>([]);
  const [stats, setStats] = useState<SettlementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // 필터 상태
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // 모달 상태
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementData | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | null>(null);

  // URL 업데이트 함수
  const updateURL = (params: Record<string, string>) => {
    const url = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.set(key, value);
      } else {
        url.delete(key);
      }
    });
    router.push(`${pathname}?${url.toString()}`);
  };

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      // 정산 목록 조회
      const settlementsResult = await getSettlements({
        page: currentPage,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      if (settlementsResult.success && settlementsResult.data) {
        setSettlements(settlementsResult.data);
        setTotalPages(settlementsResult.pagination?.totalPages || 0);
        setTotalCount(settlementsResult.pagination?.total || 0);
      } else {
        toast.error(settlementsResult.error || '정산 목록을 불러오는데 실패했습니다.');
      }

      // 통계 조회
      const statsResult = await getSettlementStats({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      } else {
        toast.error(statsResult.error || '정산 통계를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      toast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 필터 적용
  const applyFilters = () => {
    setCurrentPage(1);
    updateURL({
      status: statusFilter,
      search: searchTerm,
      dateFrom,
      dateTo,
      page: '1',
    });
  };

  // 필터 초기화
  const resetFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    router.push(pathname);
  };

  // 정산 액션 실행
  const handleSettlementAction = async (formData: FormData) => {
    if (!selectedSettlement || !actionType) return;

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
        setSelectedSettlement(null);
        setActionType(null);
        loadData(); // 데이터 새로고침
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

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL({ page: page.toString() });
  };

  useEffect(() => {
    loadData();
  }, [currentPage, statusFilter, dateFrom, dateTo]);

  // 필터된 정산 목록 (클라이언트 사이드 검색)
  const filteredSettlements = settlements.filter(settlement => {
    if (!searchTerm) return true;
    return (
      settlement.photographer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      settlement.photographer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      settlement.settlement_period.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 정산</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCount}</div>
              <p className="text-xs text-muted-foreground">
                총 {stats.totalPayments}건의 결제
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">정산 금액</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(stats.totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                평균 {formatAmount(Math.round(stats.totalAmount / Math.max(stats.totalCount, 1)))}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">대기중</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.pendingCount / Math.max(stats.totalCount, 1)) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료됨</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedCount}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.completedCount / Math.max(stats.totalCount, 1)) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>정산 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6 mb-6">
            <div className="md:col-span-2">
              <Label htmlFor="search">작가명/이메일 검색</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="작가명 또는 이메일 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">상태</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="approved">승인됨</SelectItem>
                  <SelectItem value="completed">완료됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateFrom">시작일</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="dateTo">종료일</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            
            <div className="flex items-end space-x-2">
              <Button onClick={applyFilters} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                검색
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                초기화
              </Button>
            </div>
          </div>

          {/* 테이블 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>정산기간</TableHead>
                  <TableHead>작가</TableHead>
                  <TableHead>결제건수</TableHead>
                  <TableHead>정산금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                          <span className="ml-2">로딩 중...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredSettlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      정산 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSettlements.map((settlement) => {
                    const config = statusConfig[settlement.status as keyof typeof statusConfig];
                    const Icon = config.icon;
                    
                    return (
                      <TableRow key={settlement.id}>
                        <TableCell className="font-medium">
                          {settlement.settlement_period}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{settlement.photographer_name}</div>
                            <div className="text-sm text-gray-500">{settlement.photographer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {settlement.payment_count}건
                          {settlement.refund_count > 0 && (
                            <div className="text-xs text-red-600">
                              환불 {settlement.refund_count}건
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatAmount(settlement.final_settlement_amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            (총액: {formatAmount(settlement.total_payment_amount)})
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={config.color}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(settlement.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>정산 상세 정보</DialogTitle>
                                </DialogHeader>
                                <SettlementDetailDialog settlement={settlement} />
                              </DialogContent>
                            </Dialog>
                            
                            {settlement.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSettlement(settlement);
                                    setActionType('approve');
                                  }}
                                >
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSettlement(settlement);
                                    setActionType('reject');
                                  }}
                                >
                                  <X className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            
                            {settlement.status === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSettlement(settlement);
                                  setActionType('complete');
                                }}
                              >
                                <Send className="w-4 h-4 text-blue-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-gray-500">
                총 {totalCount}개 중 {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, totalCount)}개 표시
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  이전
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = Math.max(1, currentPage - 2) + i;
                    if (page > totalPages) return null;
                    
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 액션 모달 */}
      {selectedSettlement && actionType && (
        <Dialog open={true} onOpenChange={() => {
          setSelectedSettlement(null);
          setActionType(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' && '정산 승인'}
                {actionType === 'reject' && '정산 거부'}
                {actionType === 'complete' && '이체 완료'}
              </DialogTitle>
            </DialogHeader>
            <form action={handleSettlementAction} className="space-y-4">
              <input type="hidden" name="settlementId" value={selectedSettlement.id} />
              
              <div className="space-y-2">
                <Label>작가</Label>
                <p className="text-sm text-gray-600">{selectedSettlement.photographer_name}</p>
              </div>
              
              <div className="space-y-2">
                <Label>정산 금액</Label>
                <p className="text-sm font-medium">
                  {formatAmount(selectedSettlement.final_settlement_amount)}
                </p>
              </div>
              
              {actionType === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">거부 사유 *</Label>
                  <Textarea
                    id="rejectionReason"
                    name="rejectionReason"
                    placeholder="거부 사유를 입력하세요..."
                    required
                  />
                </div>
              )}
              
              {actionType === 'complete' && (
                <div className="space-y-2">
                  <Label htmlFor="transferReceiptUrl">이체 증빙서류 URL</Label>
                  <Input
                    id="transferReceiptUrl"
                    name="transferReceiptUrl"
                    placeholder="이체 완료 증빙 URL (선택사항)"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="adminNote">관리자 메모</Label>
                <Textarea
                  id="adminNote"
                  name="adminNote"
                  placeholder="추가 메모 (선택사항)"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedSettlement(null);
                    setActionType(null);
                  }}
                  disabled={actionLoading}
                >
                  취소
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? '처리 중...' : '확인'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// 정산 상세 정보 다이얼로그 컴포넌트
function SettlementDetailDialog({ settlement }: { settlement: SettlementData }) {
  return (
    <div className="space-y-6 max-h-96 overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">기본 정보</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">정산 기간:</span>
              <span>{settlement.settlement_period}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">작가:</span>
              <span>{settlement.photographer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">결제 건수:</span>
              <span>{settlement.payment_count}건</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">환불 건수:</span>
              <span>{settlement.refund_count}건</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">금액 정보</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">총 결제액:</span>
              <span>{formatAmount(settlement.total_payment_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">플랫폼 수수료:</span>
              <span className="text-red-600">-{formatAmount(settlement.total_platform_fee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">결제 수수료:</span>
              <span className="text-red-600">-{formatAmount(settlement.total_gateway_fee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">세금:</span>
              <span className="text-red-600">-{formatAmount(settlement.total_tax_amount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">최종 정산액:</span>
              <span className="font-bold text-green-600">
                {formatAmount(settlement.final_settlement_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {settlement.transfer_holder && (
        <div>
          <h4 className="font-medium mb-2">계좌 정보</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">예금주:</span>
              <span>{settlement.transfer_holder}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">은행:</span>
              <span>{settlement.transfer_bank_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">계좌번호:</span>
              <span>{settlement.transfer_account}</span>
            </div>
          </div>
        </div>
      )}

      {settlement.admin_note && (
        <div>
          <h4 className="font-medium mb-2">관리자 메모</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            {settlement.admin_note}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
        <div>
          <span>생성일: {new Date(settlement.created_at).toLocaleString('ko-KR')}</span>
        </div>
        <div>
          <span>수정일: {new Date(settlement.updated_at).toLocaleString('ko-KR')}</span>
        </div>
        {settlement.approved_at && (
          <div>
            <span>승인일: {new Date(settlement.approved_at).toLocaleString('ko-KR')}</span>
          </div>
        )}
        {settlement.transferred_at && (
          <div>
            <span>이체일: {new Date(settlement.transferred_at).toLocaleString('ko-KR')}</span>
          </div>
        )}
      </div>
    </div>
  );
}