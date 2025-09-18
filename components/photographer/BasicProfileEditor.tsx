'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Save, MapPin, DollarSign, Users } from 'lucide-react'
import { toast } from 'sonner'

interface BasicProfileEditorProps {
  photographer: any
  profile: any
  onUpdate: (profile: any) => void
}

const REGIONS = [
  '서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종',
  '전북', '전남', '광주', '경북', '경남', '대구', '울산', '부산', '제주'
]

const COMPANION_TYPES = [
  { value: 'solo', label: '개인' },
  { value: 'couple', label: '커플' },
  { value: 'family', label: '가족' },
  { value: 'friends', label: '친구들' },
  { value: 'group', label: '단체' },
  { value: 'business', label: '비즈니스' },
  { value: 'pet', label: '반려동물' }
]

export default function BasicProfileEditor({
  photographer,
  profile,
  onUpdate
}: BasicProfileEditorProps) {
  const [formData, setFormData] = useState({
    bio: photographer?.bio || '',
    service_regions: profile?.service_regions || [],
    price_min: profile?.price_min || 100000,
    price_max: profile?.price_max || 500000,
    companion_types: profile?.companion_types || []
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleRegionToggle = (region: string) => {
    setFormData(prev => ({
      ...prev,
      service_regions: prev.service_regions.includes(region)
        ? prev.service_regions.filter((r: string) => r !== region)
        : [...prev.service_regions, region]
    }))
  }

  const handleCompanionToggle = (companionType: string) => {
    setFormData(prev => ({
      ...prev,
      companion_types: prev.companion_types.includes(companionType)
        ? prev.companion_types.filter((c: string) => c !== companionType)
        : [...prev.companion_types, companionType]
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Update photographer bio
      if (formData.bio !== photographer?.bio) {
        const { error: bioError } = await supabase
          .from('photographers')
          .update({ bio: formData.bio })
          .eq('id', photographer.id)

        if (bioError) throw bioError
      }

      // Update profile
      const { data: updatedProfile, error: profileError } = await supabase
        .from('photographer_profiles')
        .update({
          service_regions: formData.service_regions,
          price_min: formData.price_min,
          price_max: formData.price_max,
          companion_types: formData.companion_types
        })
        .eq('photographer_id', photographer.id)
        .select()
        .single()

      if (profileError) throw profileError

      onUpdate(updatedProfile)
      toast.success('기본 정보가 저장되었습니다')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('저장 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Bio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            자기소개
          </CardTitle>
          <CardDescription>
            고객들에게 보여질 간단한 자기소개를 작성해주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">소개글</Label>
            <Textarea
              id="bio"
              placeholder="안녕하세요! 저는 [촬영 스타일]을 전문으로 하는 사진작가입니다..."
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="min-h-[120px]"
              maxLength={500}
            />
            <div className="text-sm text-gray-500 text-right">
              {formData.bio.length}/500
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Regions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            서비스 지역
          </CardTitle>
          <CardDescription>
            촬영 가능한 지역을 선택해주세요 (복수 선택 가능)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {REGIONS.map(region => (
              <div
                key={region}
                className={`
                  cursor-pointer rounded-lg border-2 p-3 text-center transition-all
                  ${formData.service_regions.includes(region)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => handleRegionToggle(region)}
              >
                <span className="font-medium">{region}</span>
              </div>
            ))}
          </div>
          
          {formData.service_regions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">선택된 지역:</p>
              <div className="flex flex-wrap gap-2">
                {formData.service_regions.map((region: string) => (
                  <Badge key={region} variant="default">
                    {region}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            촬영 가격
          </CardTitle>
          <CardDescription>
            촬영 서비스의 최소/최대 가격을 설정해주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price-min">최소 가격</Label>
              <div className="relative">
                <Input
                  id="price-min"
                  type="number"
                  value={formData.price_min}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price_min: Number(e.target.value) 
                  }))}
                  min="10000"
                  step="10000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  원
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price-max">최대 가격</Label>
              <div className="relative">
                <Input
                  id="price-max"
                  type="number"
                  value={formData.price_max}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price_max: Number(e.target.value) 
                  }))}
                  min={formData.price_min}
                  step="10000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  원
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            가격 범위: ₩{(formData.price_min / 10000).toFixed(0)}만원 ~ ₩{(formData.price_max / 10000).toFixed(0)}만원
          </div>
        </CardContent>
      </Card>

      {/* Companion Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            촬영 대상
          </CardTitle>
          <CardDescription>
            어떤 형태의 촬영을 전문으로 하시나요? (복수 선택 가능)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {COMPANION_TYPES.map(companion => (
              <div
                key={companion.value}
                className={`
                  cursor-pointer rounded-lg border-2 p-3 text-center transition-all
                  ${formData.companion_types.includes(companion.value)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => handleCompanionToggle(companion.value)}
              >
                <span className="font-medium">{companion.label}</span>
              </div>
            ))}
          </div>
          
          {formData.companion_types.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">선택된 촬영 대상:</p>
              <div className="flex flex-wrap gap-2">
                {formData.companion_types.map((type: string) => {
                  const companion = COMPANION_TYPES.find(c => c.value === type)
                  return (
                    <Badge key={type} variant="default">
                      {companion?.label}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            '저장 중...'
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              저장하기
            </>
          )}
        </Button>
      </div>
    </div>
  )
}