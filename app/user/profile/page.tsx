import { getUserCookie } from '@/lib/auth/cookie'
import { redirect } from 'next/navigation'
import { ProfileClient } from './profile-client'
import { getUserProfile } from '@/lib/actions/user-profile'

export const metadata = {
  title: '내 프로필 | kindt',
  description: '사용자 프로필 정보를 확인하고 수정할 수 있습니다.',
}

export default async function ProfilePage() {
  const cookieUser = await getUserCookie()

  if (!cookieUser) {
    redirect('/login?returnUrl=/user/profile')
  }

  const result = await getUserProfile()

  if (!result.success || !result.data) {
    redirect('/login?returnUrl=/user/profile')
  }

  return <ProfileClient user={result.data} />
}
