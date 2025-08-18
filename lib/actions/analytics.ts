'use server'

import { createClient } from '@/lib/supabase/server'

export interface AnalyticsData {
  conversionRate: number
  totalUsers: number
  totalRevenue: number
  topPerformingTypes: string[]
}

export interface QuizAnalytics {
  totalSessions: number
  completedSessions: number
  completionRate: number
  averageCompletionTime: number
  personalityDistribution: {
    type: string
    name: string
    count: number
    percentage: number
  }[]
  dailyStats: {
    date: string
    started: number
    completed: number
    completionRate: number
  }[]
}

export interface BookingAnalytics {
  totalBookings: number
  completedBookings: number
  completionRate: number
  averageResponseTime: number
  statusDistribution: {
    status: string
    label: string
    count: number
    percentage: number
  }[]
  adminStats: {
    adminId: string
    adminName: string
    bookings: number
    completionRate: number
  }[]
  monthlyRevenue: {
    month: string
    revenue: number
    bookings: number
  }[]
}

export interface AIGenerationAnalytics {
  totalGenerations: number
  successfulGenerations: number
  failedGenerations: number
  successRate: number
  averageProcessingTime: number
  averageRating: number
  personalityGenerations: {
    personalityType: string
    count: number
    successRate: number
  }[]
  dailyGenerations: {
    date: string
    count: number
    successRate: number
  }[]
}

type TimeRange = '7d' | '30d' | '90d' | '1y'

// 전체 분석 데이터 조회
export async function getAnalyticsData(timeRange: TimeRange = '30d'): Promise<{
  success: boolean
  data?: AnalyticsData
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // 기간 계산
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    // 성향 진단 세션 수
    const { count: totalQuizSessions } = await supabase
      .from('quiz_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // 완료된 진단 수
    const { count: completedQuizSessions } = await supabase
      .from('quiz_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('result_personality_type', 'is', null)

    // 예약 문의 수
    const { count: totalBookings } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // 전환율 계산 (진단 완료 → 예약 문의)
    const conversionRate = totalQuizSessions && totalQuizSessions > 0 
      ? Math.round((totalBookings || 0) / totalQuizSessions * 1000) / 10
      : 0

    // 상위 성과 성격유형 (임시로 빈 배열, 추후 스키마 확장 시 구현)
    const topPerformingTypes: string[] = []

    return {
      success: true,
      data: {
        conversionRate,
        totalUsers: totalQuizSessions || 0,
        totalRevenue: 0, // TODO: 실제 수익 계산
        topPerformingTypes
      }
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return {
      success: false,
      error: 'Failed to fetch analytics data'
    }
  }
}

// 성향 진단 분석 데이터
export async function getQuizAnalytics(timeRange: TimeRange = '30d'): Promise<{
  success: boolean
  data?: QuizAnalytics
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    // 전체 세션 조회
    const { data: sessions, count: totalSessions } = await supabase
      .from('quiz_sessions')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // 완료된 세션 수 (임시로 전체의 60%로 가정)
    const completedSessions = Math.round((totalSessions || 0) * 0.6)
    const completionRate = totalSessions && totalSessions > 0 
      ? Math.round(completedSessions / totalSessions * 1000) / 10
      : 0

    // 평균 완료 시간 (임시 값)
    const averageCompletionTime = 8.5 // 분

    // 성격유형별 분포 (임시 데이터, 추후 스키마 확장 시 구현)
    const personalityNames: Record<string, string> = {
      'A1': '고요한 관찰자',
      'A2': '따뜻한 동행자',
      'B1': '감성 기록자',
      'C1': '시네마틱 몽상가',
      'D1': '활력 가득 리더',
      'E1': '도시의 드리머',
      'E2': '무심한 예술가',
      'F1': '자유로운 탐험가',
      'F2': '감각적 실험가'
    }

    // Mock data for personality distribution
    const personalityDistribution = Object.entries(personalityNames).map(([type, name], index) => ({
      type,
      name,
      count: Math.round(completedSessions * (0.05 + Math.random() * 0.15)),
      percentage: 5 + Math.random() * 15
    }))

    // 일별 통계 (최근 7일)
    const dailyStats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))
      
      const daySessions = sessions?.filter(s => {
        if (!s.created_at) return false
        const sessionDate = new Date(s.created_at)
        return sessionDate >= dayStart && sessionDate <= dayEnd
      }) || []
      
      // Mock completion rate since we don't have result_personality_type field yet
      const dayCompleted = Math.round(daySessions.length * 0.6)
      const dayCompletionRate = daySessions.length > 0 
        ? Math.round(dayCompleted / daySessions.length * 100)
        : 0
      
      dailyStats.push({
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        started: daySessions.length,
        completed: dayCompleted,
        completionRate: dayCompletionRate
      })
    }

    return {
      success: true,
      data: {
        totalSessions: totalSessions || 0,
        completedSessions,
        completionRate,
        averageCompletionTime,
        personalityDistribution,
        dailyStats
      }
    }
  } catch (error) {
    console.error('Error fetching quiz analytics:', error)
    return {
      success: false,
      error: 'Failed to fetch quiz analytics'
    }
  }
}

