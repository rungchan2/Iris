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
import { toast } from 'sonner'
import { useProducts } from '@/lib/hooks/use-products'
import type { Database } from '@/types/database.types'

interface Photographer {
  id: string
  name: string | null
  email: string | null
  approval_status: string | null
}

interface ProductCreateDialogProps {
  open: boolean
  onClose: () => void
  photographers: Photographer[]
}

type ProductInsert = Database['public']['Tables']['products']['Insert']

export function ProductCreateDialog({ open, onClose, photographers }: ProductCreateDialogProps) {
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

  const { create, isCreating } = useProducts()

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
        product_code: '',
        price: 0,
        weekend_surcharge: 0,
        holiday_surcharge: 0,
        shooting_duration: 60,
        photo_count_min: 10,
        photo_count_max: null,
        retouched_count: 0,
        max_participants: 1,
        includes_makeup: false,
        includes_styling: false,
        includes_props: false,
        location_type: 'studio',
        category: '',
        photographer_id: ''
      })
    }
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isCreating) {
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.photographer_id) {
      toast.error('작가를 선택해주세요')
      return
    }

    const productData: ProductInsert = {
      ...formData,
      created_by: formData.photographer_id,
      status: 'pending',
      is_featured: false,
      display_order: 0
    }

    create(productData, {
      onSuccess: () => {
        onClose()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
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
            <Button type="submit" disabled={isCreating}>
              {isCreating ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
