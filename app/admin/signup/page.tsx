import { redirect } from 'next/navigation'

export default function AdminSignupPage() {
  // 이제 사용자 생성은 관리자 페이지에서만 가능
  redirect('/admin/users')
}