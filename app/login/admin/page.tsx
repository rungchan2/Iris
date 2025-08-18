import { Metadata } from 'next'
import { AdminSignupForm } from '@/components/admin/admin-signup-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: '관리자 회원가입 - Photo4You',
  description: '초대 코드를 통한 관리자 회원가입',
}

export default async function AdminSignupPage() {
  const supabase = await createClient()
  
  // 이미 로그인된 경우 admin 페이지로 리디렉션
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            관리자 회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            초대 코드를 받으신 분만 가입할 수 있습니다.
          </p>
        </div>
        
        <AdminSignupForm />
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <a
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              로그인하기
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}