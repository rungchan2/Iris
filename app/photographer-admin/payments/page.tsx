import { Metadata } from 'next'
import PhotographerPaymentManagement from '@/components/photographer/payment-management'

export const metadata: Metadata = {
  title: '결제 내역 - 작가 관리',
  description: '내 촬영 결제 내역을 확인합니다.',
}

export default function PhotographerPaymentsPage() {
  return (
    <div className="">
      <PhotographerPaymentManagement />
    </div>
  )
}