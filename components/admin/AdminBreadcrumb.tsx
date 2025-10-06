'use client'

import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface BreadcrumbRoute {
  label: string
  href?: string
}

const routeMap: Record<string, BreadcrumbRoute> = {
  '/admin': { label: '문의' },
  '/admin/category': { label: '카테고리' },
  '/admin/photos': { label: '사진' },
  '/admin/schedule': { label: '일정' },
  '/admin/users': { label: '사용자 관리' },
  '/admin/admin-users': { label: '관리자 계정' },
  '/admin/matching': { label: 'AI 매칭 시스템' },
  '/admin/matching/questions': { label: '질문 관리' },
  '/admin/matching/photographers': { label: '작가 프로필 관리' },
  '/admin/matching/analytics': { label: '성능 분석' },
  '/admin/matching/settings': { label: '시스템 설정' },
  '/admin/products': { label: '상품 관리' },
  '/admin/analytics': { label: '통계 및 분석' },
  '/admin/reviews': { label: '리뷰 관리' },
  '/admin/settlements': { label: '정산 관리' },
  '/admin/payments': { label: '결제 관리' },
  '/admin/coupons': { label: '쿠폰 발급' },
  '/admin/coupon-templates': { label: '쿠폰 템플릿' },
  '/admin/stories': { label: '사연 관리' },
  '/admin/my-page': { label: '내 계정' },
}

export default function AdminBreadcrumb() {
  const pathname = usePathname()
  
  // Split pathname into segments
  const pathSegments = pathname.split('/').filter(Boolean)
  
  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbRoute[] = []
  let currentPath = ''
  
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const route = routeMap[currentPath]
    
    if (route) {
      breadcrumbItems.push({
        label: route.label,
        href: index === pathSegments.length - 1 ? undefined : currentPath
      })
    }
  })
  
  // Don't show breadcrumb if we're on the root admin page or if no valid routes found
  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink href={item.href}>
                  {item.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}