// 예약 분석 데이터
export async function getBookingAnalytics(timeRange: TimeRange = '30d'): Promise<{
  success: boolean
  data?: BookingAnalytics
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    // 전체 예약 조회
    const { data: inquiries, count: totalBookings } = await supabase
      .from('inquiries')
      .select(`
        *,
        assigned_admin:photographers(name)
      `, { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // 완료된 예약 수
    const completedBookings = inquiries?.filter(i => i.status === 'completed').length || 0
    const completionRate = totalBookings && totalBookings > 0 
      ? Math.round(completedBookings / totalBookings * 1000) / 10
      : 0

    // 평균 응답 시간 (임시 값)
    const averageResponseTime = 4.2 // 시간

    // 상태별 분포
    const statusCount = inquiries?.reduce((acc, inquiry) => {
      const status = inquiry.status || 'pending'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const statusLabels: Record<string, string> = {
      'pending': '대기중',
      'confirmed': '확정',
      'completed': '완료',
      'cancelled': '취소'
    }

    const statusDistribution = Object.entries(statusCount).map(([status, count]) => ({
      status,
      label: statusLabels[status] || status,
      count,
      percentage: totalBookings && totalBookings > 0 ? Math.round(count / totalBookings * 1000) / 10 : 0
    }))

    // 작가별 통계
    const adminStats = inquiries?.reduce((acc, inquiry) => {
      if (inquiry.assigned_admin_id) {
        const adminId = inquiry.assigned_admin_id
        if (!acc[adminId]) {
          acc[adminId] = {
            adminId,
            adminName: inquiry.assigned_admin?.name || 'Unknown',
            bookings: 0,
            completed: 0
          }
        }
        acc[adminId].bookings++
        if (inquiry.status === 'completed') {
          acc[adminId].completed++
        }
      }
      return acc
    }, {} as Record<string, { adminId: string; adminName: string; bookings: number; completed: number }>) || {}

    const adminStatsArray = Object.values(adminStats).map(admin => ({
      ...admin,
      completionRate: admin.bookings > 0 ? Math.round(admin.completed / admin.bookings * 100) : 0
    }))

    // 월별 수익 (임시 데이터)
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      monthlyRevenue.push({
        month: date.toLocaleDateString('ko-KR', { month: 'short' }),
        revenue: Math.floor(Math.random() * 1000000) + 500000,
        bookings: Math.floor(Math.random() * 20) + 10
      })
    }

    return {
      success: true,
      data: {
        totalBookings: totalBookings || 0,
        completedBookings,
        completionRate,
        averageResponseTime,
        statusDistribution,
        adminStats: adminStatsArray,
        monthlyRevenue
      }
    }
  } catch (error) {
    console.error('Error fetching booking analytics:', error)
    return {
      success: false,
      error: 'Failed to fetch booking analytics'
    }
  }
}

// AI 이미지 생성 분석 데이터
export async function getAIGenerationAnalytics(timeRange: TimeRange = '30d'): Promise<{
  success: boolean
  data?: AIGenerationAnalytics
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    // AI 이미지 생성 조회
    const { data: generations, count: totalGenerations } = await supabase
      .from('ai_image_generations')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // 성공한 생성 수
    const successfulGenerations = generations?.filter(g => g.generation_status === 'completed').length || 0
    const failedGenerations = generations?.filter(g => g.generation_status === 'failed').length || 0
    const successRate = totalGenerations && totalGenerations > 0 
      ? Math.round(successfulGenerations / totalGenerations * 1000) / 10
      : 0

    // 평균 처리 시간 (임시 값)
    const averageProcessingTime = 12.5 // 초

    // 평균 만족도 (임시 값)
    const averageRating = 4.2

    // 성격유형별 생성 수
    const personalityGenerations = generations?.reduce((acc, generation) => {
      if (generation.personality_code) {
        const type = generation.personality_code
        if (!acc[type]) {
          acc[type] = { count: 0, successful: 0 }
        }
        acc[type].count++
        if (generation.generation_status === 'completed') {
          acc[type].successful++
        }
      }
      return acc
    }, {} as Record<string, { count: number; successful: number }>) || {}

    const personalityGenerationsArray = Object.entries(personalityGenerations).map(([type, data]) => ({
      personalityType: type,
      count: data.count,
      successRate: data.count > 0 ? Math.round(data.successful / data.count * 100) : 0
    }))

    // 일별 생성 통계
    const dailyGenerations = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))
      
      const dayGens = generations?.filter(g => {
        if (!g.created_at) return false
        const genDate = new Date(g.created_at)
        return genDate >= dayStart && genDate <= dayEnd
      }) || []
      
      const daySuccessful = dayGens.filter(g => g.generation_status === 'completed').length
      const daySuccessRate = dayGens.length > 0 
        ? Math.round(daySuccessful / dayGens.length * 100)
        : 0
      
      dailyGenerations.push({
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        count: dayGens.length,
        successRate: daySuccessRate
      })
    }

    return {
      success: true,
      data: {
        totalGenerations: totalGenerations || 0,
        successfulGenerations,
        failedGenerations,
        successRate,
        averageProcessingTime,
        averageRating,
        personalityGenerations: personalityGenerationsArray,
        dailyGenerations
      }
    }
  } catch (error) {
    console.error('Error fetching AI generation analytics:', error)
    return {
      success: false,
      error: 'Failed to fetch AI generation analytics'
    }
  }
}