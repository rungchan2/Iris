import { getActiveTerms } from '@/lib/actions/terms'
import { TermsContent } from '@/components/terms/terms-content'

export const metadata = {
  title: '이용약관 | kindt',
  description: 'kindt 서비스 이용약관',
}

export default async function TermsPage() {
  const result = await getActiveTerms()

  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-3xl font-bold">이용약관</h1>
          <p className="text-muted-foreground">
            현재 활성화된 이용약관이 없습니다.
          </p>
        </div>
      </div>
    )
  }

  return <TermsContent terms={result.data} />
}
