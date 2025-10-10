'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Check, Edit, Eye, Trash2 } from 'lucide-react'
import type { TermsWithSections } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TermsViewDialog } from './terms-view-dialog'
import { TermsEditDialog } from './terms-edit-dialog'
import { activateTerms, deleteTerms } from '@/lib/actions/terms'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface TermsManagementClientProps {
  initialTerms: TermsWithSections[]
}

export function TermsManagementClient({
  initialTerms,
}: TermsManagementClientProps) {
  const [terms, setTerms] = useState(initialTerms)
  const [selectedTerms, setSelectedTerms] = useState<TermsWithSections | null>(
    null
  )
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [termsToDelete, setTermsToDelete] = useState<string | null>(null)
  const [isActivating, setIsActivating] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleView = (termsData: TermsWithSections) => {
    setSelectedTerms(termsData)
    setViewDialogOpen(true)
  }

  const handleEdit = (termsData: TermsWithSections) => {
    setSelectedTerms(termsData)
    setEditDialogOpen(true)
  }

  const handleActivate = async (id: string) => {
    setIsActivating(id)
    try {
      const result = await activateTerms(id)

      if (result.success) {
        // Update local state
        setTerms((prev) =>
          prev.map((t) => ({
            ...t,
            is_active: t.id === id,
          }))
        )
        toast.success('이용약관이 활성화되었습니다')
      } else {
        toast.error(result.error || '활성화에 실패했습니다')
      }
    } catch (error) {
      toast.error('활성화 중 오류가 발생했습니다')
    } finally {
      setIsActivating(null)
    }
  }

  const handleDeleteClick = (id: string) => {
    setTermsToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!termsToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteTerms(termsToDelete)

      if (result.success) {
        setTerms((prev) => prev.filter((t) => t.id !== termsToDelete))
        toast.success('이용약관이 삭제되었습니다')
      } else {
        toast.error(result.error || '삭제에 실패했습니다')
      }
    } catch (error) {
      toast.error('삭제 중 오류가 발생했습니다')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setTermsToDelete(null)
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">이용약관 관리</h1>
          <p className="text-muted-foreground">
            이용약관 버전을 관리하고 활성화할 수 있습니다
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>약관 목록</CardTitle>
          <CardDescription>
            등록된 모든 이용약관 버전을 확인할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>버전</TableHead>
                <TableHead>시행일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>조항 수</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    등록된 이용약관이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                terms.map((termsData) => (
                  <TableRow key={termsData.id}>
                    <TableCell className="font-medium">
                      {termsData.version}
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(termsData.effective_date),
                        'yyyy-MM-dd',
                        { locale: ko }
                      )}
                    </TableCell>
                    <TableCell>
                      {termsData.is_active ? (
                        <Badge variant="default">활성</Badge>
                      ) : (
                        <Badge variant="secondary">비활성</Badge>
                      )}
                    </TableCell>
                    <TableCell>{termsData.sections?.length || 0}개</TableCell>
                    <TableCell>
                      {format(new Date(termsData.created_at), 'yyyy-MM-dd', {
                        locale: ko,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(termsData)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(termsData)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!termsData.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleActivate(termsData.id)}
                            disabled={isActivating === termsData.id}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(termsData.id)}
                          disabled={termsData.is_active ?? false}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedTerms && (
        <>
          <TermsViewDialog
            terms={selectedTerms}
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
          />
          <TermsEditDialog
            terms={selectedTerms}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onUpdate={(updated) => {
              setTerms((prev) =>
                prev.map((t) => (t.id === updated.id ? updated : t))
              )
            }}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이용약관 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 이용약관을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
