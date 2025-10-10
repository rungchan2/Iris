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
                <p>상호명: 선셋시네마</p>
                <p>대표자명: 차재영</p>
                <p>사업자 등록번호: 591-29-01812</p>
                <p className="leading-relaxed">
                  주소: 경기도 용인시 기흥구 향린1로 94-3(동백동)
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">연락처</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>대표전화: 010-4126-5468</p>
                <p>개발담당: 010-2625-9706</p>
                <div className="pt-2 space-y-2">
                  <a
                    href="https://www.instagram.com/kindt.official/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    Instagram
                  </a>
                  <a
                    href="mailto:contact@kindt.kr"
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    kindt.offical@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">바로가기</h3>
              <div className="space-y-2 text-sm">
                <Link
                  href="/matching"
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
                {/* <Link 
                  href="/reviews" 
                  className="block text-gray-600 hover:text-gray-900 transition-colors"
                >
                  고객 후기
                </Link> */}
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
