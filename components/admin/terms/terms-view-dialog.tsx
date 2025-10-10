'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { TermsWithSections } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface TermsViewDialogProps {
  terms: TermsWithSections
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsViewDialog({
  terms,
  open,
  onOpenChange,
}: TermsViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>이용약관 상세</DialogTitle>
            {terms.is_active && <Badge variant="default">활성</Badge>}
          </div>
          <DialogDescription>
            버전 {terms.version} ·{' '}
            {format(new Date(terms.effective_date), 'PPP', { locale: ko })} 시행
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[600px]">
          <div className="space-y-8 pr-4">
            {terms.sections.map((section) => (
              <div key={section.id} className="space-y-3">
                <h3 className="text-lg font-semibold">
                  제{section.article_number}조 ({section.title})
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
