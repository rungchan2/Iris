'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Eye } from 'lucide-react'
import {
  useCouponTemplates,
  useCouponTemplate,
  useTemplateUsageStats,
  useCreateCouponTemplate,
  useUpdateCouponTemplate,
  useToggleTemplateStatus,
} from '@/lib/hooks/use-coupons'

type TemplateFormData = {
  codePrefix: string
  discountType: 'percentage' | 'fixed'
  discountValue: string
  validDays: string
  minPurchaseAmount: string
  maxDiscountAmount: string
  termsDescription: string
}

export default function CouponTemplateManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [includeInactive, setIncludeInactive] = useState(false)

  const { data: templates = [], isLoading } = useCouponTemplates(includeInactive)
  const createMutation = useCreateCouponTemplate()
  const updateMutation = useUpdateCouponTemplate()
  const toggleStatusMutation = useToggleTemplateStatus()

  const handleCreateTemplate = (data: TemplateFormData) => {
    createMutation.mutate(
      {
        codePrefix: data.codePrefix,
        discountType: data.discountType,
        discountValue: parseFloat(data.discountValue),
        validDays: parseInt(data.validDays),
        minPurchaseAmount: data.minPurchaseAmount ? parseFloat(data.minPurchaseAmount) : undefined,
        maxDiscountAmount: data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : undefined,
        termsDescription: data.termsDescription || undefined,
      },
      {
        onSuccess: () => {
          setShowCreateDialog(false)
        },
      }
    )
  }

  const handleUpdateTemplate = (data: TemplateFormData) => {
    if (!selectedTemplateId) return

    updateMutation.mutate(
      {
        id: selectedTemplateId,
        data: {
          codePrefix: data.codePrefix,
          discountType: data.discountType,
          discountValue: parseFloat(data.discountValue),
          validDays: parseInt(data.validDays),
          minPurchaseAmount: data.minPurchaseAmount ? parseFloat(data.minPurchaseAmount) : undefined,
          maxDiscountAmount: data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : undefined,
          termsDescription: data.termsDescription || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowEditDialog(false)
          setSelectedTemplateId(null)
        },
      }
    )
  }

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id)
  }

  const formatDiscountValue = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}%`
    }
    return `${value.toLocaleString()}원`
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Label htmlFor="include-inactive" className="flex items-center gap-2 cursor-pointer">
            <Switch
              id="include-inactive"
              checked={includeInactive}
              onCheckedChange={setIncludeInactive}
            />
            <span>비활성 템플릿 포함</span>
          </Label>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          새 템플릿 생성
        </Button>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>쿠폰 템플릿 목록</CardTitle>
          <CardDescription>쿠폰 템플릿을 관리하고 발급에 사용할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              생성된 템플릿이 없습니다
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>코드 접두사</TableHead>
                  <TableHead>할인 유형</TableHead>
                  <TableHead>할인 금액</TableHead>
                  <TableHead>유효 기간</TableHead>
                  <TableHead>최소 구매 금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-mono font-semibold">
                      {template.code_prefix}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {template.discount_type === 'percentage' ? '비율 할인' : '금액 할인'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDiscountValue(template.discount_type, template.discount_value)}
                    </TableCell>
                    <TableCell>{template.valid_days}일</TableCell>
                    <TableCell>
                      {template.min_purchase_amount
                        ? `${template.min_purchase_amount.toLocaleString()}원`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplateId(template.id)
                          setShowDetailDialog(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplateId(template.id)
                          setShowEditDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={template.is_active ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleToggleStatus(template.id)}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {template.is_active ? '비활성화' : '활성화'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>새 쿠폰 템플릿 생성</DialogTitle>
            <DialogDescription>
              새로운 쿠폰 템플릿을 생성합니다. 템플릿을 기반으로 쿠폰을 발급할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            onSubmit={handleCreateTemplate}
            isLoading={createMutation.isPending}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      {selectedTemplateId && (
        <Dialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open)
            if (!open) setSelectedTemplateId(null)
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>쿠폰 템플릿 수정</DialogTitle>
              <DialogDescription>템플릿 정보를 수정합니다</DialogDescription>
            </DialogHeader>
            <EditTemplateForm
              templateId={selectedTemplateId}
              onSubmit={handleUpdateTemplate}
              isLoading={updateMutation.isPending}
              onCancel={() => {
                setShowEditDialog(false)
                setSelectedTemplateId(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Detail Dialog */}
      {selectedTemplateId && (
        <Dialog
          open={showDetailDialog}
          onOpenChange={(open) => {
            setShowDetailDialog(open)
            if (!open) setSelectedTemplateId(null)
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>쿠폰 템플릿 상세</DialogTitle>
            </DialogHeader>
            <TemplateDetail templateId={selectedTemplateId} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function TemplateForm({
  onSubmit,
  isLoading,
  onCancel,
  initialData,
  submitLabel = '생성',
}: {
  onSubmit: (data: TemplateFormData) => void
  isLoading: boolean
  onCancel: () => void
  initialData?: Partial<TemplateFormData>
  submitLabel?: string
}) {
  const [formData, setFormData] = useState<TemplateFormData>({
    codePrefix: initialData?.codePrefix || '',
    discountType: initialData?.discountType || 'percentage',
    discountValue: initialData?.discountValue || '',
    validDays: initialData?.validDays || '30',
    minPurchaseAmount: initialData?.minPurchaseAmount || '',
    maxDiscountAmount: initialData?.maxDiscountAmount || '',
    termsDescription: initialData?.termsDescription || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="codePrefix">코드 접두사 *</Label>
          <Input
            id="codePrefix"
            value={formData.codePrefix}
            onChange={(e) =>
              setFormData({ ...formData, codePrefix: e.target.value.toUpperCase() })
            }
            placeholder="WELCOME"
            required
            maxLength={10}
          />
          <p className="text-xs text-muted-foreground">
            쿠폰 코드의 앞부분 (예: WELCOME2024XXXXX)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountType">할인 유형 *</Label>
          <Select
            value={formData.discountType}
            onValueChange={(value: 'percentage' | 'fixed') =>
              setFormData({ ...formData, discountType: value })
            }
          >
            <SelectTrigger id="discountType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">비율 할인 (%)</SelectItem>
              <SelectItem value="fixed">금액 할인 (원)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountValue">
            할인 값 * {formData.discountType === 'percentage' ? '(%)' : '(원)'}
          </Label>
          <Input
            id="discountValue"
            type="number"
            value={formData.discountValue}
            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
            placeholder={formData.discountType === 'percentage' ? '10' : '5000'}
            required
            min="0"
            max={formData.discountType === 'percentage' ? '100' : undefined}
            step={formData.discountType === 'percentage' ? '1' : '100'}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="validDays">유효 기간 (일) *</Label>
          <Input
            id="validDays"
            type="number"
            value={formData.validDays}
            onChange={(e) => setFormData({ ...formData, validDays: e.target.value })}
            placeholder="30"
            required
            min="1"
          />
          <p className="text-xs text-muted-foreground">발급일로부터 유효 일수</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minPurchaseAmount">최소 구매 금액 (원)</Label>
          <Input
            id="minPurchaseAmount"
            type="number"
            value={formData.minPurchaseAmount}
            onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
            placeholder="0"
            min="0"
            step="1000"
          />
          <p className="text-xs text-muted-foreground">비워두면 제한 없음</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxDiscountAmount">최대 할인 금액 (원)</Label>
          <Input
            id="maxDiscountAmount"
            type="number"
            value={formData.maxDiscountAmount}
            onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
            placeholder="0"
            min="0"
            step="1000"
          />
          <p className="text-xs text-muted-foreground">
            비율 할인 시 최대 할인액 제한 (비워두면 제한 없음)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="termsDescription">사용 조건 설명</Label>
        <Textarea
          id="termsDescription"
          value={formData.termsDescription}
          onChange={(e) => setFormData({ ...formData, termsDescription: e.target.value })}
          placeholder="예: 특정 상품에만 사용 가능, 다른 할인과 중복 불가 등"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '처리 중...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

function EditTemplateForm({
  templateId,
  onSubmit,
  isLoading,
  onCancel,
}: {
  templateId: string
  onSubmit: (data: TemplateFormData) => void
  isLoading: boolean
  onCancel: () => void
}) {
  const { data: template } = useCouponTemplate(templateId)

  if (!template) {
    return <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
  }

  return (
    <TemplateForm
      onSubmit={onSubmit}
      isLoading={isLoading}
      onCancel={onCancel}
      submitLabel="수정"
      initialData={{
        codePrefix: template.code_prefix,
        discountType: template.discount_type as 'percentage' | 'fixed',
        discountValue: template.discount_value.toString(),
        validDays: template.valid_days.toString(),
        minPurchaseAmount: template.min_purchase_amount?.toString() || '',
        maxDiscountAmount: template.max_discount_amount?.toString() || '',
        termsDescription: template.terms_description || '',
      }}
    />
  )
}

function TemplateDetail({ templateId }: { templateId: string }) {
  const { data: template } = useCouponTemplate(templateId)
  const { data: stats } = useTemplateUsageStats(templateId)

  if (!template) {
    return <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
  }

  const formatDiscountValue = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}%`
    }
    return `${value.toLocaleString()}원`
  }

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">코드 접두사</Label>
          <p className="font-mono font-semibold text-lg">{template.code_prefix}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">할인 유형</Label>
          <p className="font-semibold">
            {template.discount_type === 'percentage' ? '비율 할인' : '금액 할인'}
          </p>
        </div>
        <div>
          <Label className="text-muted-foreground">할인 금액</Label>
          <p className="font-semibold text-lg">
            {formatDiscountValue(template.discount_type, template.discount_value)}
          </p>
        </div>
        <div>
          <Label className="text-muted-foreground">유효 기간</Label>
          <p className="font-semibold">{template.valid_days}일</p>
        </div>
        <div>
          <Label className="text-muted-foreground">최소 구매 금액</Label>
          <p className="font-semibold">
            {template.min_purchase_amount
              ? `${template.min_purchase_amount.toLocaleString()}원`
              : '제한 없음'}
          </p>
        </div>
        <div>
          <Label className="text-muted-foreground">최대 할인 금액</Label>
          <p className="font-semibold">
            {template.max_discount_amount
              ? `${template.max_discount_amount.toLocaleString()}원`
              : '제한 없음'}
          </p>
        </div>
        <div>
          <Label className="text-muted-foreground">상태</Label>
          <p>
            <Badge variant={template.is_active ? 'default' : 'secondary'}>
              {template.is_active ? '활성' : '비활성'}
            </Badge>
          </p>
        </div>
        <div>
          <Label className="text-muted-foreground">생성일</Label>
          <p className="text-sm">
            {template.created_at
              ? new Date(template.created_at).toLocaleString('ko-KR')
              : '-'}
          </p>
        </div>
      </div>

      {template.terms_description && (
        <div>
          <Label className="text-muted-foreground">사용 조건</Label>
          <p className="mt-2 text-sm whitespace-pre-wrap">{template.terms_description}</p>
        </div>
      )}

      {/* Usage Statistics */}
      {stats && (
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">발급 통계</h3>
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>총 발급</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalIssued}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>미사용</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{stats.unusedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>사용됨</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{stats.usedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>만료됨</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-600">{stats.expiredCount}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
