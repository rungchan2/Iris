import { Metadata } from 'next'
import CouponTemplateManagement from '@/components/admin/coupon-template-management'

export const metadata: Metadata = {
  title: '쿠폰 템플릿 관리 - 관리자',
  description: '쿠폰 템플릿 생성 및 관리',
}

export default function CouponTemplatesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">쿠폰 템플릿 관리</h2>
      </div>
      <CouponTemplateManagement />
    </div>
  )
}
