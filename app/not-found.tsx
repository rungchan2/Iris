import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, Search, Camera } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Decorative Elements */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 animate-pulse" />
          </div>
          <div className="relative flex items-center justify-center">
            <Camera className="w-20 h-20 text-purple-400" />
          </div>
        </div>

        {/* 404 Text */}
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-gray-600 leading-relaxed">
            요청하신 페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.
            <br />
            아래 버튼을 통해 원하는 페이지로 이동해보세요.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Link>
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" asChild>
              <Link href="/photographers">
                <Search className="w-4 h-4 mr-2" />
                작가 찾기
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/matching">
                <Camera className="w-4 h-4 mr-2" />
                매칭 시작
              </Link>
            </Button>
          </div>
          
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전 페이지로
          </Button>
        </div>

        {/* Footer Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>문제가 지속되면 고객센터로 문의해주세요.</p>
        </div>
      </div>
    </div>
  )
}