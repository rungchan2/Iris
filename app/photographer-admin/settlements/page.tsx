import { Metadata } from 'next'
import PhotographerSettlementManagement from '@/components/photographer/settlement-management'

export const metadata: Metadata = {
  title: '정산 관리 - 작가 관리',
  description: '내 촬영 정산 내역을 확인합니다.',
}

export default function PhotographerSettlementsPage() {
  return (
    <div className="">
      <PhotographerSettlementManagement />
    </div>
  )
}
