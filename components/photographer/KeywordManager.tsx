'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Plus, Tags, Trash2, Star, Target, Camera, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { PhotographerKeyword } from '@/types/matching.types'

interface KeywordManagerProps {
  photographerId: string
}

const KEYWORD_CATEGORIES = {
  'style': {
    label: '촬영 스타일',
    icon: Palette,
    color: 'blue',
    keywords: [
      '자연스러운', '감성적인', '로맨틱', '모던', '빈티지', '미니멀', 
      '드라마틱', '클래식', '아트워크', '다큐멘터리', '패션', '라이프스타일'
    ]
  },
  'location': {
    label: '촬영 장소',
    icon: Target,
    color: 'green',
    keywords: [
      '스튜디오', '야외', '카페', '바다', '산', '공원', '도심', '골목길',
      '한옥', '건물 옥상', '갤러리', '호텔', '펜션', '해변', '숲'
    ]
  },
  'technique': {
    label: '촬영 기법',
    icon: Camera,
    color: 'purple',
    keywords: [
      '자연광', '스트로브', '백라이팅', '실루엣', '보케', '장노출',
      '흑백 사진', '컬러 그레이딩', '틸트 시프트', 'HDR', '파노라마'
    ]
  },
  'specialty': {
    label: '전문 분야',
    icon: Star,
    color: 'orange',
    keywords: [
      '웨딩', '약혼', '가족사진', '신생아', '임산부', '프로필', '펫',
      '졸업사진', '커플', '개인 브랜딩', '기업 행사', '돌잔치'
    ]
  }
}

const PROFICIENCY_LABELS = {
  1: { label: '기초', color: 'bg-gray-100 text-gray-700' },
  2: { label: '숙련', color: 'bg-blue-100 text-blue-700' },
  3: { label: '전문', color: 'bg-purple-100 text-purple-700' },
  4: { label: '마스터', color: 'bg-orange-100 text-orange-700' },
  5: { label: '최고', color: 'bg-red-100 text-red-700' }
}

