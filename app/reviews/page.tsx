// 이 페이지는 제거됨 - 사용자 요청에 따라 /reviews 페이지 불필요
// 리뷰는 admin 페이지에서 관리하고, 선택적으로 다른 곳에서 표시

'use client'

import Link from "next/link";

// Force dynamic rendering to prevent SSR issues with client components
export const dynamic = 'force-dynamic';

export default function ReviewsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-gray-600 mb-6">
          이 페이지는 더 이상 사용되지 않습니다.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

