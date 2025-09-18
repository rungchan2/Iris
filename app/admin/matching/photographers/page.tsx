'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import { 
  Camera, Users, TrendingUp, Search, 
  CheckCircle, AlertCircle, User, MapPin, Crown, 
  Zap, Loader2, RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PhotographerProfile {
  id: string
  name: string
  email: string
  approval_status: string
  bio?: string
  price_range_min?: number
  price_range_max?: number
  profile_completed: boolean
  photographer_profiles?: {
    service_regions: string[]
    style_emotion_description?: string
    communication_psychology_description?: string
    purpose_story_description?: string
    companion_description?: string
    profile_completed: boolean
    embeddings_generated_at?: string
  } | null
  photographer_keywords?: Array<{
    keyword: string
    proficiency_level: number
  }> | null
  created_at: string
}

interface ProfileStats {
  totalPhotographers: number
  completedProfiles: number
  matchingActive: number
  avgCompletionRate: number
}

export default function PhotographerManagementPage() {
  const [photographers, setPhotographers] = useState<PhotographerProfile[]>([])
  const [stats, setStats] = useState<ProfileStats>({
    totalPhotographers: 0,
    completedProfiles: 0,
    matchingActive: 0,
    avgCompletionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'incomplete'>('all')
  const [selectedPhotographer, setSelectedPhotographer] = useState<string | null>(null)
  const [embeddingLoading, setEmbeddingLoading] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchPhotographers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPhotographers = async () => {
    try {
      const { data, error } = await supabase
        .from('photographers')
        .select(`
          id,
          name,
          email,
          approval_status,
          bio,
          price_range_min,
          price_range_max,
          profile_completed,
          created_at,
          photographer_profiles(
            service_regions,
            style_emotion_description,
            communication_psychology_description,
            purpose_story_description,
            companion_description,
            profile_completed,
            embeddings_generated_at
          ),
          photographer_keywords(
            keyword,
            proficiency_level
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPhotographers(data as PhotographerProfile[] || [])
      calculateStats(data as PhotographerProfile[] || [])
    } catch (error) {
      console.error('Error fetching photographers:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: PhotographerProfile[]) => {
    const total = data.length
    const completed = data.filter(p => p.photographer_profiles?.profile_completed === true).length
    const matching = data.filter(p => 
      p.photographer_profiles?.profile_completed === true && 
      p.approval_status === 'approved'
    ).length
    
    setStats({
      totalPhotographers: total,
      completedProfiles: completed,
      matchingActive: matching,
      avgCompletionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    })
  }

  const getProfileCompleteness = (photographer: PhotographerProfile): number => {
    const profile = photographer.photographer_profiles
    if (!profile) return 0

    let score = 0
    if (profile.style_emotion_description) score += 25
    if (profile.communication_psychology_description) score += 25
    if (profile.purpose_story_description) score += 25
    if (profile.companion_description) score += 25

    return score
  }

  // 개별 작가 임베딩 생성
  const generatePhotographerEmbedding = async (photographerId: string) => {
    setEmbeddingLoading(photographerId)
    
    try {
      // 임베딩 작업을 큐에 추가
      const { error: jobError } = await supabase
        .from('embedding_jobs')
        .insert({
          job_type: 'photographer_profile',
          target_id: photographerId,
          job_status: 'pending'
        })

      if (jobError) throw jobError

      // 즉시 생성 API 호출
      const response = await fetch('/api/admin/matching/embeddings/photographer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photographerId: photographerId
        })
      })

      if (!response.ok) {
        throw new Error('임베딩 생성에 실패했습니다')
      }

      const result = await response.json()
      
      toast.success("임베딩 생성 완료", {
        description: result.message || '4차원 프로필 임베딩이 생성되었습니다.'
      })

      // 데이터 새로고침
      await fetchPhotographers()
      
    } catch (error) {
      console.error('Embedding generation error:', error)
      toast.error("임베딩 생성 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      })
    } finally {
      setEmbeddingLoading(null)
    }
  }

  // 전체 작가 임베딩 일괄 생성
  const generateAllEmbeddings = async () => {
    setEmbeddingLoading('all')
    
    try {
      const incompletePhotographers = photographers.filter(p => 
        p.photographer_profiles && 
        !p.photographer_profiles.embeddings_generated_at &&
        p.photographer_profiles.profile_completed
      )

      if (incompletePhotographers.length === 0) {
        toast.info("생성할 임베딩 없음", {
          description: "모든 작가의 임베딩이 이미 생성되었거나 프로필이 완성되지 않았습니다."
        })
        setEmbeddingLoading(null)
        return
      }

      // 각 작가에 대해 임베딩 작업 생성
      for (const photographer of incompletePhotographers) {
        await supabase
          .from('embedding_jobs')
          .insert({
            job_type: 'photographer_profile',
            target_id: photographer.id,
            job_status: 'pending'
          })
      }

      // 배치 처리 API 호출
      const response = await fetch('/api/admin/matching/embeddings/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('일괄 임베딩 생성에 실패했습니다')
      }

      toast.success("일괄 임베딩 생성 시작", {
        description: `${incompletePhotographers.length}명의 작가 임베딩 생성이 시작되었습니다.`
      })

      // 주기적으로 상태 확인
      const checkInterval = setInterval(async () => {
        await fetchPhotographers()
        
        // 모든 임베딩이 생성되었는지 확인
        const { data: pendingJobs } = await supabase
          .from('embedding_jobs')
          .select('id')
          .eq('job_status', 'pending')
          .eq('job_type', 'photographer_profile')

        if (!pendingJobs || pendingJobs.length === 0) {
          clearInterval(checkInterval)
          setEmbeddingLoading(null)
          toast.success("일괄 임베딩 생성 완료", {
            description: "모든 작가의 임베딩 생성이 완료되었습니다."
          })
        }
      }, 3000)

      // 최대 5분 후 자동 종료
      setTimeout(() => {
        clearInterval(checkInterval)
        setEmbeddingLoading(null)
      }, 300000)
      
    } catch (error) {
      console.error('Batch embedding generation error:', error)
      toast.error("일괄 임베딩 생성 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      })
      setEmbeddingLoading(null)
    }
  }

  const filteredPhotographers = photographers.filter(photographer => {
    const matchesSearch = photographer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photographer.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    if (filterStatus === 'completed') {
      return photographer.photographer_profiles?.profile_completed === true
    } else if (filterStatus === 'incomplete') {
      return photographer.photographer_profiles?.profile_completed !== true
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <AdminBreadcrumb />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <AdminBreadcrumb />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">작가 프로필 관리</h2>
          <p className="text-muted-foreground">
            매칭 시스템에 등록된 작가들의 4차원 프로필을 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateAllEmbeddings}
            disabled={embeddingLoading === 'all'}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            type="button"
          >
            {embeddingLoading === 'all' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                임베딩 생성 중...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                전체 임베딩 생성
              </>
            )}
          </Button>
          <Button onClick={fetchPhotographers} variant="outline" type="button">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 작가</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPhotographers}</div>
            <p className="text-xs text-muted-foreground">
              등록된 작가 수
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">프로필 완성률</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              4차원 프로필 완성도
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">매칭 활성화</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matchingActive}</div>
            <p className="text-xs text-muted-foreground">
              매칭 가능한 작가
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완성된 프로필</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedProfiles}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPhotographers}명 중
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="작가 이름 또는 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            size="sm"
            type="button"
          >
            전체
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('completed')}
            size="sm"
            type="button"
          >
            완성
          </Button>
          <Button
            variant={filterStatus === 'incomplete' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('incomplete')}
            size="sm"
            type="button"
          >
            미완성
          </Button>
        </div>
      </div>

      {/* Photographer List */}
      <Card>
        <CardHeader>
          <CardTitle>작가 목록</CardTitle>
          <CardDescription>
            총 {filteredPhotographers.length}명의 작가가 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPhotographers.map((photographer) => {
              const completeness = getProfileCompleteness(photographer)
              const profile = photographer.photographer_profiles
              
              return (
                <div
                  key={photographer.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setSelectedPhotographer(
                      selectedPhotographer === photographer.id ? null : photographer.id
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{photographer.name}</h3>
                          <Badge variant={photographer.approval_status === 'approved' ? 'default' : 'secondary'}>
                            {photographer.approval_status === 'approved' ? '승인됨' : '대기중'}
                          </Badge>
                          {profile?.profile_completed && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              완성
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{photographer.email}</p>
                        
                        <div className="mt-2 flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">4차원 프로필</span>
                              <span className="text-xs text-muted-foreground">{completeness}%</span>
                            </div>
                            <Progress value={completeness} className="h-1.5" />
                          </div>
                          
                          {profile?.service_regions && profile.service_regions.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {profile.service_regions.length}개 지역
                              </span>
                            </div>
                          )}
                          
                          {photographer.photographer_keywords && photographer.photographer_keywords.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Crown className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {photographer.photographer_keywords.length}개 키워드
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {completeness === 100 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedPhotographer === photographer.id && (
                    <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                      <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="profile">4차원 프로필</TabsTrigger>
                          <TabsTrigger value="keywords">키워드</TabsTrigger>
                          <TabsTrigger value="settings">설정</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="profile" className="mt-4 space-y-4">
                          {profile ? (
                            <div className="grid gap-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">스타일/감성 (40%)</h4>
                                    {profile.style_emotion_description ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-orange-500" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {profile.style_emotion_description || '작성되지 않음'}
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">소통/심리 (30%)</h4>
                                    {profile.communication_psychology_description ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-orange-500" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {profile.communication_psychology_description || '작성되지 않음'}
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">목적/스토리 (20%)</h4>
                                    {profile.purpose_story_description ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-orange-500" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {profile.purpose_story_description || '작성되지 않음'}
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">동반자 관계 (10%)</h4>
                                    {profile.companion_description ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-orange-500" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {profile.companion_description || '작성되지 않음'}
                                  </p>
                                </div>
                              </div>
                              
                              {profile.embeddings_generated_at ? (
                                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-green-800">
                                      임베딩 생성 완료: {new Date(profile.embeddings_generated_at).toLocaleString('ko-KR')}
                                    </p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => generatePhotographerEmbedding(photographer.id)}
                                      disabled={embeddingLoading === photographer.id}
                                      className="text-xs"
                                      type="button"
                                    >
                                      {embeddingLoading === photographer.id ? (
                                        <>
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          재생성 중
                                        </>
                                      ) : (
                                        <>
                                          <RefreshCw className="h-3 w-3 mr-1" />
                                          재생성
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-orange-800">
                                      임베딩이 생성되지 않았습니다
                                    </p>
                                    <Button
                                      size="sm"
                                      onClick={() => generatePhotographerEmbedding(photographer.id)}
                                      disabled={embeddingLoading === photographer.id || !profile.profile_completed}
                                      className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                      type="button"
                                    >
                                      {embeddingLoading === photographer.id ? (
                                        <>
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          생성 중
                                        </>
                                      ) : (
                                        <>
                                          <Zap className="h-3 w-3 mr-1" />
                                          임베딩 생성
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                  {!profile.profile_completed && (
                                    <p className="text-xs text-orange-600 mt-2">
                                      ※ 4차원 프로필을 모두 작성해야 임베딩을 생성할 수 있습니다
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">4차원 프로필이 작성되지 않았습니다.</p>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="keywords" className="mt-4">
                          {photographer.photographer_keywords && photographer.photographer_keywords.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {photographer.photographer_keywords.map((kw, index) => (
                                <Badge key={index} variant="outline">
                                  {kw.keyword} (Lv.{kw.proficiency_level})
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">등록된 키워드가 없습니다.</p>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="settings" className="mt-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">서비스 지역</h4>
                              {profile?.service_regions && profile.service_regions.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {profile.service_regions.map((region, index) => (
                                    <Badge key={index} variant="secondary">{region}</Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">설정된 서비스 지역이 없습니다.</p>
                              )}
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">가격 범위</h4>
                              <p className="text-sm text-muted-foreground">
                                {photographer.price_range_min?.toLocaleString()}원 - {photographer.price_range_max?.toLocaleString()}원
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">자기소개</h4>
                              <p className="text-sm text-muted-foreground">
                                {photographer.bio || '작성되지 않음'}
                              </p>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </div>
              )
            })}
            
            {filteredPhotographers.length === 0 && (
              <div className="text-center py-8">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">작가가 없습니다</h3>
                <p className="text-muted-foreground">
                  검색 조건에 맞는 작가를 찾을 수 없습니다.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}