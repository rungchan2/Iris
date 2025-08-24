"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Youtube, Camera, Palette, Users, Focus, Trash2, Upload } from "lucide-react"
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

      // Update profile image URL in database immediately
      const { error: updateError } = await supabase
        .from("photographers")
        .update({
          profile_image_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", photographer.id)

      if (updateError) throw updateError

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

      // Update database
      const { error: updateError } = await supabase
        .from("photographers")
        .update({
          profile_image_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", photographer.id)

      if (updateError) throw updateError

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
                <div className="relative">
                  <img
                    src={formData.profile_image_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
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
                    onClick={() => {
                      // Update database immediately when URL is manually set
                      if (formData.profile_image_url.trim()) {
                        supabase
                          .from("photographers")
                          .update({
                            profile_image_url: formData.profile_image_url.trim(),
                            updated_at: new Date().toISOString(),
                          })
                          .eq("id", photographer.id)
                          .then(({ error }) => {
                            if (error) {
                              toast.error('URL 저장에 실패했습니다')
                            } else {
                              toast.success('프로필 이미지 URL이 저장되었습니다')
                            }
                          })
                      }
                    }}
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