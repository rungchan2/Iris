'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Save, Palette, MessageCircle, Target, Users, Brain, Lightbulb, Heart, Zap } from 'lucide-react'
import { useProfileMutations } from '@/lib/hooks/use-photographer-profile'

interface FourDimensionProfileData {
  style_emotion_description: string
  communication_psychology_description: string
  purpose_story_description: string
  companion_description: string
}

interface FourDimensionProfileEditorProps {
  profile: any
  onUpdate: (profile: any) => void
}

const DIMENSION_CONFIG: Array<{
  key: keyof FourDimensionProfileData
  title: string
  subtitle: string
  icon: any
  weight: string
  color: string
  description: string
  placeholder: string
  examples: string[]
}> = [
  {
    key: 'style_emotion_description',
    title: '스타일 & 감성',
    subtitle: '촬영 스타일과 감성적 표현',
    icon: Palette,
    weight: '40%',
    color: 'blue',
    description: '당신만의 촬영 스타일과 감성을 표현해주세요. 어떤 분위기와 느낌을 담아내는지 설명해주세요.',
    placeholder: '예: 자연스럽고 따뜻한 감성을 담아내는 것을 좋아합니다. 골든아워의 부드러운 빛을 활용해서 피사체의 자연스러운 미소와 표정을 포착하는 것이 제 스타일입니다...',
    examples: [
      '밝고 화사한 톤으로 생동감 넘치는 순간들을 담아냅니다',
      '무드있는 조명과 깊이감으로 감성적인 분위기를 연출합니다',
      '자연광을 활용한 깔끔하고 미니멀한 스타일을 추구합니다'
    ]
  },
  {
    key: 'communication_psychology_description',
    title: '소통 & 심리',
    subtitle: '고객과의 소통 방식과 심리적 접근',
    icon: MessageCircle,
    weight: '30%',
    color: 'green',
    description: '고객과 어떻게 소통하며, 어떤 방식으로 편안한 촬영 환경을 만드는지 알려주세요.',
    placeholder: '예: 촬영 전 충분한 상담을 통해 고객의 성향과 원하는 분위기를 파악합니다. 긴장하는 분들에게는 자연스러운 대화로 마음을 편안하게 해드리고...',
    examples: [
      '친근하고 밝은 대화로 긴장감을 풀어드립니다',
      '고객의 개성과 매력을 끌어내는 디렉팅을 합니다',
      '차분하고 안정적인 분위기에서 편안한 촬영을 진행합니다'
    ]
  },
  {
    key: 'purpose_story_description',
    title: '목적 & 스토리',
    subtitle: '촬영 목적과 스토리텔링 접근법',
    icon: Target,
    weight: '20%',
    color: 'purple',
    description: '어떤 목적의 촬영에 특화되어 있고, 어떤 스토리를 담아내는지 설명해주세요.',
    placeholder: '예: 특별한 순간들을 기념품처럼 남기는 것을 중요하게 생각합니다. 커플의 사랑스러운 모습, 가족의 따뜻한 순간들을 자연스럽게 담아내어...',
    examples: [
      '인생의 특별한 순간들을 영원히 기억될 추억으로 만들어드립니다',
      '브랜딩과 개인의 매력이 돋보이는 프로필 사진에 집중합니다',
      '일상 속 소소하지만 소중한 이야기들을 발견하고 담아냅니다'
    ]
  },
  {
    key: 'companion_description',
    title: '동반자 관계',
    subtitle: '촬영 대상과의 관계 형성',
    icon: Users,
    weight: '10%',
    color: 'orange',
    description: '다양한 촬영 대상(개인, 커플, 가족 등)과 어떻게 관계를 형성하고 촬영하는지 알려주세요.',
    placeholder: '예: 개인 촬영에서는 그 사람만의 독특한 매력을 찾아 부각시키고, 커플 촬영에서는 두 사람 사이의 자연스러운 케미스트리를...',
    examples: [
      '개인의 숨겨진 매력과 개성을 끌어내어 돋보이게 만듭니다',
      '커플의 자연스러운 스킨십과 애정표현을 아름답게 담아냅니다',
      '가족 구성원 각자의 특성을 살리면서도 조화로운 모습을 연출합니다'
    ]
  }
]

