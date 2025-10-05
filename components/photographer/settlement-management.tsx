'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  Search,
  Calendar,
  Eye,
  AlertCircle,
  HelpCircle
} from 'lucide-react'
import { type SettlementData } from '@/lib/actions/settlements'
import { formatAmount } from '@/lib/payments/toss-client'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { settlementLogger } from '@/lib/logger'
import { usePhotographerSettlements } from '@/lib/hooks/use-settlements'

interface SettlementStats {
  totalCount: number
  totalAmount: number
  totalPayments: number
  pendingCount: number
  approvedCount: number
  completedCount: number
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
} as const

export default function PhotographerSettlementManagement() {
  const router = useRouter()

  const [photographerId, setPhotographerId] = useState<string | null>(null)

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // 모달 상태
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementData | null>(null)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [inquiryContent, setInquiryContent] = useState('')

  // Fetch settlements using React Query hook
  const { data: settlements = [], isLoading: loading } = usePhotographerSettlements(photographerId || undefined)

  // Calculate stats with useMemo
  const stats = useMemo(() => {
    return settlements.reduce((acc, item) => {
      acc.totalCount += 1
      acc.totalAmount += item.final_settlement_amount
      acc.totalPayments += item.payment_count

      if (item.status === 'pending') acc.pendingCount += 1
      else if (item.status === 'approved') acc.approvedCount += 1
      else if (item.status === 'completed') acc.completedCount += 1

      return acc
    }, {
      totalCount: 0,
      totalAmount: 0,
      totalPayments: 0,
      pendingCount: 0,
      approvedCount: 0,
      completedCount: 0,
    })
  }, [settlements])

  // Get photographer ID on mount
  useEffect(() => {
    const getCurrentPhotographer = async () => {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        toast.error('인증이 필요합니다')
        router.push('/login')
        return
      }

      // Get photographer ID from photographers table
      const { data: photographer, error: photographerError } = await supabase
        .from('photographers')
        .select('id')
        .eq('email', user.email!)
        .single()

      if (photographerError || !photographer) {
        settlementLogger.error('Photographer not found', { email: user.email, error: photographerError })
        toast.error('작가 정보를 찾을 수 없습니다')
        return
      }

      setPhotographerId(photographer.id)
    }

    getCurrentPhotographer()
  }, [])

  const filteredSettlements = settlements.filter(settlement => {
    // Status filter
    if (statusFilter !== 'all' && settlement.status !== statusFilter) {
      return false
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        settlement.settlement_period.toLowerCase().includes(search) ||
        settlement.id.toLowerCase().includes(search)
      )
    }

    return true
  })

  const handleInquirySubmit = async () => {
    if (!inquiryContent.trim()) {
      toast.error('문의 내용을 입력해주세요')
      return
    }

    // TODO: Implement inquiry submission to admin
    // For now, just show success message
    toast.success('문의가 접수되었습니다. 관리자가 확인 후 답변드리겠습니다.')
    setInquiryContent('')
    setInquiryOpen(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">정산 내역을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">정산 관리</h1>
          <p className="text-gray-600 mt-1">촬영 수익에 대한 정산 내역을 확인하세요</p>
        </div>

        <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <HelpCircle className="w-4 h-4 mr-2" />
              정산 문의
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>정산 관련 문의</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="inquiry">문의 내용</Label>
                <Textarea
                  id="inquiry"
                  placeholder="정산과 관련하여 문의하실 내용을 입력해주세요"
                  value={inquiryContent}
                  onChange={(e) => setInquiryContent(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setInquiryOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleInquirySubmit}>
                  문의하기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 정산 금액</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats?.totalAmount || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalCount || 0}건의 정산
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기중</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              승인 대기 중
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인됨</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approvedCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              이체 준비 중
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료됨</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              정산 완료
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>정산 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="정산 기간 또는 ID로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="approved">승인됨</SelectItem>
                <SelectItem value="completed">완료됨</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Settlement Table */}
          {filteredSettlements.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">정산 내역이 없습니다</h3>
              <p className="text-gray-600">
                {statusFilter !== 'all'
                  ? '해당 조건의 정산 내역이 없습니다'
                  : '아직 정산 내역이 생성되지 않았습니다'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>정산 기간</TableHead>
                    <TableHead>정산일</TableHead>
                    <TableHead className="text-right">결제 건수</TableHead>
                    <TableHead className="text-right">총 결제 금액</TableHead>
                    <TableHead className="text-right">수수료</TableHead>
                    <TableHead className="text-right">정산 금액</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                    <TableHead className="text-center">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSettlements.map((settlement) => {
                    const StatusIcon = statusConfig[settlement.status as keyof typeof statusConfig]?.icon || Clock
                    const statusColor = statusConfig[settlement.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'
                    const statusLabel = statusConfig[settlement.status as keyof typeof statusConfig]?.label || settlement.status

                    return (
                      <TableRow key={settlement.id}>
                        <TableCell className="font-medium">
                          {settlement.settlement_period}
                        </TableCell>
                        <TableCell>
                          {new Date(settlement.settlement_date).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-right">
                          {settlement.payment_count}건
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(settlement.total_payment_amount)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          -{formatAmount(settlement.total_platform_fee + settlement.total_gateway_fee)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {formatAmount(settlement.final_settlement_amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={statusColor}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSettlement({
                                  ...settlement,
                                  photographer_name: settlement.photographers.name || '',
                                  photographer_email: settlement.photographers.email || '',
                                  refund_count: settlement.refund_count || 0,
                                  total_refund_amount: settlement.total_refund_amount || 0,
                                } as SettlementData)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                상세
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>정산 상세 정보</DialogTitle>
                              </DialogHeader>
                              {selectedSettlement && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-gray-600">정산 기간</Label>
                                      <p className="font-medium">{selectedSettlement.settlement_period}</p>
                                    </div>
                                    <div>
                                      <Label className="text-gray-600">정산일</Label>
                                      <p className="font-medium">
                                        {new Date(selectedSettlement.settlement_date).toLocaleDateString('ko-KR')}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-gray-600">결제 건수</Label>
                                      <p className="font-medium">{selectedSettlement.payment_count}건</p>
                                    </div>
                                    <div>
                                      <Label className="text-gray-600">환불 건수</Label>
                                      <p className="font-medium">{selectedSettlement.refund_count || 0}건</p>
                                    </div>
                                  </div>

                                  <div className="border-t pt-4">
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">총 결제 금액</span>
                                        <span className="font-medium">{formatAmount(selectedSettlement.total_payment_amount)}</span>
                                      </div>
                                      <div className="flex justify-between text-red-600">
                                        <span>플랫폼 수수료</span>
                                        <span>-{formatAmount(selectedSettlement.total_platform_fee)}</span>
                                      </div>
                                      <div className="flex justify-between text-red-600">
                                        <span>PG 수수료</span>
                                        <span>-{formatAmount(selectedSettlement.total_gateway_fee)}</span>
                                      </div>
                                      {selectedSettlement.total_refund_amount && selectedSettlement.total_refund_amount > 0 && (
                                        <div className="flex justify-between text-red-600">
                                          <span>환불 금액</span>
                                          <span>-{formatAmount(selectedSettlement.total_refund_amount)}</span>
                                        </div>
                                      )}
                                      <div className="border-t pt-2 flex justify-between text-lg font-bold text-green-600">
                                        <span>최종 정산 금액</span>
                                        <span>{formatAmount(selectedSettlement.final_settlement_amount)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {selectedSettlement.transfer_holder && (
                                    <div className="border-t pt-4">
                                      <Label className="text-gray-600">계좌 정보</Label>
                                      <p className="font-medium">
                                        {selectedSettlement.transfer_bank_name} {selectedSettlement.transfer_account}
                                      </p>
                                      <p className="text-sm text-gray-600">{selectedSettlement.transfer_holder}</p>
                                    </div>
                                  )}

                                  {selectedSettlement.admin_note && (
                                    <div className="border-t pt-4">
                                      <Label className="text-gray-600">관리자 메모</Label>
                                      <p className="text-sm mt-1">{selectedSettlement.admin_note}</p>
                                    </div>
                                  )}

                                  {selectedSettlement.transferred_at && (
                                    <div className="border-t pt-4">
                                      <Label className="text-gray-600">이체 완료일</Label>
                                      <p className="font-medium">
                                        {new Date(selectedSettlement.transferred_at).toLocaleString('ko-KR')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-2">정산 안내</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 정산은 매월 초 전월 결제 건에 대해 자동으로 생성됩니다</li>
                <li>• 승인 후 영업일 기준 3-5일 이내에 계좌로 입금됩니다</li>
                <li>• 정산 관련 문의사항은 상단의 &apos;정산 문의&apos; 버튼을 이용해주세요</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
