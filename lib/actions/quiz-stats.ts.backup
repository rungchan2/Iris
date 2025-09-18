'use server'

import { createClient } from '@/lib/supabase/server'

export interface QuizStats {
  totalSessions: number
  completedSessions: number
  completionRate: number
  averageTime: number
  monthlyGrowth: number
}

export interface PersonalityDistribution {
  code: string
  name: string
  count: number
  percentage: number
  color: string
}

export interface MonthlyData {
  month: string
  sessions: number
  completed: number
  completionRate: number
}

export interface QuestionStats {
  questionId: string
  questionText: string
  averageResponseTime: number
  totalResponses: number
  status: 'excellent' | 'good' | 'needs_improvement'
}

export interface AIImageStats {
  totalRequests: number
  successRate: number
  averageGenerationTime: number
  averageSatisfactionScore: number
}

// 메인 통계 데이터 조회
export async function getQuizStats(): Promise<{
  success: boolean
  stats?: QuizStats
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // 전체 세션 수 조회
    const { count: totalSessions } = await supabase
      .from('quiz_sessions')
      .select('*', { count: 'exact', head: true })
    
    // 완료된 세션 수 조회
    const { count: completedSessions } = await supabase
      .from('quiz_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_completed', true)
    
    // 지난 달 세션 수 (성장률 계산용)
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const { count: lastMonthSessions } = await supabase
      .from('quiz_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString())
    
    // 평균 응답 시간 계산 (완료된 세션만)
    const { data: completedSessionsData } = await supabase
      .from('quiz_sessions')
      .select('started_at, completed_at')
      .eq('is_completed', true)
      .not('completed_at', 'is', null)
      .not('started_at', 'is', null)
    
    let averageTime = 0
    if (completedSessionsData && completedSessionsData.length > 0) {
      const totalTime = completedSessionsData.reduce((sum, session) => {
        if (session.started_at && session.completed_at) {
          const startTime = new Date(session.started_at).getTime()
          const endTime = new Date(session.completed_at).getTime()
          return sum + (endTime - startTime)
        }
        return sum
      }, 0)
      
      averageTime = totalTime / completedSessionsData.length / (1000 * 60) // 분 단위로 변환
    }
    
    const completionRate = totalSessions && totalSessions > 0 
      ? (completedSessions || 0) / totalSessions * 100 
      : 0
    
    const monthlyGrowth = lastMonthSessions && lastMonthSessions > 0
      ? ((totalSessions || 0) - lastMonthSessions) / lastMonthSessions * 100
      : 0
    
    return {
      success: true,
      stats: {
        totalSessions: totalSessions || 0,
        completedSessions: completedSessions || 0,
        completionRate: Math.round(completionRate * 10) / 10,
        averageTime: Math.round(averageTime * 10) / 10,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10
      }
    }
  } catch (error) {
    console.error('Error fetching quiz stats:', error)
    return {
      success: false,
      error: 'Failed to fetch quiz statistics'
    }
  }
}

// 성격유형별 분포 데이터 조회
export async function getPersonalityDistribution(): Promise<{
  success: boolean
  distribution?: PersonalityDistribution[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // 성격유형별 완료된 세션 수 조회
    const { data: personalityData } = await supabase
      .from('quiz_sessions')
      .select(`
        calculated_personality_code,
        personality_types!inner(code, name)
      `)
      .eq('is_completed', true)
      .not('calculated_personality_code', 'is', null)
    
    if (!personalityData) {
      return { success: false, error: 'No personality data found' }
    }
    
    // 성격유형별 카운트 집계
    const countMap = new Map<string, { name: string; count: number }>()
    personalityData.forEach(session => {
      const code = session.calculated_personality_code
      const name = (session.personality_types as any)?.name
      if (code && name) {
        const existing = countMap.get(code) || { name, count: 0 }
        countMap.set(code, { name, count: existing.count + 1 })
      }
    })
    
    const totalCount = personalityData.length
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
      'bg-red-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500', 'bg-yellow-500'
    ]
    
    const distribution: PersonalityDistribution[] = Array.from(countMap.entries())
      .map(([code, data], index) => ({
        code,
        name: data.name,
        count: data.count,
        percentage: Math.round((data.count / totalCount) * 1000) / 10,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.count - a.count) // 내림차순 정렬
    
    return {
      success: true,
      distribution
    }
  } catch (error) {
    console.error('Error fetching personality distribution:', error)
    return {
      success: false,
      error: 'Failed to fetch personality distribution'
    }
  }
}

// 월별 추이 데이터 조회 (최근 6개월)
export async function getMonthlyTrends(): Promise<{
  success: boolean
  monthlyData?: MonthlyData[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const monthlyData: MonthlyData[] = []
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
    
    // 최근 6개월 데이터 조회
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() - i)
      
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59)
      
      // 해당 월의 총 세션 수
      const { count: sessions } = await supabase
        .from('quiz_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
      
      // 해당 월의 완료된 세션 수
      const { count: completed } = await supabase
        .from('quiz_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .eq('is_completed', true)
      
      const sessionCount = sessions || 0
      const completedCount = completed || 0
      const completionRate = sessionCount > 0 ? (completedCount / sessionCount) * 100 : 0
      
      monthlyData.push({
        month: months[targetDate.getMonth()],
        sessions: sessionCount,
        completed: completedCount,
        completionRate: Math.round(completionRate * 10) / 10
      })
    }
    
    return {
      success: true,
      monthlyData
    }
  } catch (error) {
    console.error('Error fetching monthly trends:', error)
    return {
      success: false,
      error: 'Failed to fetch monthly trends'
    }
  }
}

