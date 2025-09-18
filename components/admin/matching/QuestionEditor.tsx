'use client'

import { useState, useEffect } from 'react'
import { SurveyQuestion, SurveyChoice, SurveyImage } from '@/types/matching.types'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ChoiceEditor from './ChoiceEditor'
import ImageUploader from './ImageUploader'
import { 
  Save,
  Trash2,
  Plus,
  GripVertical,
  Zap,
  Image,
  Type,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface QuestionEditorProps {
  question: SurveyQuestion
  onClose: () => void
  onUpdate: () => void
}

export default function QuestionEditor({
  question,
  onClose,
  onUpdate
}: QuestionEditorProps) {
  const [formData, setFormData] = useState({
    question_title: question.question_title,
    question_key: question.question_key,
    question_type: question.question_type,
    weight_category: question.weight_category || '',
    base_weight: Number(question.base_weight),
    is_hard_filter: question.is_hard_filter,
    is_active: question.is_active
  })
  
  const [choices, setChoices] = useState<SurveyChoice[]>(question.survey_choices || [])
  const [images, setImages] = useState<SurveyImage[]>(question.survey_images || [])
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Load images when question changes or modal opens
  useEffect(() => {
    if (question.question_type === 'image_choice' && question.id) {
      loadImages()
    }
  }, [question.id])

  const loadImages = async () => {
    try {
      const { data, error } = await supabase
        .from('survey_images')
        .select('*')
        .eq('question_id', question.id)
        .order('image_order')

      if (error) throw error
      setImages(data || [])
    } catch (error) {
      console.error('Error loading images:', error)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Update question
      const { error: questionError } = await supabase
        .from('survey_questions')
        .update({
          question_title: formData.question_title,
          question_type: formData.question_type,
          weight_category: formData.weight_category || null,
          base_weight: formData.base_weight,
          is_hard_filter: formData.is_hard_filter,
          is_active: formData.is_active
        })
        .eq('id', question.id)

      if (questionError) throw questionError
      
      toast.success('질문이 저장되었습니다')
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error saving question:', error)
      toast.error('저장 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  const handleChoiceUpdate = (updatedChoices: SurveyChoice[]) => {
    setChoices(updatedChoices)
  }

  const handleImageUpdate = (updatedImages: SurveyImage[]) => {
    setImages(updatedImages)
  }

  const generateEmbeddings = async () => {
    try {
      toast.info('임베딩 생성을 시작합니다...')
      
      const response = await fetch('/api/admin/matching/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id })
      })
      
      if (!response.ok) throw new Error('Embedding generation failed')
      
      toast.success('임베딩 생성이 완료되었습니다')
    } catch (error) {
      console.error('Error generating embeddings:', error)
      toast.error('임베딩 생성 중 오류가 발생했습니다')
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent maxWidth="4xl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            질문 편집 - Q{question.question_order}
          </DialogTitle>
          <DialogDescription>
            질문 정보, 선택지, 이미지를 편집할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">기본 정보</TabsTrigger>
            <TabsTrigger value="choices">
              {question.question_type === 'image_choice' ? '이미지' : '선택지'}
            </TabsTrigger>
            <TabsTrigger value="settings">고급 설정</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">질문 제목</Label>
                    <Input
                      id="title"
                      value={formData.question_title}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        question_title: e.target.value
                      }))}
                      placeholder="질문을 입력하세요"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="key">질문 키</Label>
                    <Input
                      id="key"
                      value={formData.question_key}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>질문 타입</Label>
                    <Select
                      value={formData.question_type}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        question_type: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_choice">단일 선택</SelectItem>
                        <SelectItem value="image_choice">이미지 선택</SelectItem>
                        <SelectItem value="textarea">주관식</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>가중치 카테고리</Label>
                    <Select
                      value={formData.weight_category}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        weight_category: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="style_emotion">스타일/감성 (40%)</SelectItem>
                        <SelectItem value="communication_psychology">소통/심리 (30%)</SelectItem>
                        <SelectItem value="purpose_story">목적/스토리 (20%)</SelectItem>
                        <SelectItem value="companion">동반자 (10%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">기본 가중치</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      max="1"
                      step="0.001"
                      value={formData.base_weight}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        base_weight: Number(e.target.value)
                      }))}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">
                      ({(formData.base_weight * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.is_active || false}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        is_active: checked
                      }))}
                    />
                    <Label htmlFor="active">활성화</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hard-filter"
                      checked={formData.is_hard_filter || false}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        is_hard_filter: checked
                      }))}
                    />
                    <Label htmlFor="hard-filter">하드 필터</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="choices" className="space-y-4">
            {question.question_type === 'image_choice' ? (
              <ImageUploader
                questionId={question.id}
                images={images}
                onUpdate={handleImageUpdate}
              />
            ) : question.question_type === 'single_choice' ? (
              <ChoiceEditor
                questionId={question.id}
                choices={choices}
                onUpdate={handleChoiceUpdate}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    주관식 질문에는 선택지가 없습니다.
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  임베딩 관리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  이 질문의 모든 선택지에 대한 임베딩을 다시 생성합니다.
                  텍스트를 수정한 후에는 임베딩을 재생성해야 합니다.
                </p>
                
                <Button onClick={generateEmbeddings} className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  임베딩 재생성
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}