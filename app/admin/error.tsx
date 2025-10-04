'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'

/**
 * Admin Error Handler
 *
 * Catches errors in the admin section
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin error:', error)
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">관리자 페이지 오류</CardTitle>
              <CardDescription className="mt-1">
                관리자 페이지를 로드하는 중 문제가 발생했습니다.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            페이지를 새로고침하거나 관리자 대시보드로 돌아가주세요.
          </p>

          {process.env.NODE_ENV === 'development' && error.message && (
            <details className="mt-4 p-4 bg-muted rounded-lg border">
              <summary className="cursor-pointer text-sm font-medium">
                개발 모드: 에러 상세 정보
              </summary>
              <pre className="mt-3 text-xs overflow-auto max-h-48">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={reset} className="flex-1 gap-2">
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/admin')}
            className="flex-1 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            대시보드로
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