// 질문별 응답 시간 분석
export async function getQuestionStats(): Promise<{
  success: boolean
  questionStats?: QuestionStats[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // 질문별 응답 시간 및 응답 수 조회
    const { data: responseData } = await supabase
      .from('quiz_responses')
      .select(`
        question_id,
        response_time_ms,
        quiz_questions!inner(question_text, part)
      `)
      .not('response_time_ms', 'is', null)
    
    if (!responseData) {
      return { success: false, error: 'No response data found' }
    }
    
    // 질문별 통계 집계
    const statsMap = new Map<string, {
      questionText: string
      responseTimes: number[]
      part: string
    }>()
    
    responseData.forEach(response => {
      const questionId = response.question_id
      const responseTime = response.response_time_ms
      const questionData = response.quiz_questions as any
      
      if (!questionId) return
      
      if (!statsMap.has(questionId)) {
        statsMap.set(questionId, {
          questionText: questionData?.question_text || '',
          responseTimes: [],
          part: questionData?.part || ''
        })
      }
      
      if (responseTime) {
        statsMap.get(questionId)!.responseTimes.push(responseTime)
      }
    })
    
    const questionStats: QuestionStats[] = Array.from(statsMap.entries())
      .map(([questionId, data]) => {
        const averageTime = data.responseTimes.reduce((sum, time) => sum + time, 0) / data.responseTimes.length
        const avgTimeInSeconds = averageTime / 1000
        
        let status: 'excellent' | 'good' | 'needs_improvement'
        if (avgTimeInSeconds <= 3) status = 'excellent'
        else if (avgTimeInSeconds <= 10) status = 'good'
        else status = 'needs_improvement'
        
        return {
          questionId,
          questionText: data.questionText,
          averageResponseTime: Math.round(avgTimeInSeconds * 10) / 10,
          totalResponses: data.responseTimes.length,
          status
        }
      })
      .sort((a, b) => b.totalResponses - a.totalResponses) // 응답 수 기준 내림차순
    
    return {
      success: true,
      questionStats
    }
  } catch (error) {
    console.error('Error fetching question stats:', error)
    return {
      success: false,
      error: 'Failed to fetch question statistics'
    }
  }
}

// AI 이미지 생성 통계 조회
export async function getAIImageStats(): Promise<{
  success: boolean
  aiStats?: AIImageStats
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // AI 이미지 생성 요청 통계
    const { data: aiData } = await supabase
      .from('ai_image_generations')
      .select('generation_status, processing_time_seconds, user_rating')
    
    if (!aiData || aiData.length === 0) {
      return {
        success: true,
        aiStats: {
          totalRequests: 0,
          successRate: 0,
          averageGenerationTime: 0,
          averageSatisfactionScore: 0
        }
      }
    }
    
    const totalRequests = aiData.length
    const successfulRequests = aiData.filter(item => item.generation_status === 'completed').length
    const successRate = (successfulRequests / totalRequests) * 100
    
    // 평균 생성 시간 (완료된 요청만)
    const completedRequests = aiData.filter(item => 
      item.generation_status === 'completed' && item.processing_time_seconds
    )
    const averageGenerationTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, item) => sum + (item.processing_time_seconds || 0), 0) / completedRequests.length
      : 0
    
    // 평균 만족도 (평가된 요청만)
    const ratedRequests = aiData.filter(item => item.user_rating)
    const averageSatisfactionScore = ratedRequests.length > 0
      ? ratedRequests.reduce((sum, item) => sum + (item.user_rating || 0), 0) / ratedRequests.length
      : 0
    
    return {
      success: true,
      aiStats: {
        totalRequests,
        successRate: Math.round(successRate * 10) / 10,
        averageGenerationTime: Math.round(averageGenerationTime * 10) / 10,
        averageSatisfactionScore: Math.round(averageSatisfactionScore * 10) / 10
      }
    }
  } catch (error) {
    console.error('Error fetching AI image stats:', error)
    return {
      success: false,
      error: 'Failed to fetch AI image statistics'
    }
  }
}