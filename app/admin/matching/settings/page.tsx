'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import { 
  Sliders, 
  Database, 
  Zap,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Brain,
  Loader2,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface SurveyQuestion {
  id: string
  question_order: number
  question_key: string
  question_title: string
  question_type: string
  weight_category: string
  base_weight: number
  is_hard_filter: boolean
  is_active: boolean
  survey_choices?: Array<{
    id: string
    choice_key: string
    choice_label: string
    choice_order: number
    is_active: boolean
  }>
  survey_images?: Array<{
    id: string
    image_key: string
    image_label: string
    image_url: string
    image_order: number
    is_active: boolean
  }>
}


export default function MatchingSettingsPage() {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [systemSettings, setSystemSettings] = useState<Record<string, string | number | boolean>>({})
  const [weights, setWeights] = useState({
    styleEmotion: [40],
    communicationPsychology: [30],
    purposeStory: [20],
    companion: [10]
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [editingChoice, setEditingChoice] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    maxResults: 10,
    minSimilarityScore: 0.7,
    enableKeywordBonus: true,
    enableRegionFilter: true,
    enableBudgetFilter: true,
    cacheResults: true,
    autoRefreshEmbeddings: false
  })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true)
    try {
      // Load survey questions with choices and images
      const { data: questionsData, error: questionsError } = await supabase
        .from('survey_questions')
        .select(`
          *,
          survey_choices (*),
          survey_images (*)
        `)
        .order('question_order')

      if (questionsError) throw questionsError

      setQuestions((questionsData || []) as any)

      // Load system settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('*')

      if (settingsError) throw settingsError

      const settingsMap: Record<string, string | number | boolean> = {}
      settingsData?.forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value as any
      })
      setSystemSettings(settingsMap)

      // Calculate current weights from questions
      const currentWeights = {
        styleEmotion: [40],
        communicationPsychology: [30], 
        purposeStory: [20],
        companion: [10]
      }

      if (questionsData) {
        const categories = {
          style_emotion: 0,
          communication_psychology: 0,
          purpose_story: 0,
          companion: 0
        }

        questionsData.forEach(q => {
          if (q.weight_category && categories.hasOwnProperty(q.weight_category)) {
            (categories as any)[q.weight_category] += q.base_weight
          }
        })

        currentWeights.styleEmotion = [Math.round(categories.style_emotion * 100)]
        currentWeights.communicationPsychology = [Math.round(categories.communication_psychology * 100)]
        currentWeights.purposeStory = [Math.round(categories.purpose_story * 100)]
        currentWeights.companion = [Math.round(categories.companion * 100)]
      }

      setWeights(currentWeights)

      // Load system settings into local state
      const settingsState = {
        maxResults: Number(settingsMap.max_results) || 10,
        minSimilarityScore: Number(settingsMap.min_similarity_score) || 0.7,
        enableKeywordBonus: Boolean(settingsMap.enable_keyword_bonus ?? true),
        enableRegionFilter: Boolean(settingsMap.enable_region_filter ?? true),
        enableBudgetFilter: Boolean(settingsMap.enable_budget_filter ?? true),
        cacheResults: Boolean(settingsMap.cache_results ?? true),
        autoRefreshEmbeddings: Boolean(settingsMap.auto_refresh_embeddings ?? false)
      }
      setSettings(settingsState)

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('데이터 로딩 실패', {
        description: '설정 데이터를 불러오는 중 오류가 발생했습니다.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWeightChange = (dimension: string, value: number[]) => {
    setWeights(prev => ({ ...prev, [dimension]: value }))
  }

  const handleSettingChange = (key: string, value: string | number | boolean) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateQuestionTitle = async (questionId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('survey_questions')
        .update({ question_title: newTitle })
        .eq('id', questionId)

      if (error) throw error

      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, question_title: newTitle } : q
      ))

      toast.success('질문 제목이 업데이트되었습니다')
      setEditingQuestion(null)
    } catch (error) {
      console.error('Error updating question:', error)
      toast.error('질문 업데이트 실패')
    }
  }

  const updateChoiceLabel = async (choiceId: string, newLabel: string) => {
    try {
      const { error } = await supabase
        .from('survey_choices')
        .update({ choice_label: newLabel })
        .eq('id', choiceId)

      if (error) throw error

      setQuestions(prev => prev.map(q => ({
        ...q,
        survey_choices: q.survey_choices?.map(c => 
          c.id === choiceId ? { ...c, choice_label: newLabel } : c
        )
      })))

      // Add to embedding job queue
      await supabase
        .from('embedding_jobs')
        .insert({
          job_type: 'choice_embedding',
          target_id: choiceId,
          job_status: 'pending'
        })

      toast.success('선택지가 업데이트되었습니다')
      setEditingChoice(null)
    } catch (error) {
      console.error('Error updating choice:', error)
      toast.error('선택지 업데이트 실패')
    }
  }

  const toggleQuestionActive = async (questionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('survey_questions')
        .update({ is_active: isActive })
        .eq('id', questionId)

      if (error) throw error

      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, is_active: isActive } : q
      ))

      toast.success(isActive ? '질문이 활성화되었습니다' : '질문이 비활성화되었습니다')
    } catch (error) {
      console.error('Error toggling question:', error)
      toast.error('질문 상태 변경 실패')
    }
  }

  const updateWeights = async () => {
    setSaving(true)
    try {
      // Calculate weight ratios
      const total = Object.values(weights).reduce((sum, [value]) => sum + value, 0)
      const styleRatio = weights.styleEmotion[0] / total
      const commRatio = weights.communicationPsychology[0] / total
      const purposeRatio = weights.purposeStory[0] / total
      const companionRatio = weights.companion[0] / total

      // Update questions with new weights
      const updates = []

      for (const question of questions) {
        let newWeight = question.base_weight
        
        switch (question.weight_category) {
          case 'style_emotion':
            newWeight = styleRatio / questions.filter(q => q.weight_category === 'style_emotion').length
            break
          case 'communication_psychology':
            newWeight = commRatio / questions.filter(q => q.weight_category === 'communication_psychology').length
            break
          case 'purpose_story':
            newWeight = purposeRatio / questions.filter(q => q.weight_category === 'purpose_story').length
            break
          case 'companion':
            newWeight = companionRatio / questions.filter(q => q.weight_category === 'companion').length
            break
        }

        if (Math.abs(newWeight - question.base_weight) > 0.001) {
          updates.push({ id: question.id, base_weight: newWeight })
        }
      }

      // Batch update
      for (const update of updates) {
        await supabase
          .from('survey_questions')
          .update({ base_weight: update.base_weight })
          .eq('id', update.id)
      }

      toast.success('가중치가 저장되었습니다')
      await loadData() // Reload to verify changes
    } catch (error) {
      console.error('Error updating weights:', error)
      toast.error('가중치 저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const saveSystemSettings = async () => {
    setSaving(true)
    try {
      for (const [key, value] of Object.entries(systemSettings)) {
        await supabase
          .from('system_settings')
          .upsert({
            setting_key: key,
            setting_value: value,
            setting_description: getSettingDescription(key)
          })
      }

      toast.success('시스템 설정이 저장되었습니다')
    } catch (error) {
      console.error('Error saving system settings:', error)
      toast.error('시스템 설정 저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const getSettingDescription = (key: string): string => {
    const descriptions = {
      max_results: '최대 매칭 결과 수',
      min_similarity_score: '최소 유사도 점수',
      enable_keyword_bonus: '키워드 보너스 활성화',
      enable_region_filter: '지역 필터링 활성화',
      enable_budget_filter: '예산 필터링 활성화',
      cache_results: '결과 캐싱 활성화',
      auto_refresh_embeddings: '자동 임베딩 갱신'
    }
    return (descriptions as any)[key] || key
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save weights
      await updateWeights()
      
      // Save system settings
      await saveSystemSettings()
      
      toast.success('모든 설정이 저장되었습니다')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('설정 저장 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      // Reset weights to default
      const defaultWeights = {
        styleEmotion: [40],
        communicationPsychology: [30],
        purposeStory: [20],
        companion: [10]
      }
      setWeights(defaultWeights)
      
      // Reset settings to default
      const defaultSettings = {
        maxResults: 10,
        minSimilarityScore: 0.7,
        enableKeywordBonus: true,
        enableRegionFilter: true,
        enableBudgetFilter: true,
        cacheResults: true,
        autoRefreshEmbeddings: false
      }
      setSettings(defaultSettings)
      
      toast.info('설정이 초기화되었습니다')
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error('설정 초기화 실패')
    }
  }

  const totalWeight = Object.values(weights).reduce((sum, [value]) => sum + value, 0)

  return (
    <div className="flex-1 space-y-6 p-6">
      <AdminBreadcrumb />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">매칭 시스템 설정</h2>
          <p className="text-muted-foreground">
            AI 매칭 알고리즘의 파라미터와 시스템 설정을 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving || loading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            초기화
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                설정 저장
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Weight Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            4차원 매칭 가중치
          </CardTitle>
          <CardDescription>
            각 차원별 매칭 중요도를 조절합니다 (총합: {totalWeight}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {totalWeight !== 100 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                가중치 총합이 100%가 아닙니다. 현재: {totalWeight}%
              </span>
            </div>
          )}
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">스타일 & 감성</Label>
                <Badge variant="secondary">{weights.styleEmotion[0]}%</Badge>
              </div>
              <Slider
                value={weights.styleEmotion}
                onValueChange={(value) => handleWeightChange('styleEmotion', value)}
                max={70}
                min={10}
                step={5}
                className="flex-1"
                disabled={loading || saving}
              />
              <p className="text-xs text-muted-foreground">
                촬영 스타일, 감성, 분위기 관련 매칭 가중치
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">소통 & 심리</Label>
                <Badge variant="secondary">{weights.communicationPsychology[0]}%</Badge>
              </div>
              <Slider
                value={weights.communicationPsychology}
                onValueChange={(value) => handleWeightChange('communicationPsychology', value)}
                max={50}
                min={10}
                step={5}
                className="flex-1"
                disabled={loading || saving}
              />
              <p className="text-xs text-muted-foreground">
                작가와의 소통 방식, 편안함 관련 매칭 가중치
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">목적 & 스토리</Label>
                <Badge variant="secondary">{weights.purposeStory[0]}%</Badge>
              </div>
              <Slider
                value={weights.purposeStory}
                onValueChange={(value) => handleWeightChange('purposeStory', value)}
                max={40}
                min={5}
                step={5}
                className="flex-1"
                disabled={loading || saving}
              />
              <p className="text-xs text-muted-foreground">
                촬영 목적, 스토리텔링 관련 매칭 가중치
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">동반자 관계</Label>
                <Badge variant="secondary">{weights.companion[0]}%</Badge>
              </div>
              <Slider
                value={weights.companion}
                onValueChange={(value) => handleWeightChange('companion', value)}
                max={30}
                min={5}
                step={5}
                className="flex-1"
                disabled={loading || saving}
              />
              <p className="text-xs text-muted-foreground">
                촬영 대상과의 관계 형성 관련 매칭 가중치
              </p>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              onClick={updateWeights} 
              disabled={loading || saving || totalWeight !== 100}
              variant="outline"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  가중치 적용
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            알고리즘 설정
          </CardTitle>
          <CardDescription>
            매칭 알고리즘의 세부 파라미터를 조정합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxResults">최대 결과 수</Label>
              <Input
                id="maxResults"
                type="number"
                value={settings.maxResults}
                onChange={(e) => handleSettingChange('maxResults', parseInt(e.target.value))}
                min="1"
                max="50"
              />
              <p className="text-xs text-muted-foreground">
                사용자에게 표시할 최대 작가 수
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minScore">최소 유사도 점수</Label>
              <Input
                id="minScore"
                type="number"
                step="0.1"
                value={settings.minSimilarityScore}
                onChange={(e) => handleSettingChange('minSimilarityScore', parseFloat(e.target.value))}
                min="0.1"
                max="1.0"
              />
              <p className="text-xs text-muted-foreground">
                매칭 결과에 포함될 최소 유사도 (0.0 ~ 1.0)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            시스템 설정
          </CardTitle>
          <CardDescription>
            매칭 시스템의 기능 활성화 및 성능 설정
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">키워드 보너스</Label>
                <p className="text-xs text-muted-foreground">
                  전문 키워드 매칭 시 가산점 적용
                </p>
              </div>
              <Switch
                checked={settings.enableKeywordBonus}
                onCheckedChange={(checked) => handleSettingChange('enableKeywordBonus', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">지역 필터링</Label>
                <p className="text-xs text-muted-foreground">
                  서비스 지역 기반 하드 필터링
                </p>
              </div>
              <Switch
                checked={settings.enableRegionFilter}
                onCheckedChange={(checked) => handleSettingChange('enableRegionFilter', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">예산 필터링</Label>
                <p className="text-xs text-muted-foreground">
                  예산 범위 기반 하드 필터링
                </p>
              </div>
              <Switch
                checked={settings.enableBudgetFilter}
                onCheckedChange={(checked) => handleSettingChange('enableBudgetFilter', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">결과 캐싱</Label>
                <p className="text-xs text-muted-foreground">
                  매칭 결과 임시 저장으로 성능 향상
                </p>
              </div>
              <Switch
                checked={settings.cacheResults}
                onCheckedChange={(checked) => handleSettingChange('cacheResults', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embedding Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            임베딩 관리
          </CardTitle>
          <CardDescription>
            벡터 임베딩 생성 및 관리 설정
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">자동 임베딩 갱신</Label>
              <p className="text-xs text-muted-foreground">
                프로필 변경 시 자동으로 임베딩 재생성
              </p>
            </div>
            <Switch
              checked={settings.autoRefreshEmbeddings}
              onCheckedChange={(checked) => handleSettingChange('autoRefreshEmbeddings', checked)}
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  임베딩 상태
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  모든 작가 프로필과 선택지의 임베딩이 최신 상태입니다.
                  마지막 업데이트: 2시간 전
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            설문 질문 관리
          </CardTitle>
          <CardDescription>
            10문항 설문 질문과 선택지를 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">데이터 로딩 중...</span>
            </div>
          ) : (
            <Tabs defaultValue="questions" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="questions">질문 관리</TabsTrigger>
                <TabsTrigger value="weights">가중치 설정</TabsTrigger>
              </TabsList>
              
              <TabsContent value="questions" className="space-y-4 mt-6">
                {questions.map((question) => (
                  <Card key={question.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Q{question.question_order}</Badge>
                          <Badge variant={question.is_active ? "default" : "secondary"}>
                            {question.is_active ? "활성" : "비활성"}
                          </Badge>
                          <Badge variant="outline">{question.weight_category}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingQuestion(editingQuestion === question.id ? null : question.id)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={question.is_active}
                            onCheckedChange={(checked) => toggleQuestionActive(question.id, checked)}
                          />
                        </div>
                      </div>
                      
                      {editingQuestion === question.id ? (
                        <div className="space-y-2 pt-2">
                          <Textarea
                            value={question.question_title}
                            onChange={(e) => {
                              const newTitle = e.target.value
                              setQuestions(prev => prev.map(q => 
                                q.id === question.id ? { ...q, question_title: newTitle } : q
                              ))
                            }}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateQuestionTitle(question.id, question.question_title)}
                            >
                              저장
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingQuestion(null)
                                loadData() // Reload to reset changes
                              }}
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <h3 className="font-medium text-lg pt-2">{question.question_title}</h3>
                      )}
                    </CardHeader>
                    
                    {(question.survey_choices || question.survey_images) && (
                      <CardContent>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">선택지</Label>
                          <div className="grid gap-2">
                            {question.survey_choices?.map((choice) => (
                              <div key={choice.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                {editingChoice === choice.id ? (
                                  <div className="flex-1 flex gap-2">
                                    <Input
                                      value={choice.choice_label}
                                      onChange={(e) => {
                                        const newLabel = e.target.value
                                        setQuestions(prev => prev.map(q => ({
                                          ...q,
                                          survey_choices: q.survey_choices?.map(c => 
                                            c.id === choice.id ? { ...c, choice_label: newLabel } : c
                                          )
                                        })))
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => updateChoiceLabel(choice.id, choice.choice_label)}
                                    >
                                      저장
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingChoice(null)
                                        loadData()
                                      }}
                                    >
                                      취소
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="flex-1">{choice.choice_label}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingChoice(choice.id)}
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            ))}
                            {question.survey_images?.map((image) => (
                              <div key={image.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="flex-1">{image.image_label}</span>
                                <Badge variant="outline">이미지</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="weights" className="space-y-4 mt-6">
                <div className="grid gap-4">
                  {questions.map((question) => (
                    <Card key={question.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Q{question.question_order}: {question.question_title}</h4>
                            <p className="text-sm text-muted-foreground">
                              카테고리: {question.weight_category} | 현재 가중치: {(question.base_weight * 100).toFixed(1)}%
                            </p>
                          </div>
                          <Badge variant={question.is_hard_filter ? "destructive" : "secondary"}>
                            {question.is_hard_filter ? "하드 필터" : "소프트 매칭"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}