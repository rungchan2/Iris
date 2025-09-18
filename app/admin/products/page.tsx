'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import { 
  Package, Search, Filter, Plus, Edit, Trash2, 
  CheckCircle, XCircle, Clock, Eye, Star,
  Users, Camera, MapPin, Calendar, DollarSign,
  Check, X, MoreVertical
} from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  description: string | null
  product_code: string
  price: number
  weekend_surcharge: number
  holiday_surcharge: number
  shooting_duration: number
  photo_count_min: number
  photo_count_max: number | null
  retouched_count: number
  max_participants: number
  includes_makeup: boolean
  includes_styling: boolean
  includes_props: boolean
  location_type: 'studio' | 'outdoor' | 'both'
  category: string | null
  tags: string[] | null
  photographer_id: string
  created_by: string
  approved_by: string | null
  status: 'pending' | 'approved' | 'rejected' | 'inactive'
  approval_notes: string | null
  is_featured: boolean
  display_order: number
  created_at: string
  updated_at: string
  approved_at: string | null
  photographer?: {
    name: string
    email: string
  }
}

interface Photographer {
  id: string
  name: string
  email: string
  approval_status: string
}

interface ProductStats {
  totalProducts: number
  pendingProducts: number
  approvedProducts: number
  rejectedProducts: number
}

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    rejectedProducts: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPhotographer, setFilterPhotographer] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadProducts(),
        loadPhotographers()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          photographer:photographers(name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const productList = data || []
      setProducts(productList as any)
      calculateStats(productList as any)
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('상품 목록을 불러오는 중 오류가 발생했습니다')
    }
  }

  const loadPhotographers = async () => {
    try {
      const { data, error } = await supabase
        .from('photographers')
        .select('id, name, email, approval_status')
        .eq('approval_status', 'approved')
        .order('name')

      if (error) throw error
      setPhotographers(data as any || [])
    } catch (error) {
      console.error('Error loading photographers:', error)
    }
  }

  const calculateStats = (productList: Product[]) => {
    const total = productList.length
    const pending = productList.filter(p => p.status === 'pending').length
    const approved = productList.filter(p => p.status === 'approved').length
    const rejected = productList.filter(p => p.status === 'rejected').length

    setStats({
      totalProducts: total,
      pendingProducts: pending,
      approvedProducts: approved,
      rejectedProducts: rejected
    })
  }

  const getStatusBadge = (status: string) => {
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

  const getLocationTypeLabel = (type: string) => {
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

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowEditDialog(true)
  }

  const handleApproveProduct = async (productId: string) => {
    try {
      // Get current admin user session
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('로그인이 필요합니다')
        return
      }

      const { error } = await supabase
        .from('products')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id // Use current admin's UUID
        })
        .eq('id', productId)

      if (error) throw error
      
      toast.success('상품이 승인되었습니다')
      loadProducts()
    } catch (error) {
      console.error('Error approving product:', error)
      toast.error('승인 중 오류가 발생했습니다')
    }
  }

  const handleRejectProduct = async (productId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          status: 'rejected',
          approval_notes: notes || '승인 거부됨'
        })
        .eq('id', productId)

      if (error) throw error
      
      toast.success('상품이 거부되었습니다')
      loadProducts()
    } catch (error) {
      console.error('Error rejecting product:', error)
      toast.error('거부 중 오류가 발생했습니다')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      
      toast.success('상품이 삭제되었습니다')
      loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('삭제 중 오류가 발생했습니다')
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.photographer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus
    const matchesPhotographer = filterPhotographer === 'all' || product.photographer_id === filterPhotographer

    return matchesSearch && matchesStatus && matchesPhotographer
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminBreadcrumb />
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2">
            <Clock className="h-5 w-5 animate-spin" />
            상품 목록을 불러오는 중...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb />
      
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
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingProducts}</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.approvedProducts}</p>
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
                <p className="text-2xl font-bold text-red-600">{stats.rejectedProducts}</p>
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
                          {formatPrice(product.price)}
                        </p>
                        {(product.weekend_surcharge > 0 || product.holiday_surcharge > 0) && (
                          <p className="text-xs text-muted-foreground">
                            {product.weekend_surcharge > 0 && `주말 +${formatPrice(product.weekend_surcharge)}`}
                            {product.weekend_surcharge > 0 && product.holiday_surcharge > 0 && ' | '}
                            {product.holiday_surcharge > 0 && `공휴일 +${formatPrice(product.holiday_surcharge)}`}
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
                      {product.retouched_count > 0 && (
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
                          onClick={() => handleApproveProduct(product.id)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
                          승인
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectProduct(product.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                          거부
                        </Button>
                      </>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditProduct(product)}>
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
                                onClick={() => handleDeleteProduct(product.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                삭제
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

      {/* Create Product Dialog */}
      <ProductCreateDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        photographers={photographers}
        onSuccess={() => {
          setShowCreateDialog(false)
          loadProducts()
        }}
      />

      {/* Edit Product Dialog */}
      {selectedProduct && (
        <ProductEditDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false)
            setSelectedProduct(null)
          }}
          product={selectedProduct}
          photographers={photographers}
          onSuccess={() => {
            setShowEditDialog(false)
            setSelectedProduct(null)
            loadProducts()
          }}
        />
      )}
    </div>
  )
}

// Product Create Dialog Component
interface ProductCreateDialogProps {
  open: boolean
  onClose: () => void
  photographers: Photographer[]
  onSuccess: () => void
}

function ProductCreateDialog({ open, onClose, photographers, onSuccess }: ProductCreateDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    product_code: '',
    price: 0,
    weekend_surcharge: 0,
    holiday_surcharge: 0,
    shooting_duration: 60,
    photo_count_min: 10,
    photo_count_max: null as number | null,
    retouched_count: 0,
    max_participants: 1,
    includes_makeup: false,
    includes_styling: false,
    includes_props: false,
    location_type: 'studio' as 'studio' | 'outdoor' | 'both',
    category: '',
    photographer_id: ''
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.photographer_id) {
      toast.error('작가를 선택해주세요')
      return
    }
    
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('products')
        .insert({
          ...formData,
          created_by: formData.photographer_id, // Product created by the selected photographer
          status: 'pending',
          is_featured: false,
          display_order: 0
        })

      if (error) throw error
      
      toast.success('상품이 생성되었습니다')
      onSuccess()
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('생성 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent maxWidth="2xl">
        <DialogHeader>
          <DialogTitle>새 상품 추가</DialogTitle>
          <DialogDescription>
            새로운 촬영 상품을 추가합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">상품명</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="상품명을 입력하세요"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">상품코드</label>
              <Input
                value={formData.product_code}
                onChange={(e) => setFormData(prev => ({ ...prev, product_code: e.target.value }))}
                placeholder="상품코드를 입력하세요"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">설명</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="상품 설명을 입력하세요"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">기본 가격</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="0"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">주말 할증</label>
              <Input
                type="number"
                value={formData.weekend_surcharge}
                onChange={(e) => setFormData(prev => ({ ...prev, weekend_surcharge: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">공휴일 할증</label>
              <Input
                type="number"
                value={formData.holiday_surcharge}
                onChange={(e) => setFormData(prev => ({ ...prev, holiday_surcharge: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">작가 *</label>
              <Select
                value={formData.photographer_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, photographer_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="작가를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {photographers.map((photographer) => (
                    <SelectItem key={photographer.id} value={photographer.id}>
                      {photographer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">위치 타입</label>
              <Select
                value={formData.location_type}
                onValueChange={(value: 'studio' | 'outdoor' | 'both') => 
                  setFormData(prev => ({ ...prev, location_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">스튜디오</SelectItem>
                  <SelectItem value="outdoor">야외</SelectItem>
                  <SelectItem value="both">스튜디오/야외</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Product Edit Dialog Component
interface ProductEditDialogProps {
  open: boolean
  onClose: () => void
  product: Product
  photographers: Photographer[]
  onSuccess: () => void
}

function ProductEditDialog({ open, onClose, product, photographers, onSuccess }: ProductEditDialogProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    price: product.price,
    weekend_surcharge: product.weekend_surcharge,
    holiday_surcharge: product.holiday_surcharge,
    shooting_duration: product.shooting_duration,
    photo_count_min: product.photo_count_min,
    photo_count_max: product.photo_count_max,
    retouched_count: product.retouched_count,
    max_participants: product.max_participants,
    includes_makeup: product.includes_makeup,
    includes_styling: product.includes_styling,
    includes_props: product.includes_props,
    location_type: product.location_type,
    category: product.category || '',
    photographer_id: product.photographer_id,
    is_featured: product.is_featured
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('products')
        .update(formData)
        .eq('id', product.id)

      if (error) throw error
      
      toast.success('상품이 수정되었습니다')
      onSuccess()
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('수정 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent maxWidth="2xl">
        <DialogHeader>
          <DialogTitle>상품 편집</DialogTitle>
          <DialogDescription>
            상품 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">상품명</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="상품명을 입력하세요"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">상품코드</label>
              <Input
                value={product.product_code}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">설명</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="상품 설명을 입력하세요"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">기본 가격</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">주말 할증</label>
              <Input
                type="number"
                value={formData.weekend_surcharge}
                onChange={(e) => setFormData(prev => ({ ...prev, weekend_surcharge: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">공휴일 할증</label>
              <Input
                type="number"
                value={formData.holiday_surcharge}
                onChange={(e) => setFormData(prev => ({ ...prev, holiday_surcharge: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}