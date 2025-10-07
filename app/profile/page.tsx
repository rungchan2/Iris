import { getUserCookie } from '@/lib/auth/cookie'
import { redirect } from 'next/navigation'
import { ProfileClient } from './profile-client'

export const metadata = {
  title: '내 프로필 | kindt',
  description: '사용자 프로필 정보를 확인하고 수정할 수 있습니다.',
}

export default async function ProfilePage() {
  const user = await getUserCookie()

  if (!user) {
    redirect('/login?returnUrl=/profile')
  }

  return <ProfileClient user={user} />
}
