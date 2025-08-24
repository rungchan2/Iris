import { Metadata } from 'next'
import { InviteCodeManager } from '@/components/admin/invite-code-manager'

export const metadata: Metadata = {
  title: '초대 코드 관리 - Iris',
  description: '어드민 초대 코드 생성 및 관리',
}

export default async function InviteCodesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">초대 코드 관리</h1>
        <p className="text-muted-foreground">
          새로운 어드민 사용자를 위한 초대 코드를 생성하고 관리합니다.
        </p>
      </div>
      
      <InviteCodeManager />
    </div>
  )
}