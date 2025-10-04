'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

/**
 * Global Error Handler for Next.js 15
 *
 * This component catches errors in the app directory and displays a fallback UI.
 * It's automatically used by Next.js when an error occurs in any page or layout.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error:', error)
    }

    // TODO: Send error to error tracking service
    // Example:
    // Sentry.captureException(error, {
    //   tags: { digest: error.digest }
    // })
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl">오류가 발생했습니다</CardTitle>
                  <CardDescription className="mt-1">
                    죄송합니다. 페이지를 로드하는 중 문제가 발생했습니다.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  일시적인 문제일 수 있습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
                </p>

                {process.env.NODE_ENV === 'development' && (
                  <details className="p-4 bg-muted rounded-lg border">
                    <summary className="cursor-pointer text-sm font-medium flex items-center gap-2">
                      <span>개발 모드: 에러 상세 정보</span>
                    </summary>
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Error Message:
                        </p>
                        <p className="text-sm font-mono bg-background p-2 rounded">
                          {error.message}
                        </p>
                      </div>
                      {error.digest && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Error Digest:
                          </p>
                          <p className="text-sm font-mono bg-background p-2 rounded">
                            {error.digest}
                          </p>
                        </div>
                      )}
                      {error.stack && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Stack Trace:
                          </p>
                          <pre className="text-xs font-mono bg-background p-2 rounded overflow-auto max-h-48">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                onClick={reset}
                className="flex-1 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/')}
                className="flex-1 gap-2"
              >
                <Home className="h-4 w-4" />
                홈으로
              </Button>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  )
}
