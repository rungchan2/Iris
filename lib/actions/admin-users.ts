'use server'

import { createClient } from '@/lib/supabase/server'

export interface AdminUserStats {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  totalInquiries: number
  completedInquiries: number
  availableSlots: number
  matchingRate: number
  averageResponseTime: number
  recentBookings: number
}

export interface AdminUserDetail extends AdminUserStats {
  monthlyInquiries: {
    month: string
    inquiries: number
    completed: number
  }[]
  portfolioPhotos: number
  lastActivity: string
}

// 모든 admin 유저와 기본 통계 조회 (승인 상태별 필터링 지원)
export async function getAllAdminUsersWithStats(
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'all',
  page = 0,
  limit = 10
): Promise<{
  success: boolean
  adminUsers?: AdminUserStats[]
  totalCount?: number
  hasMore?: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // 기본 쿼리 설정
    let query = supabase
      .from('admin_users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    // 승인 상태별 필터링
    if (approvalStatus && approvalStatus !== 'all') {
      query = query.eq('approval_status', approvalStatus)
    }

    const { data: adminUsers, error: usersError, count } = await query
    
    if (usersError) {
      return { success: false, error: usersError.message }
    }

    if (!adminUsers || adminUsers.length === 0) {
      return { 
        success: true, 
        adminUsers: [], 
        totalCount: count || 0,
        hasMore: false 
      }
    }

    // 각 admin 유저에 대한 통계 수집
    const adminUsersWithStats: AdminUserStats[] = await Promise.all(
      adminUsers.map(async (user) => {
        // 총 문의 수
        const { count: totalInquiries } = await supabase
          .from('inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_admin_id', user.id)

        // 완료된 문의 수
        const { count: completedInquiries } = await supabase
          .from('inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_admin_id', user.id)
          .eq('status', 'completed')

        // 사용 가능한 슬롯 수
        const { count: availableSlots } = await supabase
          .from('available_slots')
          .select('*', { count: 'exact', head: true })
          .eq('admin_id', user.id)
          .eq('is_available', true)
          .gte('date', new Date().toISOString().split('T')[0])

        // 최근 30일 예약 수
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { count: recentBookings } = await supabase
          .from('inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_admin_id', user.id)
          .gte('created_at', thirtyDaysAgo.toISOString())

        // 매칭률 계산 (완료된 문의 / 총 문의)
        const matchingRate = totalInquiries && totalInquiries > 0 
          ? Math.round((completedInquiries || 0) / totalInquiries * 1000) / 10
          : 0

        // 평균 응답 시간 (임시로 랜덤 값, 실제로는 문의 처리 시간 계산)
        const averageResponseTime = Math.round(Math.random() * 48 + 2) // 2-50시간

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
          approval_status: user.approval_status || 'pending',
          approved_by: user.approved_by,
          approved_at: user.approved_at,
          rejection_reason: user.rejection_reason,
          totalInquiries: totalInquiries || 0,
          completedInquiries: completedInquiries || 0,
          availableSlots: availableSlots || 0,
          matchingRate,
          averageResponseTime,
          recentBookings: recentBookings || 0
        }
      })
    )

    const hasMore = count ? (page + 1) * limit < count : false

    return {
      success: true,
      adminUsers: adminUsersWithStats,
      totalCount: count || 0,
      hasMore
    }
  } catch (error) {
    console.error('Error fetching admin users with stats:', error)
    return {
      success: false,
      error: 'Failed to fetch admin users statistics'
    }
  }
}

