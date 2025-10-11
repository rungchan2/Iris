'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { getRecoveryQueue, retryRecoveryItem } from '@/lib/actions/payment-recovery'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'

interface RecoveryItem {
  id: string
  payment_id: string
  order_id: string
  failed_step: string
  retry_count: number
  last_retry_at?: string
  error_message?: string
  status: 'pending' | 'recovered' | 'failed'
  created_at: string
  payment?: {
    order_id: string
    amount: number
    buyer_name: string
    status: string
    created_at: string
  }
}

export default function PaymentRecoveryQueue() {
  const [items, setItems] = useState<RecoveryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState<string | null>(null)

  useEffect(() => {
    loadQueue()
  }, [])

  const loadQueue = async () => {
    setLoading(true)
    try {
      const result = await getRecoveryQueue({ status: 'pending', limit: 50 })
      if (result.success) {
        setItems(result.data as RecoveryItem[])
      } else {
        toast.error('복구 큐 조회 실패: ' + result.error)
      }
    } catch (error) {
      toast.error('복구 큐 조회 중 오류 발생')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async (recoveryId: string) => {
    setRetrying(recoveryId)
    try {
      const result = await retryRecoveryItem(recoveryId)
      if (result.success) {
        toast.success('복구 성공!')
        loadQueue() // 목록 갱신
      } else {
        toast.error('복구 실패: ' + result.error)
      }
    } catch (error) {
      toast.error('복구 재시도 중 오류 발생')
    } finally {
      setRetrying(null)
    }
  }

  const getFailedStepLabel = (step: string) => {
    const labels: Record<string, string> = {
      'update_paid': '결제 완료 상태 업데이트',
      'create_settlement': '정산 항목 생성',
      'update_inquiry': '문의 상태 업데이트',
      'timeout': '토스 API 타임아웃',
      'toss_error': '토스 API 오류'
    }
    return labels[step] || step
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { label: '대기중', variant: 'secondary' as const },
      recovered: { label: '복구완료', variant: 'default' as const },
      failed: { label: '복구실패', variant: 'destructive' as const }
    }
    const config = configs[status as keyof typeof configs] || configs.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            복구 대기 큐
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">로딩 중...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            복구 대기 큐
            {items.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {items.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadQueue} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              복구가 필요한 결제가 없습니다. 모든 결제가 정상적으로 처리되었습니다.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-gray-50"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.payment?.order_id || item.order_id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.payment?.buyer_name} • {item.payment?.amount.toLocaleString()}원
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">실패 단계:</span>
                    <span className="ml-2 font-medium">
                      {getFailedStepLabel(item.failed_step)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">재시도 횟수:</span>
                    <span className="ml-2 font-medium">
                      {item.retry_count}/5
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">생성 시간:</span>
                    <span className="ml-2">
                      {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </span>
                  </div>
                  {item.last_retry_at && (
                    <div>
                      <span className="text-gray-500">마지막 재시도:</span>
                      <span className="ml-2">
                        {format(new Date(item.last_retry_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {item.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <div className="text-sm text-red-800">
                      <XCircle className="h-4 w-4 inline mr-1" />
                      {item.error_message}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleRetry(item.id)}
                    disabled={retrying === item.id || item.retry_count >= 5}
                  >
                    {retrying === item.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        재시도 중...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        수동 재시도
                      </>
                    )}
                  </Button>
                  {item.retry_count >= 5 && (
                    <Badge variant="destructive">최대 재시도 횟수 초과</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
