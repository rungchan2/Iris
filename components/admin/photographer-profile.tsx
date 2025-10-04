"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { User, Youtube, Camera, Palette, Users, Focus, Trash2, Upload, Phone, Globe, Instagram, MapPin, DollarSign, Award, Briefcase, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Image from "next/image"
import { useProfileMutations, useProfileImage } from "@/lib/hooks/use-photographer-profile"

interface PhotographerProfile {
  id: string
  email: string
  name: string
  personality_type?: string | null
  directing_style?: string | null
  photography_approach?: string | null
  youtube_intro_url?: string | null
  profile_image_url?: string | null
  phone?: string | null
  website_url?: string | null
  instagram_handle?: string | null
  gender?: string | null
  birth_year?: number | null
  age_range?: string | null
  years_experience?: number | null
  specialties?: string[] | null
  studio_location?: string | null
  equipment_info?: string | null
  bio?: string | null
  price_range_min?: number | null
  price_range_max?: number | null
  price_description?: string | null
}

interface PhotographerProfileSectionProps {
  photographer: PhotographerProfile
}

export function PhotographerProfileSection({ photographer }: PhotographerProfileSectionProps) {
  const [formData, setFormData] = useState({
    name: photographer.name || "",
    personality_type: photographer.personality_type || "",
    directing_style: photographer.directing_style || "",
    photography_approach: photographer.photography_approach || "",
    youtube_intro_url: photographer.youtube_intro_url || "",
    profile_image_url: photographer.profile_image_url || "",
    phone: photographer.phone || "",
    website_url: photographer.website_url || "",
    instagram_handle: photographer.instagram_handle || "",
    gender: photographer.gender || "",
    birth_year: photographer.birth_year?.toString() || "",
    age_range: photographer.age_range || "",
    years_experience: photographer.years_experience?.toString() || "",
    specialties: photographer.specialties?.join(", ") || "",
    studio_location: photographer.studio_location || "",
    equipment_info: photographer.equipment_info || "",
    bio: photographer.bio || "",
    price_range_min: photographer.price_range_min?.toString() || "",
    price_range_max: photographer.price_range_max?.toString() || "",
    price_description: photographer.price_description || "",
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const supabase = createClient()

  // Use hooks for profile mutations
  const { updateBasic } = useProfileMutations(photographer.id)
  const { updateImageUrl } = useProfileImage(photographer.id)

  const handleSave = async () => {
    try {
      // Process specialties array
      const specialtiesArray = formData.specialties
        ? formData.specialties.split(",").map(s => s.trim()).filter(s => s)
        : []

      // Use server action to update profile
      await updateBasic.mutateAsync({
        name: formData.name.trim(),
        personality_type: formData.personality_type || undefined,
        directing_style: formData.directing_style || undefined,
        photography_approach: formData.photography_approach || undefined,
        youtube_intro_url: formData.youtube_intro_url || undefined,
        phone: formData.phone || undefined,
        website_url: formData.website_url || undefined,
        instagram_handle: formData.instagram_handle || undefined,
        gender: formData.gender || undefined,
        birth_year: formData.birth_year ? parseInt(formData.birth_year) : undefined,
        age_range: formData.age_range || undefined,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : undefined,
        specialties: specialtiesArray.length > 0 ? specialtiesArray : undefined,
        studio_location: formData.studio_location || undefined,
        equipment_info: formData.equipment_info || undefined,
        bio: formData.bio || undefined,
        price_range_min: formData.price_range_min ? parseInt(formData.price_range_min) : undefined,
        price_range_max: formData.price_range_max ? parseInt(formData.price_range_max) : undefined,
        price_description: formData.price_description || undefined,
      })

      toast.success("프로필이 성공적으로 업데이트되었습니다")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("프로필 업데이트에 실패했습니다")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB를 초과할 수 없습니다")
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("이미지 파일만 업로드할 수 있습니다")
      return
    }

    setUploadingImage(true)
    try {
      // Delete old profile image if exists
      if (formData.profile_image_url) {
        await handleImageDelete(false) // Don't show toast for old image deletion
      }

      // Upload to Supabase Storage (use same path structure as photo-uploader)
      const fileExt = file.name.split('.').pop()
      const fileName = `profile-${Date.now()}.${fileExt}`
      const path = `${photographer.id}/profile/${fileName}`

      const { data, error } = await supabase.storage
        .from('photos')
        .upload(path, file, {
          upsert: false
        })

      if (error) throw error

      // Get public URL (use same path as upload)
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(path)

      // Update profile image URL using server action
      await updateImageUrl.mutateAsync(publicUrl)

      setFormData(prev => ({ ...prev, profile_image_url: publicUrl }))
      toast.success("프로필 이미지가 업로드되었습니다")
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast.error(`이미지 업로드에 실패했습니다: ${error.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageDelete = async (showToast = true) => {
    if (!formData.profile_image_url) return

    try {
      // Delete from storage if it's a Supabase storage URL
      if (formData.profile_image_url.includes('supabase')) {
        // Extract the full path from URL
        const url = new URL(formData.profile_image_url)
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/photos\/(.+)$/)

        if (pathMatch) {
          const fullPath = pathMatch[1]
          await supabase.storage
            .from('photos')
            .remove([fullPath])
        }
      }

      // Update database using server action
      await updateImageUrl.mutateAsync('')

      setFormData(prev => ({ ...prev, profile_image_url: '' }))
      if (showToast) {
        toast.success("프로필 이미지가 삭제되었습니다")
      }
    } catch (error: any) {
      console.error("Error deleting image:", error)
      if (showToast) {
        toast.error("이미지 삭제에 실패했습니다")
      }
    }
  }

  const handleSaveProfileUrl = async () => {
    if (!formData.profile_image_url.trim()) return

    try {
      await updateImageUrl.mutateAsync(formData.profile_image_url.trim())
      toast.success('프로필 이미지 URL이 저장되었습니다')
    } catch (error) {
      toast.error('URL 저장에 실패했습니다')
    }
  }

  return (
    <div className="space-y-6">

      {/* Basic Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="이름을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              value={photographer.email}
              disabled
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            프로필 이미지
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              {formData.profile_image_url ? (
                <div className="relative w-24 h-24">
                  <Image
                    src={formData.profile_image_url}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover border-4 border-white shadow-lg"
                    sizes="96px"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full p-0"
                    onClick={() => handleImageDelete()}
                    title="이미지 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-image" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  프로필 이미지 업로드
                </Label>
                <Input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {uploadingImage && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    업로드 중...
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  JPG, PNG 파일만 가능 (최대 5MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-url">또는 이미지 URL 직접 입력</Label>
                <div className="flex gap-2">
                  <Input
                    id="profile-url"
                    value={formData.profile_image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, profile_image_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveProfileUrl}
                    disabled={!formData.profile_image_url.trim()}
                  >
                    저장
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photography Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            촬영 스타일
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="personality" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              성격 유형
            </Label>
            <Select
              value={formData.personality_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, personality_type: value }))}
            >
              <SelectTrigger id="personality">
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">털털 친근 (E)</SelectItem>
                <SelectItem value="delicate">섬세 예민 (I)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="directing" className="flex items-center gap-2">
              <Focus className="h-4 w-4" />
              디렉팅 스타일
            </Label>
            <Select
              value={formData.directing_style}
              onValueChange={(value) => setFormData(prev => ({ ...prev, directing_style: value }))}
            >
              <SelectTrigger id="directing">
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="directing">포즈 디렉팅 달인</SelectItem>
                <SelectItem value="natural">자유로운 현장 추구</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approach">촬영 접근 방식</Label>
            <Select
              value={formData.photography_approach}
              onValueChange={(value) => setFormData(prev => ({ ...prev, photography_approach: value }))}
            >
              <SelectTrigger id="approach">
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photographer">작가의 시선</SelectItem>
                <SelectItem value="client">내가 추구하는 이미지</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            연락처 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                전화번호
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="010-0000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                웹사이트
              </Label>
              <Input
                id="website"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              인스타그램 핸들
            </Label>
            <Input
              id="instagram"
              value={formData.instagram_handle}
              onChange={(e) => setFormData(prev => ({ ...prev, instagram_handle: e.target.value }))}
              placeholder="@username"
            />
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            개인 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">성별</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">남성</SelectItem>
                  <SelectItem value="female">여성</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth-year">출생년도</Label>
              <Input
                id="birth-year"
                type="number"
                value={formData.birth_year}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_year: e.target.value }))}
                placeholder="1990"
                min="1950"
                max={new Date().getFullYear()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age-range">연령대</Label>
              <Select
                value={formData.age_range}
                onValueChange={(value) => setFormData(prev => ({ ...prev, age_range: value }))}
              >
                <SelectTrigger id="age-range">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20s">20대</SelectItem>
                  <SelectItem value="30s">30대</SelectItem>
                  <SelectItem value="40s">40대</SelectItem>
                  <SelectItem value="50s">50대</SelectItem>
                  <SelectItem value="60s+">60대 이상</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">경력 (년)</Label>
            <Input
              id="experience"
              type="number"
              value={formData.years_experience}
              onChange={(e) => setFormData(prev => ({ ...prev, years_experience: e.target.value }))}
              placeholder="5"
              min="0"
              max="50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            전문 분야
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="specialties" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              전문 분야 (쉼표로 구분)
            </Label>
            <Input
              id="specialties"
              value={formData.specialties}
              onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
              placeholder="포트레이트, 웨딩, 스냅, 제품촬영"
            />
            <p className="text-xs text-muted-foreground">
              예: 포트레이트, 웨딩, 스냅, 제품촬영 (쉼표로 구분해주세요)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studio-location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              스튜디오 위치
            </Label>
            <Input
              id="studio-location"
              value={formData.studio_location}
              onChange={(e) => setFormData(prev => ({ ...prev, studio_location: e.target.value }))}
              placeholder="서울특별시 강남구"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              장비 정보
            </Label>
            <Textarea
              id="equipment"
              value={formData.equipment_info}
              onChange={(e) => setFormData(prev => ({ ...prev, equipment_info: e.target.value }))}
              placeholder="Canon 5D Mark IV, 85mm f/1.4, 조명장비 등"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              자기소개
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="작가로서의 철학, 경험, 스타일 등을 소개해주세요"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            가격 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price-min">최소 가격 (원)</Label>
              <Input
                id="price-min"
                type="number"
                value={formData.price_range_min}
                onChange={(e) => setFormData(prev => ({ ...prev, price_range_min: e.target.value }))}
                placeholder="100000"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price-max">최대 가격 (원)</Label>
              <Input
                id="price-max"
                type="number"
                value={formData.price_range_max}
                onChange={(e) => setFormData(prev => ({ ...prev, price_range_max: e.target.value }))}
                placeholder="500000"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price-description">가격 설명</Label>
            <Textarea
              id="price-description"
              value={formData.price_description}
              onChange={(e) => setFormData(prev => ({ ...prev, price_description: e.target.value }))}
              placeholder="기본 패키지, 추가 옵션, 할인 조건 등을 설명해주세요"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* YouTube Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5" />
            자기소개 영상
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtube">YouTube 영상 링크</Label>
            <Input
              id="youtube"
              value={formData.youtube_intro_url}
              onChange={(e) => setFormData(prev => ({ ...prev, youtube_intro_url: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted-foreground">
              YouTube 영상 URL을 입력하세요 (예: https://www.youtube.com/watch?v=abc123)
            </p>
          </div>

          {formData.youtube_intro_url && (
            <div className="mt-4">
              <Label>미리보기</Label>
              <div className="mt-2 aspect-video max-w-md">
                <iframe
                  src={`https://www.youtube.com/embed/${formData.youtube_intro_url.split('v=')[1]?.split('&')[0]}`}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={updateBasic.isPending}
        className="w-full"
        size="lg"
      >
        {updateBasic.isPending ? "저장 중..." : "모든 변경사항 저장"}
      </Button>
    </div>
  )
}
