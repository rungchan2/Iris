"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Download,
  RefreshCw
} from "lucide-react";
import { 
  getQuizStats, 
  getPersonalityDistribution, 
  getMonthlyTrends, 
  getQuestionStats, 
  getAIImageStats,
  type QuizStats,
  type PersonalityDistribution,
  type MonthlyData,
  type QuestionStats,
  type AIImageStats
} from "@/lib/actions/quiz-stats";

export function QuizStatsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [personalityDistribution, setPersonalityDistribution] = useState<PersonalityDistribution[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStats[]>([]);
  const [aiStats, setAiStats] = useState<AIImageStats | null>(null);

  const loadAllStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 모든 통계 데이터를 병렬로 로드
      const [
        quizStatsResult,
        personalityResult,
        monthlyResult,
        questionResult,
        aiResult
      ] = await Promise.all([
        getQuizStats(),
        getPersonalityDistribution(),
        getMonthlyTrends(),
        getQuestionStats(),
        getAIImageStats()
      ]);

      // 각 결과를 처리
      if (quizStatsResult.success) {
        setStats(quizStatsResult.stats || null);
      } else {
        console.error('Quiz stats error:', quizStatsResult.error);
      }

      if (personalityResult.success) {
        setPersonalityDistribution(personalityResult.distribution || []);
      } else {
        console.error('Personality distribution error:', personalityResult.error);
      }

      if (monthlyResult.success) {
        setMonthlyData(monthlyResult.monthlyData || []);
      } else {
        console.error('Monthly trends error:', monthlyResult.error);
      }

      if (questionResult.success) {
        setQuestionStats(questionResult.questionStats || []);
      } else {
        console.error('Question stats error:', questionResult.error);
      }

      if (aiResult.success) {
        setAiStats(aiResult.aiStats || null);
      } else {
        console.error('AI stats error:', aiResult.error);
      }

    } catch (error) {
      console.error('Error loading statistics:', error);
      setError('통계 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(null).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={loadAllStats} 
                className="mt-4"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">진단 통계</h3>
          <p className="text-sm text-muted-foreground">
            성향 진단 시스템의 사용 현황과 통계를 확인할 수 있습니다.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={loadAllStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 주요 지표 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 진단 세션</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {stats?.monthlyGrowth !== undefined ? (
                stats.monthlyGrowth >= 0 ? `+${stats.monthlyGrowth}%` : `${stats.monthlyGrowth}%`
              ) : '0%'} 지난 달 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료된 진단</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedSessions?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              완료율 {stats?.completionRate || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 소요 시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageTime || 0}분</div>
            <p className="text-xs text-muted-foreground">
              평균 응답 시간
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">중도 포기율</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? (100 - stats.completionRate).toFixed(1) : 0}%</div>
            <p className="text-xs text-muted-foreground">
              미완료 세션 비율
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 성격유형별 분포 */}
      <Card>
        <CardHeader>
          <CardTitle>성격유형별 진단 결과 분포</CardTitle>
          <CardDescription>
            최근 30일간 각 성격유형별 진단 결과 현황
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {personalityDistribution.length > 0 ? (
              personalityDistribution.map((item) => (
                <div key={item.code} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                      {item.code}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.count}명 진단</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <p>진단 결과 데이터가 없습니다.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 월별 추이 */}
      <Card>
        <CardHeader>
          <CardTitle>월별 진단 추이</CardTitle>
          <CardDescription>
            최근 6개월간 진단 세션 및 완료 현황
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.length > 0 ? (
              monthlyData.map((item) => (
                <div key={item.month} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 text-center">
                      <p className="font-medium">{item.month}</p>
                    </div>
                    <div className="flex space-x-6">
                      <div>
                        <p className="text-sm text-muted-foreground">총 세션</p>
                        <p className="font-medium">{item.sessions}개</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">완료</p>
                        <p className="font-medium">{item.completed}개</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">완료율</p>
                        <p className="font-medium">{item.completionRate}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${Math.min(item.completionRate, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <p>월별 데이터가 없습니다.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 상세 분석 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>응답 시간 분석</CardTitle>
            <CardDescription>질문별 평균 응답 시간</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questionStats.length > 0 ? (
                questionStats.slice(0, 5).map((item) => (
                  <div key={item.questionId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium line-clamp-1">{item.questionText}</p>
                      <p className="text-sm text-muted-foreground">
                        평균 {item.averageResponseTime}초 | {item.totalResponses}개 응답
                      </p>
                    </div>
                    <Badge variant={
                      item.status === "excellent" ? "default" : 
                      item.status === "good" ? "secondary" : "destructive"
                    }>
                      {item.status === "excellent" ? "우수" : 
                       item.status === "good" ? "양호" : "개선필요"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Clock className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">응답 시간 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI 이미지 생성 통계</CardTitle>
            <CardDescription>진단 후 AI 이미지 생성 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">AI 이미지 생성 요청</span>
                <span className="font-medium">{aiStats?.totalRequests || 0}회</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">성공률</span>
                <span className="font-medium">{aiStats?.successRate || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">평균 생성 시간</span>
                <span className="font-medium">{aiStats?.averageGenerationTime || 0}초</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">사용자 만족도</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{aiStats?.averageSatisfactionScore || 0}/5.0</span>
                  <Badge variant={
                    (aiStats?.averageSatisfactionScore || 0) >= 4.0 ? "default" : 
                    (aiStats?.averageSatisfactionScore || 0) >= 3.0 ? "secondary" : "destructive"
                  }>
                    {(aiStats?.averageSatisfactionScore || 0) >= 4.0 ? "우수" : 
                     (aiStats?.averageSatisfactionScore || 0) >= 3.0 ? "양호" : "개선필요"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}