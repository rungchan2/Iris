'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import BasicProfileEditor from '@/components/photographer/BasicProfileEditor'
import FourDimensionProfileEditor from '@/components/photographer/FourDimensionProfileEditor'
import KeywordManager from '@/components/photographer/KeywordManager'
import { 
  User, 
  Brain, 
  Tags, 
  CheckCircle,
  AlertCircle,
  Zap,
  Target,
  Camera
} from 'lucide-react'
import { toast } from 'sonner'

interface PhotographerProfile {
  photographer_id: string
  service_regions: string[]
  price_min: number
  price_max: number
  companion_types: string[]
  style_emotion_description?: string
  communication_psychology_description?: string
  purpose_story_description?: string
  companion_description?: string
  profile_completed: boolean
  embeddings_generated_at?: string
}

export default function PhotographerProfilePage() {
  const [profile, setProfile] = useState<PhotographerProfile | null>(null)
  const [photographer, setPhotographer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndLoadProfile()
  }, [])

  const checkAuthAndLoadProfile = async () => {
    try {
      // Check authentication
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !authUser) {
        router.push('/login')
        return
      }

      setUser(authUser)

      // Check if user is a photographer
      const { data: photographerData, error: photographerError } = await supabase
        .from('photographers')
        .select('*')
        .eq('email', authUser.email!)
        .single()

      if (photographerError || !photographerData) {
        toast.error('작가 계정을 찾을 수 없습니다')
        router.push('/')
        return
      }

      setPhotographer(photographerData)

      // Load photographer profile
      const { data: profileData, error: profileError } = await supabase
        .from('photographer_profiles')
        .select('*')
        .eq('photographer_id', photographerData.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError)
        toast.error('프로필을 불러오는 중 오류가 발생했습니다')
        return
      }

      if (profileData) {
        setProfile(profileData as any)
      } else {
        // Create default profile if doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('photographer_profiles')
          .insert({
            photographer_id: photographerData.id,
            service_regions: [],
            price_min: 100000,
            price_max: 500000,
            companion_types: [],
            profile_completed: false
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
          toast.error('프로필 생성 중 오류가 발생했습니다')
          return
        }

        setProfile(newProfile as any)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('예상치 못한 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const calculateCompleteness = () => {
    if (!profile) return 0

    let completed = 0
    const total = 8

    // Basic info (4 items)
    if (profile.service_regions && profile.service_regions.length > 0) completed++
    if (profile.price_min && profile.price_max) completed++
    if (profile.companion_types && profile.companion_types.length > 0) completed++
    if (photographer?.bio) completed++

    // 4D descriptions (4 items)
    if (profile.style_emotion_description) completed++
    if (profile.communication_psychology_description) completed++
    if (profile.purpose_story_description) completed++
    if (profile.companion_description) completed++

    return (completed / total) * 100
  }

  const handleProfileUpdate = (updatedProfile: PhotographerProfile) => {
    setProfile(updatedProfile)
  }

  const generateEmbeddings = async () => {
    if (!profile) return

    try {
      toast.info('AI 매칭을 위한 프로필 분석을 시작합니다...')

      const response = await fetch('/api/admin/matching/embeddings/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'photographer_profile',
          targetId: profile.photographer_id
        })
      })

      if (!response.ok) throw new Error('Failed to queue embedding job')

      toast.success('프로필 분석이 요청되었습니다. 곧 매칭 시스템에 반영됩니다.')
    } catch (error) {
      console.error('Error generating embeddings:', error)
      toast.error('프로필 분석 요청 중 오류가 발생했습니다')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!profile || !photographer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">프로필을 불러올 수 없습니다</p>
          <Button onClick={() => router.push('/')}>
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  const completeness = calculateCompleteness()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                프로필 관리
              </h1>
              <p className="text-gray-600 mt-2">
                AI 매칭 시스템을 위한 상세 프로필을 작성해보세요
              </p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">완성도</span>
                <Badge variant={completeness === 100 ? 'default' : 'secondary'}>
                  {Math.round(completeness)}%
                </Badge>
              </div>
              <Progress value={completeness} className="w-32" />
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">기본 정보</p>
                  <p className="text-sm text-gray-600">
                    {profile.service_regions?.length || 0}개 지역, ₩{(profile.price_min / 10000).toFixed(0)}만원~
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">4차원 프로필</p>
                  <p className="text-sm text-gray-600">
                    {[
                      profile.style_emotion_description,
                      profile.communication_psychology_description,
                      profile.purpose_story_description,
                      profile.companion_description
                    ].filter(Boolean).length}/4 완성
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">매칭 상태</p>
                  <div className="flex items-center gap-1">
                    {profile.embeddings_generated_at ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">활성</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-600">대기</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completion Alert */}
        {completeness < 100 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">
                    프로필을 완성해주세요
                  </h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    프로필이 완성되면 AI 매칭 시스템에서 고객들에게 추천될 수 있습니다.
                    모든 항목을 작성해주세요.
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {!profile.service_regions?.length && <li>• 서비스 지역을 선택해주세요</li>}
                    {!photographer?.bio && <li>• 자기소개를 작성해주세요</li>}
                    {!profile.style_emotion_description && <li>• 스타일/감성 설명을 작성해주세요</li>}
                    {!profile.communication_psychology_description && <li>• 소통/심리 설명을 작성해주세요</li>}
                    {!profile.purpose_story_description && <li>• 목적/스토리 설명을 작성해주세요</li>}
                    {!profile.companion_description && <li>• 동반자 관련 설명을 작성해주세요</li>}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">기본 정보</TabsTrigger>
            <TabsTrigger value="4d-profile">4차원 프로필</TabsTrigger>
            <TabsTrigger value="keywords">전문 키워드</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicProfileEditor
              photographer={photographer}
              profile={profile}
              onUpdate={handleProfileUpdate}
            />
          </TabsContent>

          <TabsContent value="4d-profile">
            <FourDimensionProfileEditor
              profile={profile}
              onUpdate={handleProfileUpdate}
            />
          </TabsContent>

          <TabsContent value="keywords">
            <KeywordManager
              photographerId={photographer.id}
            />
          </TabsContent>
        </Tabs>

        {/* AI Analysis Button */}
        {completeness === 100 && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold">AI 매칭 분석</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  프로필이 완성되었습니다! AI가 당신의 프로필을 분석하여 
                  적합한 고객들에게 추천할 수 있도록 준비하세요.
                </p>
                <Button onClick={generateEmbeddings} size="lg">
                  <Zap className="h-4 w-4 mr-2" />
                  AI 분석 시작하기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}