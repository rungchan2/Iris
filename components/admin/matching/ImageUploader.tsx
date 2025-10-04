'use client'
import { adminLogger } from "@/lib/logger"

import { useState, useEffect } from 'react'
import { SurveyImage } from '@/types/matching.types'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
  Trash2,
  Save,
  Edit,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'
import { PhotoUploader } from '@/components/admin/photo-uploader'
import { toast } from 'sonner'
import Image from 'next/image'

interface ImageUploaderProps {
  questionId: string
  images: SurveyImage[]
  onUpdate: (images: SurveyImage[]) => void
}

export default function ImageUploader({
  questionId,
  images,
  onUpdate
}: ImageUploaderProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [localImages, setLocalImages] = useState<SurveyImage[]>(images || [])
  const supabase = createClient()

  // Update local images when props change
  useEffect(() => {
    setLocalImages(images || [])
  }, [images])

  // Refresh images after upload
  const handleUploadComplete = async () => {
    try {
      const { data, error } = await supabase
        .from('survey_images')
        .select('*')
        .eq('question_id', questionId)
        .order('image_order')

      if (error) throw error
      const updatedImages = data || []
      setLocalImages(updatedImages)
      onUpdate(updatedImages)
    } catch (error) {
      adminLogger.error('Error refreshing images:', error)
    }
  }

  const startEdit = (image: SurveyImage) => {
    setEditingId(image.id)
    setEditLabel(image.image_label)
  }

  const saveImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('survey_images')
        .update({ 
          image_label: editLabel,
          embedding_generated_at: null // Reset to trigger regeneration
        })
        .eq('id', imageId)

      if (error) throw error

      const updatedImages = localImages.map(image =>
        image.id === imageId 
          ? { ...image, image_label: editLabel, image_embedding: null }
          : image
      )
      setLocalImages(updatedImages)
      onUpdate(updatedImages)

      // Queue embedding regeneration
      await fetch('/api/admin/matching/embeddings/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image_embedding',
          targetId: imageId
        })
      })

      setEditingId(null)
      setEditLabel('')
      toast.success('이미지 라벨이 저장되었습니다')
    } catch (error) {
      adminLogger.error('Error saving image:', error)
      toast.error('저장 중 오류가 발생했습니다')
    }
  }

  const deleteImage = async (imageId: string, imageUrl: string) => {
    try {
      // Delete from storage
      const filePath = imageUrl.split('/').slice(-2).join('/')
      await supabase.storage
        .from('photos')
        .remove([filePath])

      // Delete from database
      const { error } = await supabase
        .from('survey_images')
        .delete()
        .eq('id', imageId)

      if (error) throw error

      const updatedImages = localImages.filter(image => image.id !== imageId)
      setLocalImages(updatedImages)
      onUpdate(updatedImages)
      
      toast.success('이미지가 삭제되었습니다')
    } catch (error) {
      adminLogger.error('Error deleting image:', error)
      toast.error('삭제 중 오류가 발생했습니다')
    }
  }

  const toggleActive = async (imageId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('survey_images')
        .update({ is_active: isActive })
        .eq('id', imageId)

      if (error) throw error

      const updatedImages = localImages.map(image =>
        image.id === imageId 
          ? { ...image, is_active: isActive }
          : image
      )
      setLocalImages(updatedImages)
      onUpdate(updatedImages)
      
      toast.success(`이미지가 ${isActive ? '활성화' : '비활성화'}되었습니다`)
    } catch (error) {
      adminLogger.error('Error toggling image:', error)
      toast.error('상태 변경 중 오류가 발생했습니다')
    }
  }

  const getEmbeddingStatus = (image: SurveyImage) => {
    if (image.image_embedding) {
      return <Badge variant="outline" className="gap-1 text-green-600">
        <CheckCircle className="h-3 w-3" />
        완료
      </Badge>
    } else {
      return <Badge variant="outline" className="gap-1 text-yellow-600">
        <Clock className="h-3 w-3" />
        대기
      </Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* PhotoUploader for new uploads */}
      <PhotoUploader
        questionId={questionId}
        uploadType="survey"
        onUploadComplete={handleUploadComplete}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            이미지 관리
            <Badge variant="secondary">
              {localImages.length}개
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">

        {/* Images Grid */}
        {localImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localImages
              .sort((a, b) => a.image_order - b.image_order)
              .map((image) => (
                <div
                  key={image.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="aspect-video relative bg-gray-100">
                    {image.image_url && image.image_url !== 'placeholder_url' ? (
                      <Image
                        src={image.image_url}
                        alt={image.image_label}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">이미지 없음</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {getEmbeddingStatus(image)}
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {image.image_key.slice(0, 8)}...{image.image_key.slice(-8)}
                      </Badge>
                      <Switch
                        checked={image.is_active || false}
                        onCheckedChange={(checked) => toggleActive(image.id, checked)}
                      />
                    </div>
                    
                    {editingId === image.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder="이미지 라벨"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveImage(image.id)
                            if (e.key === 'Escape') {
                              setEditingId(null)
                              setEditLabel('')
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => saveImage(image.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null)
                              setEditLabel('')
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="font-medium">{image.image_label}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(image)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>이미지 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  이 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteImage(image.id, image.image_url)}
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

          {localImages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              아직 이미지가 없습니다. 위의 업로드 영역을 사용하여 이미지를 추가해보세요.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}