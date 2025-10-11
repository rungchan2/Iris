'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { getPaymentLogs } from '@/lib/actions/payment-recovery'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'

interface PaymentLog {
  id: string
  payment_id: string
  event_type: string
  event_data?: any
  error_message?: string
  http_status_code?: number
  ip_address?: string
  user_agent?: string
  created_at: string
}

interface PaymentLogsViewerProps {
  paymentId: string
}

export default function PaymentLogsViewer({ paymentId }: PaymentLogsViewerProps) {
  const [logs, setLogs] = useState<PaymentLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [paymentId])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const result = await getPaymentLogs(paymentId)
      if (result.success && result.data) {
        setLogs(result.data)
      } else {
        toast.error('로그 조회 실패: ' + result.error)
      }
    } catch (error) {
      toast.error('로그 조회 중 오류 발생')
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('completed') || eventType.includes('success') || eventType === 'recovered') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (eventType.includes('failed') || eventType.includes('error') || eventType.includes('fraud')) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    if (eventType.includes('timeout') || eventType.includes('retry')) {
      return <Clock className="h-4 w-4 text-orange-500" />
    }
    return <AlertCircle className="h-4 w-4 text-blue-500" />
  }

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'prepare': '결제 준비',
      'payment_created': '결제 생성',
      'processing_start': '승인 처리 시작',
      'toss_api_failed': '토스 API 실패',
      'payment_completed': '결제 완료',
      'payment_failed': '결제 실패',
      'fraud_attempt': '사기 시도 감지',
      'duplicate_request': '중복 요청',
      'concurrent_request': '동시 요청',
      'timeout': '타임아웃',
      'manual_sync': '수동 동기화',
      'admin_force_update': '관리자 강제 업데이트',
      'settlement_created_manually': '정산 항목 수동 생성',
      'recovered': '복구 완료',
      'critical_db_failure': '치명적 DB 오류'
    }
    return labels[eventType] || eventType
  }

  const getEventBadgeVariant = (eventType: string) => {
    if (eventType.includes('completed') || eventType.includes('success') || eventType === 'recovered') {
      return 'default' as const
    }
    if (eventType.includes('failed') || eventType.includes('error') || eventType.includes('fraud')) {
      return 'destructive' as const
    }
    if (eventType.includes('timeout') || eventType.includes('retry')) {
      return 'secondary' as const
    }
    return 'outline' as const
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            결제 처리 로그
            {logs.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {logs.length}개
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-500 py-8">로그를 불러오는 중...</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            아직 기록된 로그가 없습니다.
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {logs.map((log, index) => (
                <div
                  key={log.id}
                  className={`border rounded-lg p-4 space-y-2 ${
                    log.event_type.includes('error') || log.event_type.includes('failed')
                      ? 'border-red-200 bg-red-50'
                      : log.event_type.includes('completed') || log.event_type === 'recovered'
                      ? 'border-green-200 bg-green-50'
                      : 'bg-gray-50'
                  }`}
                >
                  {/* Event Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getEventIcon(log.event_type)}
                      <div>
                        <div className="font-medium text-gray-900">
                          {getEventLabel(log.event_type)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss.SSS', { locale: ko })}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getEventBadgeVariant(log.event_type)}>
                      #{index + 1}
                    </Badge>
                  </div>

                  {/* HTTP Status Code */}
                  {log.http_status_code && (
                    <div className="text-sm">
                      <span className="text-gray-600">HTTP 상태:</span>
                      <Badge
                        variant={log.http_status_code >= 400 ? 'destructive' : 'outline'}
                        className="ml-2"
                      >
                        {log.http_status_code}
                      </Badge>
                    </div>
                  )}

                  {/* Error Message */}
                  {log.error_message && (
                    <div className="bg-white rounded p-2 text-sm text-red-700">
                      <XCircle className="h-4 w-4 inline mr-1" />
                      {log.error_message}
                    </div>
                  )}

                  {/* Event Data */}
                  {log.event_data && Object.keys(log.event_data).length > 0 && (
                    <div className="bg-white rounded p-3">
                      <div className="text-xs font-medium text-gray-500 mb-2">상세 데이터:</div>
                      <pre className="text-xs bg-gray-100 rounded p-2 overflow-x-auto">
                        {JSON.stringify(log.event_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* IP & User Agent */}
                  {(log.ip_address || log.user_agent) && (
                    <div className="text-xs text-gray-500 space-y-1">
                      {log.ip_address && (
                        <div>
                          <span className="font-medium">IP:</span> {log.ip_address}
                        </div>
                      )}
                      {log.user_agent && (
                        <div>
                          <span className="font-medium">User-Agent:</span>{' '}
                          <span className="truncate block">{log.user_agent}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
