'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, TrendingUp, AlertCircle, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { getPaymentStatistics } from '@/lib/actions/payments'

interface PaymentStats {
  statusStats: Record<string, number>
  providerStats: Record<string, { count: number; total: number }>
  monthlyRevenue: any[]
}

export default function PaymentStatistics() {
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    setLoading(true)
    try {
      const result = await getPaymentStatistics()
      if (result.success && result.data) {
        // getPaymentStatistics가 PaymentStatistics 형태로 반환한다고 가정
        const data = result.data
        setStats({
          statusStats: {
            pending: data.pendingPayments || 0,
            paid: data.completedPayments || 0,
            failed: data.failedPayments || 0,
            cancelled: data.cancelledPayments || 0,
            refunded: data.refundedPayments || 0
          },
          providerStats: data.paymentMethodStats || {},
          monthlyRevenue: [] // 월별 수익 데이터는 별도 처리 필요
        })
      }
    } catch (error) {
      console.error('Error loading payment statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'refunded':
        return <RotateCcw className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      paid: '결제완료',
      pending: '대기중',
      failed: '실패',
      cancelled: '취소',
      refunded: '환불'
    } as Record<string, string>
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-8">
        통계 데이터를 불러올 수 없습니다.
      </div>
    )
  }

  const totalPayments = Object.values(stats.statusStats).reduce((sum, count) => sum + count, 0)
  const totalRevenue = Object.values(stats.providerStats).reduce((sum, provider) => sum + provider.total, 0)

  return (
    <div className="space-y-6">
      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 결제건수</p>
                <p className="text-2xl font-bold">{totalPayments.toLocaleString()}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 매출</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">성공률</p>
                <p className="text-2xl font-bold">
                  {totalPayments > 0 
                    ? Math.round(((stats.statusStats.paid || 0) / totalPayments) * 100)
                    : 0
                  }%
                </p>
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
                <p className="text-2xl font-bold">
                  {stats.statusStats.paid && stats.statusStats.paid > 0
                    ? formatCurrency(Math.round(totalRevenue / stats.statusStats.paid))
                    : '₩0'
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 상태별 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>결제 상태별 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.statusStats).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="font-medium">{getStatusLabel(status)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{count}</Badge>
                    <span className="text-sm text-gray-500">
                      ({totalPayments > 0 ? Math.round((count / totalPayments) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 결제수단별 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>결제수단별 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.providerStats).map(([provider, data]) => (
                <div key={provider} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{provider}</span>
                    <Badge variant="outline">{data.count}건</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">매출액</span>
                    <span className="font-medium">{formatCurrency(data.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">평균 결제금액</span>
                    <span className="font-medium">
                      {data.count > 0 ? formatCurrency(Math.round(data.total / data.count)) : '₩0'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 월별 매출 */}
      {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>최근 결제 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.monthlyRevenue.slice(0, 10).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex flex-col">
                    <span className="font-medium">{payment.buyer_name}</span>
                    <span className="text-sm text-gray-500">{payment.order_id}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(payment.amount)}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(payment.paid_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}