export default function KeywordManager({ photographerId }: KeywordManagerProps) {
  const [keywords, setKeywords] = useState<PhotographerKeyword[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [newProficiency, setNewProficiency] = useState([3])
  const [selectedCategory, setSelectedCategory] = useState<string>('style')
  const supabase = createClient()

  useEffect(() => {
    loadKeywords()
  }, [photographerId])

  const loadKeywords = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('photographer_keywords')
        .select('*')
        .eq('photographer_id', photographerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setKeywords(data || [])
    } catch (error) {
      console.error('Error loading keywords:', error)
      toast.error('키워드를 불러오는 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleAddKeyword = async (keyword?: string) => {
    const keywordToAdd = keyword || newKeyword.trim()
    
    if (!keywordToAdd) {
      toast.error('키워드를 입력해주세요')
      return
    }

    if (keywords.some(k => k.keyword.toLowerCase() === keywordToAdd.toLowerCase())) {
      toast.error('이미 등록된 키워드입니다')
      return
    }

    try {
      setSaving(true)
      const { data, error } = await supabase
        .from('photographer_keywords')
        .insert({
          photographer_id: photographerId,
          keyword: keywordToAdd,
          proficiency_level: newProficiency[0]
        })
        .select()
        .single()

      if (error) throw error

      setKeywords(prev => [data, ...prev])
      setNewKeyword('')
      setNewProficiency([3])
      toast.success('키워드가 추가되었습니다')
    } catch (error) {
      console.error('Error adding keyword:', error)
      toast.error('키워드 추가 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateProficiency = async (keyword: string, proficiency: number) => {
    try {
      const { error } = await supabase
        .from('photographer_keywords')
        .update({ proficiency_level: proficiency })
        .eq('photographer_id', photographerId)
        .eq('keyword', keyword)

      if (error) throw error

      setKeywords(prev => 
        prev.map(k => 
          k.keyword === keyword 
            ? { ...k, proficiency_level: proficiency }
            : k
        )
      )
      toast.success('숙련도가 업데이트되었습니다')
    } catch (error) {
      console.error('Error updating proficiency:', error)
      toast.error('숙련도 업데이트 중 오류가 발생했습니다')
    }
  }

  const handleDeleteKeyword = async (keyword: string) => {
    try {
      const { error } = await supabase
        .from('photographer_keywords')
        .delete()
        .eq('photographer_id', photographerId)
        .eq('keyword', keyword)

      if (error) throw error

      setKeywords(prev => prev.filter(k => k.keyword !== keyword))
      toast.success('키워드가 삭제되었습니다')
    } catch (error) {
      console.error('Error deleting keyword:', error)
      toast.error('키워드 삭제 중 오류가 발생했습니다')
    }
  }

  const getKeywordsByCategory = () => {
    const categorizedKeywords: { [key: string]: PhotographerKeyword[] } = {}
    
    Object.keys(KEYWORD_CATEGORIES).forEach(category => {
      categorizedKeywords[category] = keywords.filter(keyword => 
        KEYWORD_CATEGORIES[category as keyof typeof KEYWORD_CATEGORIES].keywords
          .some(catKeyword => 
            keyword.keyword.toLowerCase().includes(catKeyword.toLowerCase()) ||
            catKeyword.toLowerCase().includes(keyword.keyword.toLowerCase())
          )
      )
    })
    
    // Uncategorized keywords
    const categorizedKeywordIds = Object.values(categorizedKeywords).flat().map(k => k.keyword)
    categorizedKeywords['other'] = keywords.filter(k => !categorizedKeywordIds.includes(k.keyword))
    
    return categorizedKeywords
  }

  const categorizedKeywords = getKeywordsByCategory()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">키워드를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg">
              <Tags className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl">전문 키워드</CardTitle>
              <CardDescription>
                당신의 전문 분야와 스킬을 키워드로 표현해주세요
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(KEYWORD_CATEGORIES).map(([key, category]) => {
              const IconComponent = category.icon
              const categoryKeywords = categorizedKeywords[key] || []
              
              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCategory === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCategory(key)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <IconComponent className={`h-4 w-4 text-${category.color}-600`} />
                    <span className="text-sm font-medium">{category.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {categoryKeywords.length}개 키워드
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add New Keyword */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">새 키워드 추가</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Add from Category */}
          {selectedCategory && selectedCategory !== 'other' && (
            <div>
              <Label className="text-sm font-medium mb-2 block">
                {KEYWORD_CATEGORIES[selectedCategory as keyof typeof KEYWORD_CATEGORIES].label} 추천 키워드
              </Label>
              <div className="flex flex-wrap gap-2">
                {KEYWORD_CATEGORIES[selectedCategory as keyof typeof KEYWORD_CATEGORIES].keywords
                  .filter(keyword => !keywords.some(k => k.keyword.toLowerCase() === keyword.toLowerCase()))
                  .slice(0, 8)
                  .map(keyword => (
                    <Button
                      key={keyword}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddKeyword(keyword)}
                      disabled={saving}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {keyword}
                    </Button>
                  ))}
              </div>
            </div>
          )}

          {/* Custom Keyword Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="new-keyword">직접 입력</Label>
              <Input
                id="new-keyword"
                placeholder="예: 웨딩촬영, 자연광촬영, 감성사진..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
            </div>
            
            <div className="space-y-2">
              <Label>숙련도 레벨</Label>
              <div className="px-3">
                <Slider
                  value={newProficiency}
                  onValueChange={setNewProficiency}
                  max={5}
                  min={1}
                  step={1}
                  className="mb-2"
                />
                <div className="flex justify-center">
                  <Badge className={PROFICIENCY_LABELS[newProficiency[0] as keyof typeof PROFICIENCY_LABELS].color}>
                    {PROFICIENCY_LABELS[newProficiency[0] as keyof typeof PROFICIENCY_LABELS].label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => handleAddKeyword()} 
            disabled={saving || !newKeyword.trim()}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            키워드 추가
          </Button>
        </CardContent>
      </Card>

      {/* Keywords List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            내 전문 키워드
            <Badge variant="secondary">{keywords.length}개</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {keywords.length === 0 ? (
            <div className="text-center py-8">
              <Tags className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">아직 등록된 키워드가 없습니다</p>
              <p className="text-sm text-gray-500">
                전문 분야와 스킬을 키워드로 추가해보세요
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(categorizedKeywords).map(([categoryKey, categoryKeywords]) => {
                if (categoryKeywords.length === 0) return null
                
                const category = categoryKey === 'other' 
                  ? { label: '기타', icon: Tags, color: 'gray' }
                  : KEYWORD_CATEGORIES[categoryKey as keyof typeof KEYWORD_CATEGORIES]
                
                const IconComponent = category.icon

                return (
                  <div key={categoryKey}>
                    <div className="flex items-center gap-2 mb-3">
                      <IconComponent className={`h-4 w-4 text-${category.color}-600`} />
                      <h4 className="font-medium text-gray-900">{category.label}</h4>
                      <Badge variant="outline" className="text-xs">
                        {categoryKeywords.length}개
                      </Badge>
                    </div>
                    
                    <div className="grid gap-3">
                      {categoryKeywords.map(keyword => (
                        <div
                          key={keyword.keyword}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{keyword.keyword}</span>
                            <Badge className={PROFICIENCY_LABELS[(keyword.proficiency_level || 1) as keyof typeof PROFICIENCY_LABELS].color}>
                              {PROFICIENCY_LABELS[(keyword.proficiency_level || 1) as keyof typeof PROFICIENCY_LABELS].label}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="w-24">
                              <Slider
                                value={[keyword.proficiency_level || 1]}
                                onValueChange={([value]) => handleUpdateProficiency(keyword.keyword, value)}
                                max={5}
                                min={1}
                                step={1}
                              />
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteKeyword(keyword.keyword)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}