"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Youtube, Camera, Palette, Users, Focus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface PhotographerProfile {
  id: string
  email: string
  name: string
  personality_type?: string | null
  directing_style?: string | null
  photography_approach?: string | null
  youtube_intro_url?: string | null
  profile_image_url?: string | null
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
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("photographers")
        .update({
          name: formData.name.trim(),
          personality_type: formData.personality_type || null,
          directing_style: formData.directing_style || null,
          photography_approach: formData.photography_approach || null,
          youtube_intro_url: formData.youtube_intro_url || null,
          profile_image_url: formData.profile_image_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", photographer.id)

      if (error) throw error

      toast.success("프로필이 성공적으로 업데이트되었습니다")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("프로필 업데이트에 실패했습니다")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${photographer.id}-${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(`profiles/${fileName}`, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(`profiles/${fileName}`)

      setFormData(prev => ({ ...prev, profile_image_url: publicUrl }))
      toast.success("프로필 이미지가 업로드되었습니다")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("이미지 업로드에 실패했습니다")
    } finally {
      setUploadingImage(false)
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
          <div className="flex items-center gap-4">
            {formData.profile_image_url && (
              <img
                src={formData.profile_image_url}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            )}
            <div className="flex-1 space-y-2">
              <Label htmlFor="profile-image">프로필 이미지 업로드</Label>
              <Input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              {uploadingImage && <p className="text-sm text-muted-foreground">업로드 중...</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="profile-url">또는 이미지 URL 입력</Label>
            <Input
              id="profile-url"
              value={formData.profile_image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, profile_image_url: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
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
        disabled={isUpdating}
        className="w-full"
        size="lg"
      >
        {isUpdating ? "저장 중..." : "모든 변경사항 저장"}
      </Button>
    </div>
  )
}