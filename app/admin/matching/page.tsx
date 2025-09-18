'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Settings, 
  BarChart3,
  FileQuestion,
  UserCheck,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MatchingDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalQuestions: 0,
    activeQuestions: 0,
    totalPhotographers: 0,
    completedProfiles: 0,
    totalSessions: 0,
    todaySessions: 0,
    pendingEmbeddings: 0,
    averageMatchScore: 0
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadDashboardStats()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardStats = async () => {
    try {
      // Load questions stats
      const { data: questions } = await supabase
        .from('survey_questions')
        .select('id, is_active')
      
      // Load photographer profiles stats
      const { data: profiles } = await supabase
        .from('photographer_profiles')
        .select('photographer_id, profile_completed')
      
      // Load matching sessions stats
      const { data: sessions } = await supabase
        .from('matching_sessions')
        .select('id, created_at')
      
      // Load pending embedding jobs
      const { data: embeddings } = await supabase
        .from('embedding_jobs')
        .select('id')
        .eq('job_status', 'pending')
      
      // Calculate today's sessions
      const today = new Date().toISOString().split('T')[0]
      const todaySessionsCount = sessions?.filter(s => 
        s.created_at?.startsWith(today)
      ).length || 0

      setStats({
        totalQuestions: questions?.length || 0,
        activeQuestions: questions?.filter(q => q.is_active).length || 0,
        totalPhotographers: profiles?.length || 0,
        completedProfiles: profiles?.filter(p => p.profile_completed).length || 0,
        totalSessions: sessions?.length || 0,
        todaySessions: todaySessionsCount,
        pendingEmbeddings: embeddings?.length || 0,
        averageMatchScore: 85 // Placeholder - calculate from matching_results
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: '질문 관리',
      description: '설문 질문 및 선택지 편집',
      icon: FileQuestion,
      href: '/admin/matching/questions',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: '작가 프로필',
      description: '4차원 프로필 관리',
      icon: UserCheck,
      href: '/admin/matching/photographers',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: '성능 분석',
      description: '매칭 통계 및 분석',
      icon: BarChart3,
      href: '/admin/matching/analytics',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: '시스템 설정',
      description: '가중치 및 설정 관리',
      icon: Settings,
      href: '/admin/matching/settings',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">매칭 시스템 관리</h1>
        <p className="text-muted-foreground mt-2">
          10문항 설문 기반 AI 매칭 시스템을 관리합니다.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                활성 질문
              </CardTitle>
              <FileQuestion className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeQuestions}/{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              전체 질문 중 활성화
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                완성된 프로필
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedProfiles}/{stats.totalPhotographers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              작가 프로필 완성률
            </p>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(stats.completedProfiles / stats.totalPhotographers) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                오늘 매칭
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaySessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              총 {stats.totalSessions}건 중
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                평균 매칭률
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageMatchScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              사용자 만족도 기준
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">빠른 작업</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card 
              key={action.href}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(action.href)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-3`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <CardTitle className="text-base">{action.title}</CardTitle>
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            시스템 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.pendingEmbeddings > 0 ? (
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">임베딩 생성 대기 중</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.pendingEmbeddings}개의 작업이 대기 중입니다
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  처리하기
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">모든 시스템 정상</p>
                  <p className="text-sm text-muted-foreground">
                    모든 임베딩이 최신 상태입니다
                  </p>
                </div>
              </div>
            )}

            {stats.completedProfiles < stats.totalPhotographers && (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">미완성 프로필</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.totalPhotographers - stats.completedProfiles}명의 작가 프로필이 미완성 상태입니다
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => router.push('/admin/matching/photographers')}
                >
                  관리하기
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
          <CardDescription>
            시스템 변경사항 및 매칭 활동
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            활동 로그를 불러오는 중...
          </div>
        </CardContent>
      </Card>
    </div>
  )
}