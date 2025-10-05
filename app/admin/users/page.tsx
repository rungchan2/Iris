import { Metadata } from 'next'
import { UserManagement } from '@/components/admin/user-management'

export const metadata: Metadata = {
  title: '사용자 관리 - kindt',
  description: '관리자 및 작가 사용자 생성 및 관리',
}

export default async function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">사용자 관리</h1>
        <p className="text-muted-foreground">
          시스템 관리자 및 작가 사용자를 생성하고 관리합니다.
        </p>
      </div>
      
      <UserManagement />
    </div>
  )
}