// 특정 admin 유저의 상세 정보 조회
export async function getAdminUserDetail(adminId: string): Promise<{
  success: boolean
  adminUser?: AdminUserDetail
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // 기본 유저 정보 조회
    const { data: adminUser, error: userError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', adminId)
      .single()
    
    if (userError) {
      return { success: false, error: userError.message }
    }

    // 기본 통계 조회
    const statsResult = await getAllAdminUsersWithStats()
    if (!statsResult.success) {
      return { success: false, error: statsResult.error }
    }

    const userStats = statsResult.adminUsers?.find(user => user.id === adminId)
    if (!userStats) {
      return { success: false, error: 'User stats not found' }
    }

    // 월별 문의 추이 (최근 6개월)
    const monthlyInquiries = []
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() - i)
      
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59)
      
      const { count: inquiries } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_admin_id', adminId)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
      
      const { count: completed } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_admin_id', adminId)
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
      
      monthlyInquiries.push({
        month: months[targetDate.getMonth()],
        inquiries: inquiries || 0,
        completed: completed || 0
      })
    }

    // 포트폴리오 사진 수
    const { count: portfolioPhotos } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('uploaded_by', adminId)

    // 마지막 활동 시간 (가장 최근 문의 업데이트 시간)
    const { data: lastActivity } = await supabase
      .from('inquiries')
      .select('updated_at')
      .eq('assigned_admin_id', adminId)
      .order('updated_at', { ascending: false })
      .limit(1)

    const adminUserDetail: AdminUserDetail = {
      ...userStats,
      monthlyInquiries,
      portfolioPhotos: portfolioPhotos || 0,
      lastActivity: lastActivity?.[0]?.updated_at || adminUser.updated_at
    }

    return {
      success: true,
      adminUser: adminUserDetail
    }
  } catch (error) {
    console.error('Error fetching admin user detail:', error)
    return {
      success: false,
      error: 'Failed to fetch admin user detail'
    }
  }
}

// admin 유저 정보 업데이트
export async function updateAdminUser(adminId: string, updates: {
  name?: string
  email?: string
}): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('admin_users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating admin user:', error)
    return {
      success: false,
      error: 'Failed to update admin user'
    }
  }
}

// admin 유저 승인
export async function approveAdminUser(
  adminId: string, 
  approvedBy: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('admin_users')
      .update({
        approval_status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error approving admin user:', error)
    return {
      success: false,
      error: 'Failed to approve admin user'
    }
  }
}

// admin 유저 거부
export async function rejectAdminUser(
  adminId: string, 
  rejectedBy: string,
  reason: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('admin_users')
      .update({
        approval_status: 'rejected',
        approved_by: rejectedBy,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error rejecting admin user:', error)
    return {
      success: false,
      error: 'Failed to reject admin user'
    }
  }
}

// 승인 대기 중인 유저 수 조회
export async function getPendingAdminUsersCount(): Promise<{
  success: boolean
  count?: number
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { count, error } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending')
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, count: count || 0 }
  } catch (error) {
    console.error('Error fetching pending admin users count:', error)
    return {
      success: false,
      error: 'Failed to fetch pending users count'
    }
  }
}

// admin 유저의 일정 관리 통계
export async function getAdminScheduleStats(adminId: string): Promise<{
  success: boolean
  scheduleStats?: {
    totalSlots: number
    availableSlots: number
    bookedSlots: number
    upcomingWeekSlots: number
    utilizationRate: number
  }
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // 총 슬롯 수
    const { count: totalSlots } = await supabase
      .from('available_slots')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', adminId)
      .gte('date', new Date().toISOString().split('T')[0])

    // 사용 가능한 슬롯 수
    const { count: availableSlots } = await supabase
      .from('available_slots')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', adminId)
      .eq('is_available', true)
      .gte('date', new Date().toISOString().split('T')[0])

    // 예약된 슬롯 수
    const { count: bookedSlots } = await supabase
      .from('available_slots')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', adminId)
      .eq('is_available', false)
      .gte('date', new Date().toISOString().split('T')[0])

    // 다음 주 슬롯 수
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const { count: upcomingWeekSlots } = await supabase
      .from('available_slots')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', adminId)
      .gte('date', new Date().toISOString().split('T')[0])
      .lte('date', nextWeek.toISOString().split('T')[0])

    // 이용률 계산
    const utilizationRate = totalSlots && totalSlots > 0
      ? Math.round((bookedSlots || 0) / totalSlots * 1000) / 10
      : 0

    return {
      success: true,
      scheduleStats: {
        totalSlots: totalSlots || 0,
        availableSlots: availableSlots || 0,
        bookedSlots: bookedSlots || 0,
        upcomingWeekSlots: upcomingWeekSlots || 0,
        utilizationRate
      }
    }
  } catch (error) {
    console.error('Error fetching admin schedule stats:', error)
    return {
      success: false,
      error: 'Failed to fetch schedule statistics'
    }
  }
}