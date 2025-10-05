import { Metadata } from 'next'
import CouponManagement from '@/components/admin/coupon-management'

export const metadata: Metadata = {
  title: '쿠폰 발급 관리 - 관리자',
  description: '쿠폰 발급 및 관리',
}

export default function CouponsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">쿠폰 발급 관리</h2>
      </div>

      <CouponManagement />
    </div>
  )
}
