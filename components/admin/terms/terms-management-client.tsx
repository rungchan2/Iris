'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Check, Edit, Eye, Plus, Trash2 } from 'lucide-react'
import type { TermsWithSections, DocumentType } from '@/types'
import { DOCUMENT_TYPE, DOCUMENT_TYPE_LABELS } from '@/types'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TermsViewDialog } from './terms-view-dialog'
import { TermsEditDialog } from './terms-edit-dialog'
import { TermsCreateDialog } from './terms-create-dialog'
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
import { adminLogger } from '@/lib/logger'

interface TermsManagementClientProps {
  initialTerms: TermsWithSections[]
}

export function TermsManagementClient({
  initialTerms,
}: TermsManagementClientProps) {
  const [activeTab, setActiveTab] = useState<DocumentType>(DOCUMENT_TYPE.TERMS_OF_SERVICE)
  const [terms, setTerms] = useState(initialTerms)
  const [selectedTerms, setSelectedTerms] = useState<TermsWithSections | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [termsToDelete, setTermsToDelete] = useState<string | null>(null)
  const [isActivating, setIsActivating] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter terms by document type
  const filteredTerms = terms.filter(t => t.document_type === activeTab)

  const handleView = (termsData: TermsWithSections) => {
    setSelectedTerms(termsData)
    setViewDialogOpen(true)
  }

  const handleEdit = (termsData: TermsWithSections) => {
    setSelectedTerms(termsData)
    setEditDialogOpen(true)
  }

  const handleCreateNew = () => {
    setCreateDialogOpen(true)
  }

  const handleActivate = async (id: string) => {
    setIsActivating(id)
    try {
      const result = await activateTerms(id)

      if (result.success) {
        // Update local state: deactivate all in same document type, activate selected
        setTerms((prev) =>
          prev.map((t) => ({
            ...t,
            is_active: t.document_type === activeTab ? t.id === id : t.is_active,
          }))
        )
        toast.success('약관이 활성화되었습니다')
      } else {
        toast.error(result.error || '활성화에 실패했습니다')
      }
    } catch (error) {
      adminLogger.error('Error activating terms:', error)
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
        toast.success('약관이 삭제되었습니다')
      } else {
        toast.error(result.error || '삭제에 실패했습니다')
      }
    } catch (error) {
      adminLogger.error('Error deleting terms:', error)
      toast.error('삭제 중 오류가 발생했습니다')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setTermsToDelete(null)
    }
  }

  const renderTermsTable = () => (
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
        {filteredTerms.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              등록된 약관이 없습니다
            </TableCell>
          </TableRow>
        ) : (
          filteredTerms.map((termsData) => (
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
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">약관 관리</h1>
          <p className="text-muted-foreground">
            이용약관 및 개인정보처리방침을 관리하고 활성화할 수 있습니다
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          새 버전 생성
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DocumentType)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value={DOCUMENT_TYPE.TERMS_OF_SERVICE}>
            {DOCUMENT_TYPE_LABELS[DOCUMENT_TYPE.TERMS_OF_SERVICE]}
          </TabsTrigger>
          <TabsTrigger value={DOCUMENT_TYPE.PRIVACY_POLICY}>
            {DOCUMENT_TYPE_LABELS[DOCUMENT_TYPE.PRIVACY_POLICY]}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={DOCUMENT_TYPE.TERMS_OF_SERVICE} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>이용약관 목록</CardTitle>
              <CardDescription>
                등록된 모든 이용약관 버전을 확인할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTermsTable()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value={DOCUMENT_TYPE.PRIVACY_POLICY} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>개인정보처리방침 목록</CardTitle>
              <CardDescription>
                등록된 모든 개인정보처리방침 버전을 확인할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTermsTable()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      <TermsCreateDialog
        documentType={activeTab}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={(created) => {
          setTerms((prev) => [created, ...prev])
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>약관 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 약관을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
