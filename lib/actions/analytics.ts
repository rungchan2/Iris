'use server'

import { createClient } from '@/lib/supabase/server'

export interface AnalyticsData {
  conversionRate: number
  totalUsers: number
  totalRevenue: number
  topPerformingTypes: string[]
}

// Quiz Analytics interface removed as quiz tables have been deleted

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

// AIGenerationAnalytics interface removed - AI generation feature deprecated

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

    // Quiz sessions have been removed from the database
    const totalQuizSessions = 0
    const completedQuizSessions = 0

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

// Quiz analytics function removed as quiz tables have been deleted

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
      .select('*', { count: 'exact' })
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

    // 작가별 통계 - disabled as matched_admin_id was removed
    const adminStatsArray: Array<{
      adminId: string;
      adminName: string;
      bookings: number;
      completed: number;
      completionRate: number;
    }> = []

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

