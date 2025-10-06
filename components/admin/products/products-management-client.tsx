'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Package, Search, Plus, Edit, Trash2,
  CheckCircle, XCircle, Clock, Eye, Star,
  Users, Camera, MapPin, Calendar,
  Check, X, MoreVertical
} from 'lucide-react'
import { useProducts } from '@/lib/hooks/use-products'
import { ProductCreateDialog } from './product-create-dialog'
import { ProductEditDialog } from './product-edit-dialog'
import type { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['products']['Row'] & {
  photographer?: {
    name: string
    email: string
  }
}

interface ProductsManagementClientProps {
  initialProducts: Product[]
  initialPhotographers: Array<{
    id: string
    name: string | null
    email: string | null
    approval_status: string | null
  }>
}

export default function ProductsManagementClient({
  initialProducts,
  initialPhotographers,
}: ProductsManagementClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPhotographer, setFilterPhotographer] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  // 🎯 단일 훅으로 모든 기능 사용
  const { 
    products, 
    photographers, 
    stats, 
    isLoading,
    approve, 
    reject, 
    delete: deleteProduct,
    isApproving,
    isRejecting,
    isDeleting,
  } = useProducts()

  // Helper functions
  const getStatusBadge = (status: string | null) => {
    if (!status) return null
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">
          <Clock className="h-3 w-3 mr-1" />
          승인 대기
        </Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          승인됨
        </Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600">
          <XCircle className="h-3 w-3 mr-1" />
          거부됨
        </Badge>
      case 'inactive':
        return <Badge variant="outline" className="text-gray-600">
          <Eye className="h-3 w-3 mr-1" />
          비활성
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLocationTypeLabel = (type: string | null) => {
    if (!type) return '-'
    switch (type) {
      case 'studio': return '스튜디오'
      case 'outdoor': return '야외'
      case 'both': return '스튜디오/야외'
      default: return type
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원'
  }

  // Portal animation timing constants
  const PORTAL_ANIMATION_DURATION = 200 // Radix UI default animation duration
  const PORTAL_SAFETY_MARGIN = 100 // Extra time for Portal cleanup
  const PORTAL_TRANSITION_DELAY = PORTAL_ANIMATION_DURATION + PORTAL_SAFETY_MARGIN

  // Async state management refs
  const timeoutsRef = useRef<{
    editDialog: NodeJS.Timeout | null
    closeDialog: NodeJS.Timeout | null
  }>({ editDialog: null, closeDialog: null })

  // Cleanup all pending timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout)
      })
    }
  }, [])

  // Event handlers
  const handleEditProduct = (product: Product) => {
    // Clear pending edit timeout
    if (timeoutsRef.current.editDialog) {
      clearTimeout(timeoutsRef.current.editDialog)
    }

    // Close DropdownMenu and set selected product
    setOpenDropdownId(null)
    setSelectedProduct(product)

    // Wait for DropdownMenu Portal to fully unmount before opening Dialog
    timeoutsRef.current.editDialog = setTimeout(() => {
      setShowEditDialog(true)
      timeoutsRef.current.editDialog = null
    }, PORTAL_TRANSITION_DELAY)
  }

  const handleCloseEditDialog = () => {
    // Clear pending close timeout
    if (timeoutsRef.current.closeDialog) {
      clearTimeout(timeoutsRef.current.closeDialog)
    }

    setShowEditDialog(false)

    // Wait for Dialog Portal to fully unmount before resetting state
    timeoutsRef.current.closeDialog = setTimeout(() => {
      setSelectedProduct(null)
      timeoutsRef.current.closeDialog = null
    }, PORTAL_TRANSITION_DELAY)
  }

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.photographer?.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === 'all' || product.status === filterStatus
      const matchesPhotographer = filterPhotographer === 'all' || product.photographer_id === filterPhotographer

      return matchesSearch && matchesStatus && matchesPhotographer
    })
  }, [products, searchTerm, filterStatus, filterPhotographer])

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2">
          <Clock className="h-5 w-5 animate-spin" />
          상품 목록을 불러오는 중...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">상품 관리</h1>
          <p className="text-muted-foreground mt-2">
            작가들의 촬영 상품을 관리하고 승인 여부를 결정합니다.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          상품 추가
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">전체 상품</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">승인 대기</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">승인됨</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">거부됨</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="상품명, 상품코드, 작가명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="pending">승인 대기</SelectItem>
                <SelectItem value="approved">승인됨</SelectItem>
                <SelectItem value="rejected">거부됨</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPhotographer} onValueChange={setFilterPhotographer}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="작가 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 작가</SelectItem>
                {photographers.map((photographer) => (
                  <SelectItem key={photographer.id} value={photographer.id}>
                    {photographer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">상품이 없습니다</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterStatus !== 'all' || filterPhotographer !== 'all'
                    ? '검색 조건에 맞는 상품이 없습니다.'
                    : '아직 등록된 상품이 없습니다.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{product.name}</h3>
                          {product.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                          {getStatusBadge(product.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          상품코드: {product.product_code} | 작가: {product.photographer?.name}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(product.price || 0)}
                        </p>
                        {((product.weekend_surcharge ?? 0) > 0 || (product.holiday_surcharge ?? 0) > 0) && (
                          <p className="text-xs text-muted-foreground">
                            {(product.weekend_surcharge ?? 0) > 0 && `주말 +${formatPrice(product.weekend_surcharge ?? 0)}`}
                            {(product.weekend_surcharge ?? 0) > 0 && (product.holiday_surcharge ?? 0) > 0 && ' | '}
                            {(product.holiday_surcharge ?? 0) > 0 && `공휴일 +${formatPrice(product.holiday_surcharge ?? 0)}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{product.shooting_duration}분</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {product.photo_count_min}
                          {product.photo_count_max && product.photo_count_max !== product.photo_count_min
                            ? `-${product.photo_count_max}`
                            : ''
                          }장
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>최대 {product.max_participants}명</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{getLocationTypeLabel(product.location_type)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {product.includes_makeup && (
                        <Badge variant="secondary">메이크업 포함</Badge>
                      )}
                      {product.includes_styling && (
                        <Badge variant="secondary">스타일링 포함</Badge>
                      )}
                      {product.includes_props && (
                        <Badge variant="secondary">소품 포함</Badge>
                      )}
                      {(product.retouched_count ?? 0) > 0 && (
                        <Badge variant="secondary">보정 {product.retouched_count}장</Badge>
                      )}
                      {product.category && (
                        <Badge variant="outline">{product.category}</Badge>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {product.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => approve(product.id)}
                          disabled={isApproving}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
                          {isApproving ? '처리 중...' : '승인'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reject({ productId: product.id })}
                          disabled={isRejecting}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                          {isRejecting ? '처리 중...' : '거부'}
                        </Button>
                      </>
                    )}

                    <DropdownMenu
                      open={openDropdownId === product.id}
                      onOpenChange={(open) => setOpenDropdownId(open ? product.id : null)}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            handleEditProduct(product)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          편집
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>상품 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProduct(product.id)}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isDeleting ? '삭제 중...' : '삭제'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      <ProductCreateDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        photographers={photographers}
      />

      {selectedProduct && (
        <ProductEditDialog
          open={showEditDialog}
          onClose={handleCloseEditDialog}
          product={selectedProduct}
          photographers={photographers}
        />
      )}
    </div>
  )
}