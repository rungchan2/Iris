'use client'

import { useState } from 'react'
import { SurveyQuestion } from '@/types/matching.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import QuestionEditor from '@/components/admin/matching/QuestionEditor'
import EmbeddingManager from '@/components/admin/matching/EmbeddingManager'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import {
  Zap,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import {
  useSurveyQuestions,
  useEmbeddingStatus,
  useUpdateSurveyQuestion,
  useRefreshEmbeddingStatus,
} from '@/lib/hooks/use-matching-questions'

export default function QuestionsManagement() {
  // React Query hooks
  const { data: questions = [], isLoading: loadingQuestions } = useSurveyQuestions()
  const { data: embeddingStatus = { total: 0, generated: 0, pending: 0 } } = useEmbeddingStatus()
  const updateQuestionMutation = useUpdateSurveyQuestion()
  const refreshEmbeddingStatus = useRefreshEmbeddingStatus()

  // Local state
  const [selectedQuestion, setSelectedQuestion] = useState<SurveyQuestion | null>(null)

  const loading = loadingQuestions

  const handleQuestionUpdate = (questionId: string, updates: Parameters<typeof updateQuestionMutation.mutate>[0]['updates']) => {
    updateQuestionMutation.mutate({ questionId, updates })
  }

  const getQuestionTypeLabel = (type: string) => {
    switch(type) {
      case 'single_choice': return '단일 선택'
      case 'image_choice': return '이미지 선택'
      case 'textarea': return '주관식'
      default: return type
    }
  }

  const getWeightCategoryLabel = (category: string | null) => {
    if (!category) return '-'
    switch(category) {
      case 'style_emotion': return '스타일/감성 (40%)'
      case 'communication_psychology': return '소통/심리 (30%)'
      case 'purpose_story': return '목적/스토리 (20%)'
      case 'companion': return '동반자 (10%)'
      default: return category
    }
  }

  const getQuestionEmbeddingStatus = (question: SurveyQuestion) => {
    if (question.question_type === 'image_choice') {
      const images = question.survey_images || []
      const totalImages = images.length
      const generatedImages = images.filter(img => img.image_embedding).length
      
      if (totalImages === 0) return { status: 'empty', label: '이미지 없음', color: 'gray' }
      if (generatedImages === 0) return { status: 'none', label: '생성 전', color: 'red' }
      if (generatedImages === totalImages) return { status: 'complete', label: '생성 완료', color: 'green' }
      return { status: 'partial', label: `${generatedImages}/${totalImages} 생성`, color: 'yellow' }
    } else {
      const choices = question.survey_choices || []
      const totalChoices = choices.length
      const generatedChoices = choices.filter(choice => choice.choice_embedding).length
      
      if (totalChoices === 0) return { status: 'empty', label: '선택지 없음', color: 'gray' }
      if (generatedChoices === 0) return { status: 'none', label: '생성 전', color: 'red' }
      if (generatedChoices === totalChoices) return { status: 'complete', label: '생성 완료', color: 'green' }
      return { status: 'partial', label: `${generatedChoices}/${totalChoices} 생성`, color: 'yellow' }
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">질문 관리</h1>
          <p className="text-muted-foreground mt-2">
            10문항 설문 질문과 선택지를 관리합니다.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          질문 추가
        </Button>
      </div>

      {/* Embedding Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            임베딩 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {embeddingStatus.generated}/{embeddingStatus.total}
              </div>
              <p className="text-sm text-muted-foreground">
                임베딩 생성 완료
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {embeddingStatus.pending > 0 ? (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {embeddingStatus.pending}개 대기 중
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  모두 완료
                </Badge>
              )}
              
              <EmbeddingManager onComplete={refreshEmbeddingStatus} />
            </div>
          </div>
          
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(embeddingStatus.generated / embeddingStatus.total) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">전체 질문</TabsTrigger>
          <TabsTrigger value="active">활성 질문</TabsTrigger>
          <TabsTrigger value="inactive">비활성 질문</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2">
                <Clock className="h-5 w-5 animate-spin" />
                질문을 불러오는 중...
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <Card 
                  key={question.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedQuestion(question)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Q{question.question_order}
                          </Badge>
                          <CardTitle className="text-lg">
                            {question.question_title}
                          </CardTitle>
                        </div>
                        <CardDescription>
                          {question.question_key}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={question.is_active ? 'default' : 'secondary'}>
                          {question.is_active ? '활성' : '비활성'}
                        </Badge>
                        {question.is_hard_filter && (
                          <Badge variant="destructive">
                            하드필터
                          </Badge>
                        )}
                        {(() => {
                          const embeddingStatus = getQuestionEmbeddingStatus(question)
                          return (
                            <Badge 
                              variant="outline" 
                              className={`gap-1 ${
                                embeddingStatus.color === 'green' ? 'text-green-600 border-green-200' :
                                embeddingStatus.color === 'yellow' ? 'text-yellow-600 border-yellow-200' :
                                embeddingStatus.color === 'red' ? 'text-red-600 border-red-200' :
                                'text-gray-600 border-gray-200'
                              }`}
                            >
                              {embeddingStatus.color === 'green' && <CheckCircle className="h-3 w-3" />}
                              {embeddingStatus.color === 'yellow' && <Clock className="h-3 w-3" />}
                              {embeddingStatus.color === 'red' && <AlertCircle className="h-3 w-3" />}
                              {embeddingStatus.label}
                            </Badge>
                          )
                        })()}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">질문 타입</p>
                        <p className="font-medium">
                          {getQuestionTypeLabel(question.question_type)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">가중치 카테고리</p>
                        <p className="font-medium">
                          {getWeightCategoryLabel(question.weight_category)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">기본 가중치</p>
                        <p className="font-medium">
                          {(Number(question.base_weight) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {question.question_type === 'image_choice' 
                            ? `${question.survey_images?.length || 0}개 이미지`
                            : `${question.survey_choices?.length || 0}개 선택지`
                          }
                        </div>
                        
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {questions
            .filter(q => q.is_active)
            .map(question => (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Q{question.question_order}. {question.question_title}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {questions
            .filter(q => !q.is_active)
            .map(question => (
              <Card key={question.id} className="opacity-60">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Q{question.question_order}. {question.question_title}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
        </TabsContent>
      </Tabs>

      {/* Question Editor Modal */}
      {selectedQuestion && (
        <QuestionEditor
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          onUpdate={() => {
            // Questions will auto-refresh via React Query invalidation
            setSelectedQuestion(null)
          }}
        />
      )}
    </div>
  )
}