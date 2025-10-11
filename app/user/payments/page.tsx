import { getUserCookie } from '@/lib/auth/cookie'
import { redirect } from 'next/navigation'
import { PaymentsClient } from './payments-client'

export const metadata = {
  title: '결제 내역 | kindt',
  description: '나의 결제 내역을 확인하고 관리할 수 있습니다.',
}

export default async function PaymentsPage() {
  const user = await getUserCookie()

  if (!user) {
    redirect('/login?returnUrl=/payments')
  }

  return <PaymentsClient />
}
