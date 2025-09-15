import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Company Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">선셋시네마</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>대표자: 차재영</p>
                <p>사업자 등록번호: 591-29-01812</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">연락처</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>전화: 010-4126-5468</p>
                <p className="leading-relaxed">
                  주소: 경기도 용인시 기흥구 향린1로 94-3(동백동)
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">바로가기</h3>
              <div className="space-y-2 text-sm">
                <Link 
                  href="/quiz" 
                  className="block text-gray-600 hover:text-gray-900 transition-colors"
                >
                  성향 진단하기
                </Link>
                <Link 
                  href="/photographers" 
                  className="block text-gray-600 hover:text-gray-900 transition-colors"
                >
                  작가 둘러보기
                </Link>
                <Link 
                  href="/gallery" 
                  className="block text-gray-600 hover:text-gray-900 transition-colors"
                >
                  갤러리
                </Link>
                <Link 
                  href="/reviews" 
                  className="block text-gray-600 hover:text-gray-900 transition-colors"
                >
                  고객 후기
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-gray-500">
                © 2025 선셋시네마. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm">
                <Link 
                  href="/privacy" 
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  개인정보처리방침
                </Link>
                <Link 
                  href="/terms" 
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  이용약관
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}