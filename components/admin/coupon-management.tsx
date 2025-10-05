'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Ticket,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Eye,
  AlertCircle,
  Sparkles,
  DollarSign
} from 'lucide-react'
import { useCoupons, useCouponStats, useCouponTemplates, useIssueCoupon, useBulkIssueCoupons, useRevokeCoupon } from '@/lib/hooks/use-coupons'
import { toast } from 'sonner'
import type { CouponFilters } from '@/lib/actions/coupons'

const statusConfig = {
  unused: {
    label: '미사용',
    color: 'bg-green-100 text-green-800',
    icon: Clock
  },
  used: {
    label: '사용완료',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle
  },
  expired: {
    label: '만료됨',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle
  },
} as const

export default function CouponManagement() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<CouponFilters>({})
  const [searchTerm, setSearchTerm] = useState('')

  // Modals
  const [issueSingleOpen, setIssueSingleOpen] = useState(false)
  const [issueBulkOpen, setIssueBulkOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null)

  // Fetch data
  const { data: couponsData, isLoading } = useCoupons(currentPage, 20, filters)
  const { data: stats } = useCouponStats(filters.templateId)
  const { data: templates } = useCouponTemplates()

  // Mutations
  const issueCouponMutation = useIssueCoupon()
  const bulkIssueMutation = useBulkIssueCoupons()
  const revokeMutation = useRevokeCoupon()

  const coupons = couponsData?.data || []
  const pagination = couponsData?.pagination

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm })
    setCurrentPage(1)
  }

  const handleStatusFilter = (status: string) => {
    setFilters({
      ...filters,
      status: status === 'all' ? undefined : status as 'unused' | 'used' | 'expired'
    })
    setCurrentPage(1)
  }

  const handleTemplateFilter = (templateId: string) => {
    setFilters({
      ...filters,
      templateId: templateId === 'all' ? undefined : templateId
    })
    setCurrentPage(1)
  }

  const handleIssueSingle = async (data: {
    templateId: string
    issuedReason: string
    validDays?: number
  }) => {
    await issueCouponMutation.mutateAsync(data)
    setIssueSingleOpen(false)
  }

  const handleIssueBulk = async (data: {
    templateId: string
    count: number
    issuedReason: string
    validDays?: number
  }) => {
    await bulkIssueMutation.mutateAsync(data)
    setIssueBulkOpen(false)
  }

  const handleRevoke = async (id: string) => {
    if (confirm('정말로 이 쿠폰을 취소하시겠습니까?')) {
      await revokeMutation.mutateAsync({
        id,
        reason: '관리자에 의해 취소됨'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">쿠폰 내역을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 발급 쿠폰</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalIssued || 0}</div>
            <p className="text-xs text-muted-foreground">
              전체 발급된 쿠폰 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">미사용 쿠폰</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unusedCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              사용 가능한 쿠폰
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">사용완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.usedCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              사용된 쿠폰
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">만료됨</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expiredCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              만료된 쿠폰
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>쿠폰 목록</CardTitle>
            <div className="flex gap-2">
              <Dialog open={issueSingleOpen} onOpenChange={setIssueSingleOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    단일 발급
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>쿠폰 단일 발급</DialogTitle>
                    <DialogDescription>
                      쿠폰을 1개 발급합니다
                    </DialogDescription>
                  </DialogHeader>
                  <IssueSingleCouponForm
                    templates={templates || []}
                    onSubmit={handleIssueSingle}
                    isLoading={issueCouponMutation.isPending}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={issueBulkOpen} onOpenChange={setIssueBulkOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Sparkles className="w-4 h-4 mr-2" />
                    대량 발급
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>쿠폰 대량 발급</DialogTitle>
                    <DialogDescription>
                      동일한 쿠폰을 여러 개 발급합니다
                    </DialogDescription>
                  </DialogHeader>
                  <IssueBulkCouponsForm
                    templates={templates || []}
                    onSubmit={handleIssueBulk}
                    isLoading={bulkIssueMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="쿠폰 코드로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.status || 'all'}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="unused">미사용</SelectItem>
                <SelectItem value="used">사용완료</SelectItem>
                <SelectItem value="expired">만료됨</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.templateId || 'all'}
              onValueChange={handleTemplateFilter}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="템플릿" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 템플릿</SelectItem>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.code_prefix}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>조회</Button>
          </div>

          {/* Coupon Table */}
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">쿠폰 내역이 없습니다</h3>
              <p className="text-gray-600">
                조건에 맞는 쿠폰이 없습니다
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>쿠폰 코드</TableHead>
                      <TableHead>템플릿</TableHead>
                      <TableHead>할인 정보</TableHead>
                      <TableHead>발급 사유</TableHead>
                      <TableHead>유효기간</TableHead>
                      <TableHead className="text-center">상태</TableHead>
                      <TableHead className="text-center">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => {
                      const StatusIcon = statusConfig[coupon.status as keyof typeof statusConfig]?.icon || Clock
                      const statusColor = statusConfig[coupon.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'
                      const statusLabel = statusConfig[coupon.status as keyof typeof statusConfig]?.label || coupon.status

                      return (
                        <TableRow key={coupon.id}>
                          <TableCell className="font-medium font-mono">
                            {coupon.code}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {coupon.template?.code_prefix || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {coupon.template && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="font-medium">
                                  {coupon.template.discount_type === 'percentage'
                                    ? `${coupon.template.discount_value}%`
                                    : `₩${coupon.template.discount_value.toLocaleString()}`}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {coupon.issued_reason}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="text-gray-900">
                                {new Date(coupon.valid_until).toLocaleDateString('ko-KR')}
                              </div>
                              {coupon.valid_from && (
                                <div className="text-xs text-gray-500">
                                  {new Date(coupon.valid_from).toLocaleDateString('ko-KR')} ~
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={statusColor}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedCoupon(coupon)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>쿠폰 상세 정보</DialogTitle>
                                  </DialogHeader>
                                  {selectedCoupon && (
                                    <CouponDetails coupon={selectedCoupon} />
                                  )}
                                </DialogContent>
                              </Dialog>
                              {coupon.status === 'unused' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevoke(coupon.id)}
                                  disabled={revokeMutation.isPending}
                                >
                                  <XCircle className="w-4 h-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    총 {pagination.total}개 중 {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, pagination.total)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      이전
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-2">쿠폰 발급 안내</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 발급된 쿠폰은 할인율 변경이 불가능합니다</li>
                <li>• 미사용 쿠폰만 취소할 수 있습니다</li>
                <li>• 대량 발급 시 동일한 템플릿으로 여러 개의 고유한 쿠폰이 생성됩니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Issue Single Coupon Form Component
function IssueSingleCouponForm({
  templates,
  onSubmit,
  isLoading
}: {
  templates: any[]
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    templateId: '',
    issuedReason: '',
    validDays: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      validDays: formData.validDays ? parseInt(formData.validDays) : undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="templateId">쿠폰 템플릿 *</Label>
        <Select
          value={formData.templateId}
          onValueChange={(value) => setFormData({ ...formData, templateId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="템플릿 선택" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.code_prefix} - {template.discount_type === 'percentage' ? `${template.discount_value}%` : `₩${template.discount_value.toLocaleString()}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="issuedReason">발급 사유 *</Label>
        <Input
          id="issuedReason"
          value={formData.issuedReason}
          onChange={(e) => setFormData({ ...formData, issuedReason: e.target.value })}
          placeholder="예: 이벤트 당첨"
          required
        />
      </div>

      <div>
        <Label htmlFor="validDays">유효 기간 (일) (선택)</Label>
        <Input
          id="validDays"
          type="number"
          value={formData.validDays}
          onChange={(e) => setFormData({ ...formData, validDays: e.target.value })}
          placeholder="템플릿 기본값 사용"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading || !formData.templateId || !formData.issuedReason}>
          {isLoading ? '발급 중...' : '발급하기'}
        </Button>
      </div>
    </form>
  )
}

// Issue Bulk Coupons Form Component
function IssueBulkCouponsForm({
  templates,
  onSubmit,
  isLoading
}: {
  templates: any[]
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    templateId: '',
    count: '10',
    issuedReason: '',
    validDays: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      count: parseInt(formData.count),
      validDays: formData.validDays ? parseInt(formData.validDays) : undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="templateId">쿠폰 템플릿 *</Label>
        <Select
          value={formData.templateId}
          onValueChange={(value) => setFormData({ ...formData, templateId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="템플릿 선택" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.code_prefix} - {template.discount_type === 'percentage' ? `${template.discount_value}%` : `₩${template.discount_value.toLocaleString()}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="count">발급 개수 *</Label>
        <Input
          id="count"
          type="number"
          value={formData.count}
          onChange={(e) => setFormData({ ...formData, count: e.target.value })}
          min="1"
          max="1000"
          required
        />
        <p className="text-xs text-gray-500 mt-1">최대 1000개까지 발급 가능</p>
      </div>

      <div>
        <Label htmlFor="issuedReason">발급 사유 *</Label>
        <Input
          id="issuedReason"
          value={formData.issuedReason}
          onChange={(e) => setFormData({ ...formData, issuedReason: e.target.value })}
          placeholder="예: 대량 프로모션"
          required
        />
      </div>

      <div>
        <Label htmlFor="validDays">유효 기간 (일) (선택)</Label>
        <Input
          id="validDays"
          type="number"
          value={formData.validDays}
          onChange={(e) => setFormData({ ...formData, validDays: e.target.value })}
          placeholder="템플릿 기본값 사용"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading || !formData.templateId || !formData.count || !formData.issuedReason}>
          {isLoading ? '발급 중...' : `${formData.count}개 발급하기`}
        </Button>
      </div>
    </form>
  )
}

// Coupon Details Component
function CouponDetails({ coupon }: { coupon: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-600">쿠폰 코드</Label>
          <p className="font-medium font-mono">{coupon.code}</p>
        </div>
        <div>
          <Label className="text-gray-600">상태</Label>
          <p className="font-medium">{statusConfig[coupon.status as keyof typeof statusConfig]?.label || coupon.status}</p>
        </div>
        <div>
          <Label className="text-gray-600">할인 타입</Label>
          <p className="font-medium">
            {coupon.template?.discount_type === 'percentage' ? '비율 할인' : '금액 할인'}
          </p>
        </div>
        <div>
          <Label className="text-gray-600">할인 값</Label>
          <p className="font-medium">
            {coupon.template?.discount_type === 'percentage'
              ? `${coupon.template.discount_value}%`
              : `₩${coupon.template.discount_value.toLocaleString()}`}
          </p>
        </div>
        {coupon.template?.max_discount_amount && (
          <div>
            <Label className="text-gray-600">최대 할인 금액</Label>
            <p className="font-medium">₩{coupon.template.max_discount_amount.toLocaleString()}</p>
          </div>
        )}
        {coupon.template?.min_purchase_amount && (
          <div>
            <Label className="text-gray-600">최소 구매 금액</Label>
            <p className="font-medium">₩{coupon.template.min_purchase_amount.toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="space-y-2">
          <div>
            <Label className="text-gray-600">발급 사유</Label>
            <p className="text-sm">{coupon.issued_reason}</p>
          </div>
          <div>
            <Label className="text-gray-600">유효 기간</Label>
            <p className="text-sm">
              {coupon.valid_from && `${new Date(coupon.valid_from).toLocaleString('ko-KR')} ~ `}
              {new Date(coupon.valid_until).toLocaleString('ko-KR')}
            </p>
          </div>
          {coupon.used_at && (
            <div>
              <Label className="text-gray-600">사용 일시</Label>
              <p className="text-sm">{new Date(coupon.used_at).toLocaleString('ko-KR')}</p>
            </div>
          )}
        </div>
      </div>

      {coupon.template?.terms_description && (
        <div className="border-t pt-4">
          <Label className="text-gray-600">이용 약관</Label>
          <p className="text-sm mt-1 text-gray-700">{coupon.template.terms_description}</p>
        </div>
      )}
    </div>
  )
}
