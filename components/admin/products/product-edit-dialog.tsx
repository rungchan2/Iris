'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useProducts } from '@/lib/hooks/use-products'
import type { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['products']['Row'] & {
  photographer?: {
    name: string
    email: string
  }
}

interface Photographer {
  id: string
  name: string | null
  email: string | null
  approval_status: string | null
}

interface ProductEditDialogProps {
  open: boolean
  onClose: () => void
  product: Product
  photographers: Photographer[]
}

type ProductUpdate = Database['public']['Tables']['products']['Update']

export function ProductEditDialog({ open, onClose, product, photographers }: ProductEditDialogProps) {
  const [formData, setFormData] = useState({
    name: product.name ?? '',
    description: product.description ?? '',
    price: product.price ?? 0,
    weekend_surcharge: product.weekend_surcharge ?? 0,
    holiday_surcharge: product.holiday_surcharge ?? 0,
    shooting_duration: product.shooting_duration ?? 60,
    photo_count_min: product.photo_count_min ?? 10,
    photo_count_max: product.photo_count_max ?? null,
    retouched_count: product.retouched_count ?? 0,
    max_participants: product.max_participants ?? 1,
    includes_makeup: product.includes_makeup ?? false,
    includes_styling: product.includes_styling ?? false,
    includes_props: product.includes_props ?? false,
    location_type: (product.location_type as 'studio' | 'outdoor' | 'both') ?? 'studio',
    category: product.category ?? '',
    photographer_id: product.photographer_id ?? '',
    is_featured: product.is_featured ?? false
  })

  const { update, isUpdating } = useProducts()

  // Reset form when product changes or dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: product.name ?? '',
        description: product.description ?? '',
        price: product.price ?? 0,
        weekend_surcharge: product.weekend_surcharge ?? 0,
        holiday_surcharge: product.holiday_surcharge ?? 0,
        shooting_duration: product.shooting_duration ?? 60,
        photo_count_min: product.photo_count_min ?? 10,
        photo_count_max: product.photo_count_max ?? null,
        retouched_count: product.retouched_count ?? 0,
        max_participants: product.max_participants ?? 1,
        includes_makeup: product.includes_makeup ?? false,
        includes_styling: product.includes_styling ?? false,
        includes_props: product.includes_props ?? false,
        location_type: (product.location_type as 'studio' | 'outdoor' | 'both') ?? 'studio',
        category: product.category ?? '',
        photographer_id: product.photographer_id ?? '',
        is_featured: product.is_featured ?? false
      })
    }
  }, [open, product])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isUpdating) {
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const updateData: ProductUpdate = formData

    update(
      { id: product.id, data: updateData },
      {
        onSuccess: () => {
          onClose()
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
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
                value={product.product_code ?? ''}
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
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
