'use client'

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
import { CalendarIcon, Search, Filter, Eye, RefreshCw, Download, CreditCard, TrendingUp, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getPayments, getPayment, getPaymentStatistics } from '@/lib/actions/payments'
import { createClient } from '@/lib/supabase/client'
import { PaymentModel, PaymentStatus } from '@/lib/payments/types'

interface Payment {
  id: string
  order_id: string
  amount: number
  currency: string
  status: PaymentStatus
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
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
}

export default function PhotographerPaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [filters, setFilters] = useState<PaymentFilters>({})
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [photographerId, setPhotographerId] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<any>(null)
  const [sortField, setSortField] = useState<'created_at' | 'amount' | 'status'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    getCurrentPhotographer()
  }, [])

  useEffect(() => {
    if (photographerId) {
      loadPayments()
      loadStatistics()
    }
  }, [photographerId, currentPage, sortField, sortDirection])

  useEffect(() => {
    applyFilters()
  }, [payments, filters])

  const getCurrentPhotographer = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setPhotographerId(user.id)
    }
  }

  const loadPayments = async () => {
    if (!photographerId) return
    
    setLoading(true)
    try {
      const result = await getPayments({
        photographerId: photographerId,
        status: filters.status as any,
        startDate: filters.dateRange?.start ? format(filters.dateRange.start, 'yyyy-MM-dd') : undefined,
        endDate: filters.dateRange?.end ? format(filters.dateRange.end, 'yyyy-MM-dd') : undefined,
        limit: 20,
        offset: (currentPage - 1) * 20
      })

      if (result.success && result.data) {
        setPayments(result.data as any)
      } else {
        console.error('Failed to load payments:', (result as any).error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    if (!photographerId) return
    
    try {
      const result = await getPaymentStatistics(
        photographerId,
        filters.dateRange?.start ? format(filters.dateRange.start, 'yyyy-MM-dd') : undefined,
        filters.dateRange?.end ? format(filters.dateRange.end, 'yyyy-MM-dd') : undefined
      )
      
      if (result.success && result.data) {
        setStatistics(result.data)
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
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
      partialCancelled: 'outline',
      refunded: 'secondary',
      expired: 'destructive'
    } as const

    const labels = {
      pending: '대기중',
      ready: '준비완료',
      paid: '결제완료',
      failed: '실패',
      cancelled: '취소',
      partialCancelled: '부분취소',
      refunded: '환불',
      expired: '만료됨'
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
      if (result.success && result.data) {
        setSelectedPayment(result.data as any)
      }
    } catch (error) {
      console.error('Error loading payment details:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">내 결제 내역</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPayments} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 수익</p>
                  <p className="text-2xl font-bold">{formatCurrency(statistics.totalRevenue || 0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">완료된 결제</p>
                  <p className="text-2xl font-bold">{statistics.completedPayments || 0}건</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">평균 결제금액</p>
                  <p className="text-2xl font-bold">{formatCurrency(statistics.averageAmount || 0)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <SelectItem value="partialCancelled">부분취소</SelectItem>
                  <SelectItem value="refunded">환불</SelectItem>
                  <SelectItem value="expired">만료됨</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>기간</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.start ? (
                      <>
                        {format(filters.dateRange.start, 'MM/dd', { locale: ko })} - 
                        {filters.dateRange.end && format(filters.dateRange.end, 'MM/dd', { locale: ko })}
                      </>
                    ) : (
                      '날짜 선택'
                    )}
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
          </div>

          <Button onClick={loadPayments} disabled={loading} className="w-full md:w-auto">
            조회
          </Button>
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
                      주문일시
                      {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </Button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주문번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    구매자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Button variant="ghost" onClick={() => handleSort('amount')}>
                      금액
                      {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </Button>
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
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      로딩중...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      결제 내역이 없습니다
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(payment.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{payment.order_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{payment.buyer_name}</div>
                          <div className="text-sm text-gray-500">{payment.buyer_tel}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
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
      partialCancelled: 'outline',
      refunded: 'secondary',
      expired: 'destructive'
    } as const

    const labels = {
      pending: '대기중',
      ready: '준비완료',
      paid: '결제완료',
      failed: '실패',
      cancelled: '취소',
      partialCancelled: '부분취소',
      refunded: '환불',
      expired: '만료됨'
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
              {payment.products.price && (
                <div className="flex justify-between">
                  <span className="text-gray-600">상품가격:</span>
                  <span className="font-medium">{formatCurrency(payment.products.price)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}