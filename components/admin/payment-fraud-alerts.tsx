'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, RefreshCw, AlertTriangle } from 'lucide-react'
import { getFraudAttempts, analyzePaymentAnomalies } from '@/lib/actions/payment-recovery'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'

interface FraudAttempt {
  id: string
  payment_id: string
  event_data: any
  error_message?: string
  ip_address?: string
  created_at: string
  payment?: {
    order_id: string
    amount: number
    buyer_name: string
    buyer_email: string
    user_id: string
  }
}

interface AnomalyData {
  timeoutRatio: number
  timeoutAlert: boolean
  suspiciousIPs: Array<{ ip: string; count: number }>
  tossErrorCount: number
  tossErrorAlert: boolean
}

export default function PaymentFraudAlerts() {
  const [fraudAttempts, setFraudAttempts] = useState<FraudAttempt[]>([])
  const [anomalies, setAnomalies] = useState<AnomalyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    // 5분마다 자동 갱신
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. 최근 24시간 사기 시도
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      const fraudResult = await getFraudAttempts({
        startDate: oneDayAgo.toISOString(),
        limit: 20
      })

      if (fraudResult.success) {
        setFraudAttempts(fraudResult.data as FraudAttempt[])
      }

      // 2. 이상 패턴 분석
      const anomalyResult = await analyzePaymentAnomalies()
      if (anomalyResult.success) {
        setAnomalies(anomalyResult.data as AnomalyData)
      }
    } catch (error) {
      toast.error('사기 감지 데이터 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 실시간 이상 패턴 알림 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              실시간 이상 패턴 감지
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {anomalies && (
            <>
              {/* 타임아웃 비율 경고 */}
              {anomalies.timeoutAlert && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>타임아웃 비율 경고</strong>
                    <div className="mt-1">
                      최근 5분간 타임아웃 비율: {anomalies.timeoutRatio.toFixed(1)}%
                      (기준: 20% 이상)
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* 토스 API 오류 경고 */}
              {anomalies.tossErrorAlert && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>토스 API 오류 감지</strong>
                    <div className="mt-1">
                      최근 5분간 연속 500 에러: {anomalies.tossErrorCount}회
                      (기준: 3회 이상)
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* 의심스러운 IP */}
              {anomalies.suspiciousIPs.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>의심스러운 IP 활동 감지</strong>
                    <div className="mt-2 space-y-1">
                      {anomalies.suspiciousIPs.map(({ ip, count }) => (
                        <div key={ip} className="text-sm">
                          IP: {ip} - {count}회 사기 시도
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* 정상 상태 */}
              {!anomalies.timeoutAlert &&
               !anomalies.tossErrorAlert &&
               anomalies.suspiciousIPs.length === 0 && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    현재 이상 패턴이 감지되지 않았습니다. 시스템이 정상적으로 운영 중입니다.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 사기 시도 내역 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            사기 시도 내역 (최근 24시간)
            {fraudAttempts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {fraudAttempts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-500 py-4">로딩 중...</div>
          ) : fraudAttempts.length === 0 ? (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                최근 24시간 동안 감지된 사기 시도가 없습니다.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {fraudAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-2"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">
                        {attempt.payment?.order_id || '주문번호 없음'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {attempt.payment?.buyer_name} ({attempt.payment?.buyer_email})
                      </div>
                    </div>
                    <Badge variant="destructive">사기 시도</Badge>
                  </div>

                  {/* Event Data */}
                  {attempt.event_data && (
                    <div className="bg-white rounded p-3 space-y-1 text-sm">
                      {attempt.event_data.db_amount && (
                        <div>
                          <span className="text-gray-600">DB 금액:</span>
                          <span className="ml-2 font-medium">
                            {attempt.event_data.db_amount.toLocaleString()}원
                          </span>
                        </div>
                      )}
                      {attempt.event_data.request_amount && (
                        <div>
                          <span className="text-gray-600">요청 금액:</span>
                          <span className="ml-2 font-medium text-red-600">
                            {attempt.event_data.request_amount.toLocaleString()}원
                          </span>
                        </div>
                      )}
                      {attempt.ip_address && (
                        <div>
                          <span className="text-gray-600">IP 주소:</span>
                          <span className="ml-2 font-mono">{attempt.ip_address}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {attempt.error_message && (
                    <div className="text-sm text-red-700">
                      {attempt.error_message}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500">
                    {format(new Date(attempt.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
