import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default async function AuthError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_code?: string; error_description?: string }>
}) {
  const { error, error_code, error_description } = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <CardTitle className="text-2xl">인증 오류</CardTitle>
          <CardDescription>
            로그인 처리 중 문제가 발생했습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error_description && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">
                <strong>오류 내용:</strong> {decodeURIComponent(error_description)}
              </p>
            </div>
          )}

          {(error || error_code) && (
            <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
              {error && <p><strong>Error:</strong> {error}</p>}
              {error_code && <p><strong>Code:</strong> {error_code}</p>}
            </div>
          )}

          <div className="space-y-2 pt-4">
            <p className="text-sm text-gray-600">
              가능한 해결 방법:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>다시 시도해주세요</li>
              <li>다른 로그인 방법을 사용해보세요</li>
              <li>문제가 계속되면 관리자에게 문의하세요</li>
            </ul>
          </div>

          <Button asChild className="w-full">
            <Link href="/login">
              로그인 페이지로 돌아가기
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}