export default function FourDimensionProfileEditor({
  profile,
  onUpdate
}: FourDimensionProfileEditorProps) {
  const [formData, setFormData] = useState<FourDimensionProfileData>({
    style_emotion_description: profile?.style_emotion_description || '',
    communication_psychology_description: profile?.communication_psychology_description || '',
    purpose_story_description: profile?.purpose_story_description || '',
    companion_description: profile?.companion_description || ''
  })
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const { update4D } = useProfileMutations(profile?.photographer_id)

  const handleInputChange = (key: keyof FourDimensionProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    const { data, error } = await update4D.mutateAsync(formData)
    if (data && !error) {
      onUpdate(data)
    }
  }

  const calculateCompleteness = () => {
    const completedFields = DIMENSION_CONFIG.filter(
      config => formData[config.key]?.trim()
    ).length
    return (completedFields / DIMENSION_CONFIG.length) * 100
  }

  const completeness = calculateCompleteness()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">4차원 프로필</CardTitle>
                <CardDescription>
                  AI 매칭을 위한 상세한 작가 프로필을 작성해주세요
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">완성도</span>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  completeness === 100 
                    ? 'bg-green-100 text-green-700' 
                    : completeness >= 50 
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                }`}>
                  {Math.round(completeness)}%
                </div>
              </div>
              <Progress value={completeness} className="w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {DIMENSION_CONFIG.map(config => {
              const IconComponent = config.icon
              const isCompleted = !!formData[config.key]?.trim()
              
              return (
                <div
                  key={config.key}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isCompleted 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className={`h-4 w-4 ${
                      isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <span className="text-xs font-medium text-gray-600">
                      {config.weight}
                    </span>
                  </div>
                  <p className={`text-sm font-medium ${
                    isCompleted ? 'text-green-900' : 'text-gray-700'
                  }`}>
                    {config.title}
                  </p>
                </div>
              )
            })}
          </div>
          
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">
                  4차원 프로필이란?
                </p>
                <p>
                  AI가 고객의 취향과 당신의 작품 스타일을 정확히 매칭할 수 있도록 
                  4가지 핵심 영역에 대한 상세한 설명을 작성하는 시스템입니다.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimension Cards */}
      <div className="space-y-4">
        {DIMENSION_CONFIG.map(config => {
          const IconComponent = config.icon
          const isCompleted = !!(formData as any)[config.key]?.trim()
          const isExpanded = expandedCard === config.key
          const textLength = (formData as any)[config.key]?.length || 0
          
          return (
            <Card 
              key={config.key}
              className={`transition-all ${
                isCompleted 
                  ? 'border-green-200 bg-green-50/30' 
                  : 'border-gray-200'
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      config.color === 'blue' ? 'bg-blue-100' :
                      config.color === 'green' ? 'bg-green-100' :
                      config.color === 'purple' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      <IconComponent className={`h-5 w-5 ${
                        config.color === 'blue' ? 'text-blue-600' :
                        config.color === 'green' ? 'text-green-600' :
                        config.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{config.title}</CardTitle>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          config.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                          config.color === 'green' ? 'bg-green-100 text-green-700' :
                          config.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          매칭 가중치 {config.weight}
                        </span>
                      </div>
                      <CardDescription>{config.subtitle}</CardDescription>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedCard(isExpanded ? null : config.key)}
                  >
                    {isExpanded ? '접기' : '예시 보기'}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  {config.description}
                </p>
                
                {isExpanded && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      작성 예시
                    </h4>
                    <ul className="space-y-2">
                      {config.examples.map((example, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={config.key} className="text-sm font-medium">
                      {config.title} 설명
                    </Label>
                    <span className={`text-xs ${
                      textLength >= 100 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {textLength}/500 (최소 100자 권장)
                    </span>
                  </div>
                  
                  <Textarea
                    id={config.key}
                    placeholder={config.placeholder}
                    value={(formData as any)[config.key]}
                    onChange={(e) => handleInputChange(config.key, e.target.value)}
                    className="min-h-[120px] resize-none"
                    maxLength={500}
                  />
                  
                  {textLength > 0 && textLength < 100 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      더 구체적인 설명을 추가하면 더 정확한 매칭이 가능합니다
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={update4D.isPending || completeness === 0}
          size="lg"
          className="px-8"
        >
          {update4D.isPending ? (
            '저장 중...'
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              4차원 프로필 저장
            </>
          )}
        </Button>
      </div>
    </div>
  )
}