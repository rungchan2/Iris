'use client'
import { adminLogger } from "@/lib/logger"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { CalendarIcon, Search, Filter, Eye, RefreshCw, Download } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getPayments, getPayment } from '@/lib/actions/payments'
import { getPhotographers } from '@/lib/actions/photographers'
import type { PaymentStatus, PaymentMethod } from '@/lib/payments/types'
import type { Database } from '@/types/database.types'
import PaymentStatistics from './payment-statistics'

interface Payment {
  id: string
  order_id: string
  amount: number
  currency: string
  status: 'pending' | 'ready' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'partialCancelled' | 'expired'
  provider: string
  payment_method: string
  buyer_name: string
  buyer_email: string
  buyer_tel: string
  created_at: string
  paid_at?: string
  users?: {
    name: string
    email: string
  }
  photographer?: {
    id: string
    name: string
    email: string
    phone: string
  }
  inquiry?: {
    id: string
    name: string
    phone: string
    status: string
    special_request?: string
  }
  products?: {
    id: string
    name: string
    description?: string
    price?: number
  }
}

interface PaymentFilters {
  status?: string
  provider?: string
  dateRange?: {
    start: Date
    end: Date
  }
  photographerId?: string
  search?: string
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [filters, setFilters] = useState<PaymentFilters>({})
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [photographers, setPhotographers] = useState<Array<Database['public']['Tables']['photographers']['Row']>>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<'created_at' | 'amount' | 'status'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showStatistics, setShowStatistics] = useState(true)

  useEffect(() => {
    loadPayments()
    loadPhotographers()
  }, [currentPage, sortField, sortDirection])

  useEffect(() => {
    applyFilters()
  }, [payments, filters])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const result = await getPayments({
        status: filters.status as PaymentStatus | undefined,
        paymentMethod: filters.provider as PaymentMethod | undefined,
        startDate: filters.dateRange?.start ? format(filters.dateRange.start, 'yyyy-MM-dd') : undefined,
        endDate: filters.dateRange?.end ? format(filters.dateRange.end, 'yyyy-MM-dd') : undefined,
        photographerId: filters.photographerId,
        limit: 20,
        offset: (currentPage - 1) * 20
      })

      if (result.success) {
        // Type assertion is safe here because getPayments returns PaymentModel[] which matches Payment interface
        setPayments(result.data as Payment[])
        // 페이지네이션 계산 (임시로 20개씩으로 계산)
        setTotalPages(Math.ceil(result.data.length / 20) || 1)
      } else {
        adminLogger.error('Failed to load payments:', result.error)
      }
    } catch (error) {
      adminLogger.error('Error loading payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPhotographers = async () => {
    try {
      const result = await getPhotographers()
      if (result && Array.isArray(result)) {
        setPhotographers(result)
      } else {
        setPhotographers([])
      }
    } catch (error) {
      adminLogger.error('Error loading photographers:', error)
      setPhotographers([])
    }
  }

  const applyFilters = () => {
    let filtered = [...payments]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(payment => 
        payment.order_id.toLowerCase().includes(searchLower) ||
        payment.buyer_name?.toLowerCase().includes(searchLower) ||
        payment.buyer_email?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredPayments(filtered)
  }

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getStatusBadge = (status: Payment['status']) => {
    const variants = {
      pending: 'secondary',
      ready: 'secondary',
      paid: 'default',
      failed: 'destructive',
      cancelled: 'outline',
      refunded: 'secondary',
      partialCancelled: 'secondary',
      expired: 'destructive'
    } as const

    const labels = {
      pending: '대기중',
      ready: '준비완료',
      paid: '결제완료',
      failed: '실패',
      cancelled: '취소',
      refunded: '환불',
      partialCancelled: '부분취소',
      expired: '만료'
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const handleViewDetails = async (paymentId: string) => {
    try {
      const result = await getPayment(paymentId)
      if (result.success) {
        // Type assertion is safe here because getPayment returns PaymentModel which matches Payment interface
        setSelectedPayment(result.data as Payment)
      } else {
        adminLogger.error('Failed to load payment details:', result.error)
      }
    } catch (error) {
      adminLogger.error('Error loading payment details:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">결제 관리</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowStatistics(!showStatistics)}
          >
            {showStatistics ? '통계 숨기기' : '통계 보기'}
          </Button>
          <Button variant="outline" onClick={loadPayments} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {showStatistics && (
        <Card>
          <CardHeader>
            <CardTitle>결제 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentStatistics />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>검색</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="주문번호, 구매자명, 이메일"
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>결제상태</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="ready">준비완료</SelectItem>
                  <SelectItem value="paid">결제완료</SelectItem>
                  <SelectItem value="failed">실패</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                  <SelectItem value="refunded">환불</SelectItem>
                  <SelectItem value="partialCancelled">부분취소</SelectItem>
                  <SelectItem value="expired">만료</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Provider Filter */}
            <div className="space-y-2">
              <Label>결제수단</Label>
              <Select
                value={filters.provider || 'all'}
                onValueChange={(value) => setFilters({ ...filters, provider: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="eximbay">Eximbay</SelectItem>
                  <SelectItem value="adyen">Adyen</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="toss">Toss</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Photographer Filter */}
            <div className="space-y-2">
              <Label>작가</Label>
              <Select
                value={filters.photographerId || 'all'}
                onValueChange={(value) => setFilters({ ...filters, photographerId: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체 작가" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {Array.isArray(photographers) && photographers.map((photographer) => (
                    <SelectItem key={photographer.id} value={photographer.id}>
                      {photographer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label>시작일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.start ? format(filters.dateRange.start, 'yyyy-MM-dd', { locale: ko }) : '시작일'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.start}
                    onSelect={(date) => date && setFilters({
                      ...filters,
                      dateRange: { ...filters.dateRange, start: date, end: filters.dateRange?.end || date }
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>종료일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.end ? format(filters.dateRange.end, 'yyyy-MM-dd', { locale: ko }) : '종료일'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.end}
                    onSelect={(date) => date && setFilters({
                      ...filters,
                      dateRange: { start: filters.dateRange?.start || date, end: date }
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={loadPayments} disabled={loading}>
              조회
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Button variant="ghost" onClick={() => handleSort('created_at')}>
                      주문번호/일시
                      {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </Button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    구매자 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작가
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Button variant="ghost" onClick={() => handleSort('amount')}>
                      금액
                      {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </Button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    결제수단
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Button variant="ghost" onClick={() => handleSort('status')}>
                      상태
                      {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </Button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      로딩중...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      결제 내역이 없습니다
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{payment.order_id}</div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(payment.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{payment.buyer_name}</div>
                          <div className="text-sm text-gray-500">{payment.buyer_email}</div>
                          <div className="text-sm text-gray-500">{payment.buyer_tel}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {payment.photographer?.name || '미지정'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {payment.provider}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.payment_method}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(payment.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              상세보기
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <PaymentDetailsModal payment={selectedPayment} />
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex justify-between items-center border-t">
              <div className="text-sm text-gray-500">
                {filteredPayments.length}개 결과
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  이전
                </Button>
                <span className="text-sm py-2 px-3">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PaymentDetailsModal({ payment }: { payment: Payment | null }) {
  if (!payment) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          결제 정보를 불러오는 중...
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const getStatusBadge = (status: Payment['status']) => {
    const variants = {
      pending: 'secondary',
      ready: 'secondary',
      paid: 'default',
      failed: 'destructive',
      cancelled: 'outline',
      refunded: 'secondary',
      partialCancelled: 'secondary',
      expired: 'destructive'
    } as const

    const labels = {
      pending: '대기중',
      ready: '준비완료',
      paid: '결제완료',
      failed: '실패',
      cancelled: '취소',
      refunded: '환불',
      partialCancelled: '부분취소',
      expired: '만료'
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>결제 상세 정보</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 결제 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">결제 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">주문번호:</span>
              <span className="font-medium">{payment.order_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">결제금액:</span>
              <span className="font-medium text-lg">{formatCurrency(payment.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">결제상태:</span>
              {getStatusBadge(payment.status)}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">결제수단:</span>
              <span className="font-medium capitalize">{payment.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">결제방법:</span>
              <span className="font-medium">{payment.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">주문일시:</span>
              <span className="font-medium">
                {format(new Date(payment.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
              </span>
            </div>
            {payment.paid_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">결제완료일시:</span>
                <span className="font-medium">
                  {format(new Date(payment.paid_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 구매자 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">구매자 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">이름:</span>
              <span className="font-medium">{payment.buyer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">이메일:</span>
              <span className="font-medium">{payment.buyer_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">연락처:</span>
              <span className="font-medium">{payment.buyer_tel}</span>
            </div>
          </CardContent>
        </Card>

        {/* 작가 정보 */}
        {payment.photographer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">작가 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">작가명:</span>
                <span className="font-medium">{payment.photographer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">이메일:</span>
                <span className="font-medium">{payment.photographer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">연락처:</span>
                <span className="font-medium">{payment.photographer.phone}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 상품 정보 */}
        {payment.products && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">상품 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">상품명:</span>
                <span className="font-medium">{payment.products.name}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 관리 액션 */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline">
          환불 처리
        </Button>
        <Button variant="outline">
          상태 동기화
        </Button>
      </div>
    </div>
  )
}