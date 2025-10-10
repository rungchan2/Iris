import { getAllTerms } from '@/lib/actions/terms'
import { TermsManagementClient } from '@/components/admin/terms/terms-management-client'

export const metadata = {
  title: '이용약관 관리 | kindt Admin',
  description: '이용약관 버전 관리',
}

export default async function TermsManagementPage() {
  const result = await getAllTerms()

  const initialTerms = result.success ? result.data || [] : []

  return <TermsManagementClient initialTerms={initialTerms} />
}
