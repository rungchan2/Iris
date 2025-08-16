"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Brain,
  Camera,
  Star,
  Clock,
  Target,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  Filter,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { 
  getAnalyticsData,
  getQuizAnalytics,
  getBookingAnalytics,
  getAIGenerationAnalytics,
  type AnalyticsData,
  type QuizAnalytics,
  type BookingAnalytics,
  type AIGenerationAnalytics
} from "@/lib/actions/analytics";

type TimeRange = '7d' | '30d' | '90d' | '1y';

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  
  // Analytics data states
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [quizAnalytics, setQuizAnalytics] = useState<QuizAnalytics | null>(null);
  const [bookingAnalytics, setBookingAnalytics] = useState<BookingAnalytics | null>(null);
  const [aiAnalytics, setAIAnalytics] = useState<AIGenerationAnalytics | null>(null);

  // 데이터 로드
  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [analyticsResult, quizResult, bookingResult, aiResult] = await Promise.all([
        getAnalyticsData(timeRange),
        getQuizAnalytics(timeRange),
        getBookingAnalytics(timeRange),
        getAIGenerationAnalytics(timeRange)
      ]);

      if (analyticsResult.success) {
        setAnalyticsData(analyticsResult.data || null);
      } else {
        setError(analyticsResult.error || '전체 분석 데이터 로드 실패');
      }

      if (quizResult.success) {
        setQuizAnalytics(quizResult.data || null);
      }

      if (bookingResult.success) {
        setBookingAnalytics(bookingResult.data || null);
      }

      if (aiResult.success) {
        setAIAnalytics(aiResult.data || null);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError('분석 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  // 시간 범위 라벨
  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case '7d': return '최근 7일';
      case '30d': return '최근 30일';
      case '90d': return '최근 90일';
      case '1y': return '최근 1년';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(8).fill(null).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button onClick={loadAnalyticsData} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 컨트롤 */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="기간 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
              <SelectItem value="90d">최근 90일</SelectItem>
              <SelectItem value="1y">최근 1년</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex space-x-2 ml-auto">
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 전체 요약 통계 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 성향 진단</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizAnalytics?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              완료율: {quizAnalytics?.completionRate || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 예약</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingAnalytics?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              완료율: {bookingAnalytics?.completionRate || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI 이미지 생성</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiAnalytics?.totalGenerations || 0}</div>
            <p className="text-xs text-muted-foreground">
              성공률: {aiAnalytics?.successRate || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전환율</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.conversionRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              진단 → 예약 전환
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">전체 개요</TabsTrigger>
          <TabsTrigger value="quiz">성향 진단</TabsTrigger>
          <TabsTrigger value="booking">예약 현황</TabsTrigger>
          <TabsTrigger value="ai">AI 생성</TabsTrigger>
        </TabsList>

        {/* 전체 개요 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  {getTimeRangeLabel(timeRange)} 추이
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">성향 진단</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((quizAnalytics?.totalSessions || 0) / 100 * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{quizAnalytics?.totalSessions || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">예약 문의</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((bookingAnalytics?.totalBookings || 0) / 50 * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{bookingAnalytics?.totalBookings || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI 이미지 생성</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((aiAnalytics?.totalGenerations || 0) / 30 * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{aiAnalytics?.totalGenerations || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  성능 지표
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {quizAnalytics?.completionRate || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">진단 완료율</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {bookingAnalytics?.completionRate || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">예약 완료율</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {aiAnalytics?.successRate || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">AI 생성 성공률</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {analyticsData?.conversionRate || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">전체 전환율</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 성향 진단 분석 */}
        <TabsContent value="quiz" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>성격유형별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quizAnalytics?.personalityDistribution?.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{item.type}</Badge>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{item.count}</span>
                      </div>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>일별 진단 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quizAnalytics?.dailyStats?.map((day, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{day.date}</span>
                      <div className="flex items-center space-x-4">
                        <span>시작: {day.started}</span>
                        <span>완료: {day.completed}</span>
                        <Badge variant={day.completionRate >= 70 ? "default" : "secondary"}>
                          {day.completionRate}%
                        </Badge>
                      </div>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 예약 현황 분석 */}
        <TabsContent value="booking" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>예약 상태별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookingAnalytics?.statusDistribution?.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <span className="text-sm">{status.label}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${status.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{status.count}</span>
                      </div>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>작가별 예약 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookingAnalytics?.adminStats?.map((admin) => (
                    <div key={admin.adminId} className="flex items-center justify-between">
                      <span className="text-sm">{admin.adminName}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(admin.bookings / 10 * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{admin.bookings}</span>
                      </div>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI 생성 분석 */}
        <TabsContent value="ai" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI 생성 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {aiAnalytics?.successfulGenerations || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">성공</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {aiAnalytics?.failedGenerations || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">실패</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {aiAnalytics?.averageProcessingTime || 0}s
                    </div>
                    <p className="text-xs text-muted-foreground">평균 처리시간</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {aiAnalytics?.averageRating || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">평균 만족도</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>성격유형별 AI 생성</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiAnalytics?.personalityGenerations?.map((item) => (
                    <div key={item.personalityType} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{item.personalityType}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(item.count / 5 * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{item.count}</span>
                      </div>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}