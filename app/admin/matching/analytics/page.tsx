'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Users, 
  BarChart3, 
  Activity,
  Zap,
  Database
} from 'lucide-react'

export default function MatchingAnalyticsPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <AdminBreadcrumb />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">매칭 성능 분석</h2>
          <p className="text-muted-foreground">
            AI 매칭 시스템의 성능과 정확도를 분석합니다
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">매칭 정확도</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              지난 30일 평균
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">응답 시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2초</div>
            <p className="text-xs text-muted-foreground">
              평균 매칭 계산 시간
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">매칭 세션</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              이번 주 완료된 매칭
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">사용자 만족도</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.7/5.0</div>
            <p className="text-xs text-muted-foreground">
              매칭 결과 평점
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Matching Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              4차원 매칭 성능
            </CardTitle>
            <CardDescription>
              각 차원별 매칭 정확도와 가중치 효과
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">스타일/감성 (40%)</span>
                <span className="text-sm text-muted-foreground">96%</span>
              </div>
              <Progress value={96} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">소통/심리 (30%)</span>
                <span className="text-sm text-muted-foreground">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">목적/스토리 (20%)</span>
                <span className="text-sm text-muted-foreground">88%</span>
              </div>
              <Progress value={88} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">동반자 (10%)</span>
                <span className="text-sm text-muted-foreground">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* System Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              시스템 성능
            </CardTitle>
            <CardDescription>
              매칭 시스템의 기술적 성능 지표
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">임베딩 DB 크기</span>
              </div>
              <span className="text-sm text-muted-foreground">2.4GB</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">벡터 검색 성능</span>
              </div>
              <span className="text-sm text-muted-foreground">~250ms</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">캐시 적중률</span>
              </div>
              <span className="text-sm text-muted-foreground">87%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">API 응답률</span>
              </div>
              <span className="text-sm text-muted-foreground">99.8%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>상세 분석 도구</CardTitle>
          <CardDescription>
            매칭 성능을 깊이 있게 분석할 수 있는 도구들
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">분석 기능</h3>
            <p className="text-muted-foreground mb-4">
              다음과 같은 상세 분석 도구들이 제공됩니다:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
              <div className="space-y-2">
                <h4 className="font-medium">• A/B 테스트 결과</h4>
                <h4 className="font-medium">• 가중치 최적화 히스토리</h4>
                <h4 className="font-medium">• 사용자 피드백 분석</h4>
                <h4 className="font-medium">• 매칭 실패 케이스 분석</h4>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">• 질문별 응답 분포</h4>
                <h4 className="font-medium">• 작가별 매칭 빈도</h4>
                <h4 className="font-medium">• 시간대별 사용 패턴</h4>
                <h4 className="font-medium">• 성능 최적화 제안</h4>
              </div>
            </div>
            <Button className="mt-6">
              개발 예정
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}