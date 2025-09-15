import { Metadata } from 'next'
import PaymentManagement from '@/components/admin/payment-management'

export const metadata: Metadata = {
  title: '결제 관리 - Admin',
  description: '결제 내역을 조회하고 관리합니다.',
}

export default function PaymentsPage() {
  return (
    <div className="">
      <PaymentManagement />
    </div>
  )
}