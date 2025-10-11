'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { termsCreateSchema, type TermsCreateFormData, type TermsWithSections, type DocumentType } from '@/types'
import { DOCUMENT_TYPE_LABELS } from '@/types'
import { createTerms } from '@/lib/actions/terms'
import { toast } from 'sonner'
import { adminLogger } from '@/lib/logger'

interface TermsCreateDialogProps {
  documentType: DocumentType
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (terms: TermsWithSections) => void
}

export function TermsCreateDialog({
  documentType,
  open,
  onOpenChange,
  onCreated,
}: TermsCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TermsCreateFormData>({
    resolver: zodResolver(termsCreateSchema),
    defaultValues: {
      document_type: documentType,
      version: '',
      effective_date: new Date(),
      is_active: false,
      sections: [
        {
          article_number: 1,
          title: '',
          content: '',
          display_order: 0,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'sections',
  })

  const onSubmit = async (data: TermsCreateFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createTerms(data)

      if (result.success && result.data) {
        toast.success('약관이 생성되었습니다')
        onCreated(result.data)
        onOpenChange(false)
        form.reset()
      } else {
        toast.error('약관 생성에 실패했습니다')
      }
    } catch (error) {
      adminLogger.error('Error creating terms:', error)
      toast.error('약관 생성 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddSection = () => {
    const lastSection = fields[fields.length - 1]
    append({
      article_number: (lastSection?.article_number || 0) + 1,
      title: '',
      content: '',
      display_order: fields.length,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 {DOCUMENT_TYPE_LABELS[documentType]} 생성</DialogTitle>
          <DialogDescription>
            새로운 버전의 {DOCUMENT_TYPE_LABELS[documentType]}을 작성합니다
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...form.register('document_type')} />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>버전</FormLabel>
                    <FormControl>
                      <Input placeholder="예: v1.0.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effective_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>시행일</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>즉시 활성화</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      체크하면 이 버전이 즉시 활성화됩니다
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">조항</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSection}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  조항 추가
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-3 p-4 border rounded-lg relative"
                >
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name={`sections.${index}.article_number`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>조항 번호</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`sections.${index}.display_order`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>표시 순서</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`sections.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>제목</FormLabel>
                        <FormControl>
                          <Input placeholder="조항 제목" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`sections.${index}.content`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>내용</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="조항 내용"
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '생성 중...' : '생성'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
