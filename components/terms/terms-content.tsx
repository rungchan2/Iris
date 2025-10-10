'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { TermsWithSections } from '@/types'

interface TermsContentProps {
  terms: TermsWithSections
}

export function TermsContent({ terms }: TermsContentProps) {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 space-y-4">
          <h1 className="text-3xl font-bold md:text-4xl">kindt 이용약관</h1>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>버전: {terms.version}</p>
            <p>
              시행일:{' '}
              {format(new Date(terms.effective_date), 'PPP', { locale: ko })}
            </p>
          </div>
        </div>

        <div className="space-y-12">
          {terms.sections.map((section) => (
            <section key={section.id} className="space-y-4">
              <h2 className="text-xl font-semibold md:text-2xl">
                제{section.article_number}조 ({section.title})
              </h2>
              <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 border-t pt-8">
          <p className="text-sm text-muted-foreground">
            본 약관은 {format(new Date(terms.effective_date), 'PPP', { locale: ko })}부터 시행됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
