import { getUserCookie } from '@/lib/auth/cookie'
import { redirect } from 'next/navigation'
import { InquiriesClient } from './inquiries-client'

export const metadata = {
  title: '예약 내역 | kindt',
  description: '나의 예약 내역을 확인하고 관리할 수 있습니다.',
}

export default async function InquiriesPage() {
  const user = await getUserCookie()

  if (!user) {
    redirect('/login?returnUrl=/inquiries')
  }

  return <InquiriesClient />
}
