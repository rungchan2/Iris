'use client'

import { useEffect, useState } from 'react'
import { getUserPayments, requestRefund, type PaymentWithDetails } from '@/lib/actions/user-payments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, Calendar, User, Receipt, AlertCircle, Loader2, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'

export function PaymentsClient() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [filteredPayments, setFilteredPayments] = useState<PaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundLoading, setRefundLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, dateFilter, searchQuery])

  const loadPayments = async () => {
    setLoading(true)
    const result = await getUserPayments()
    if (result.success) {
      setPayments(result.data)
    } else {
      toast.error('결제 내역을 불러오는데 실패했습니다')
    }
    setLoading(false)
  }

  const filterPayments = () => {
    let filtered = [...payments]

    // Date filter - use paid_at if available, otherwise created_at
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case '1month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case '3months':
          filterDate.setMonth(now.getMonth() - 3)
          break
        case '6months':
          filterDate.setMonth(now.getMonth() - 6)
          break
      }

      filtered = filtered.filter((payment) => {
        const paymentDate = payment.paid_at
          ? new Date(payment.paid_at)
          : payment.created_at
          ? new Date(payment.created_at)
          : null

        return paymentDate && paymentDate >= filterDate
      })
    }

    // Search by product name or photographer name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((payment) => {
        const productName = payment.product?.name?.toLowerCase() || ''
        const photographerName = payment.photographer?.name?.toLowerCase() || ''
        const inquiryName = payment.inquiry?.name?.toLowerCase() || ''

        return productName.includes(query) || photographerName.includes(query) || inquiryName.includes(query)
      })
    }

    setFilteredPayments(filtered)
  }

  const handleRefundClick = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment)
    setRefundDialogOpen(true)
    setRefundReason('')
  }

  const handleRefundSubmit = async () => {
    if (!selectedPayment) return
    if (!refundReason.trim()) {
      toast.error('환불 사유를 입력해주세요')
      return
    }

    setRefundLoading(true)
    const result = await requestRefund(selectedPayment.id, refundReason)

    if (result.success) {
      toast.success('환불이 요청되었습니다')
      setRefundDialogOpen(false)
      loadPayments() // Reload payments
    } else {
      toast.error(result.error || '환불 요청에 실패했습니다')
    }
    setRefundLoading(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700">결제완료</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-700">취소됨</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">실패</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">대기중</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">

      {/* Content */}
      <div className="mx-auto pb-8">
        <div className="space-y-6">
          {/* Filter & Search Section */}
          <Card>
            <CardHeader>
              <CardTitle>검색 및 필터</CardTitle>
              <CardDescription>날짜별 필터링 및 상품/작가명 검색</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="md:w-[200px]">
                    <SelectValue placeholder="전체 기간" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 기간</SelectItem>
                    <SelectItem value="1month">최근 1개월</SelectItem>
                    <SelectItem value="3months">최근 3개월</SelectItem>
                    <SelectItem value="6months">최근 6개월</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="상품명 또는 작가명으로 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment List */}
          {payments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">결제 내역이 없습니다</p>
                <Link href="/photographers">
                  <Button className="mt-4">작가 둘러보기</Button>
                </Link>
              </CardContent>
            </Card>
          ) : filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">검색 결과가 없습니다</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setDateFilter('all')
                    setSearchQuery('')
                  }}
                >
                  필터 초기화
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {payment.product?.name || payment.inquiry?.name || '촬영 예약'}
                        </CardTitle>
                        <CardDescription>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(payment.created_at!), 'yyyy년 M월 d일', { locale: ko })}
                          </span>
                        </CardDescription>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">결제 금액</span>
                        <p className="font-semibold text-lg">{formatAmount(payment.amount)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">결제 수단</span>
                        <p className="font-medium">{payment.payment_method || '-'}</p>
                      </div>
                      {payment.photographer && (
                        <div>
                          <span className="text-gray-600">작가</span>
                          <p className="font-medium flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {payment.photographer.name}
                          </p>
                        </div>
                      )}
                      {payment.inquiry?.desired_date && (
                        <div>
                          <span className="text-gray-600">촬영 희망일</span>
                          <p className="font-medium">
                            {format(new Date(payment.inquiry.desired_date), 'yyyy-MM-dd')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      {payment.receipt_url && (
                        <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Receipt className="w-4 h-4 mr-1" />
                            영수증
                          </Button>
                        </a>
                      )}
                      {payment.status === 'paid' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRefundClick(payment)}
                        >
                          환불 요청
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>환불 요청</DialogTitle>
            <DialogDescription>
              환불 사유를 입력해주세요. 환불은 결제 수단에 따라 3-7영업일이 소요될 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">결제 금액</span>
                  <span className="font-semibold">{formatAmount(selectedPayment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">결제일</span>
                  <span className="text-sm">
                    {format(new Date(selectedPayment.created_at!), 'yyyy-MM-dd')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-reason">환불 사유 *</Label>
                <Textarea
                  id="refund-reason"
                  placeholder="환불 사유를 입력해주세요"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  환불은 결제 취소 후 영업일 기준 3-7일 내에 처리됩니다.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleRefundSubmit} disabled={refundLoading}>
              {refundLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                '환불 요청'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
