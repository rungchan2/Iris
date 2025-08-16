'use server'

import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

// 비밀번호 재설정 요청
export async function requestPasswordReset(email: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // 해당 이메일의 사용자가 존재하는지 확인
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError || !user) {
      // 보안상 이유로 사용자가 존재하지 않아도 성공 메시지 반환
      return { success: true }
    }

    // 6자리 랜덤 토큰 생성
    const resetToken = randomBytes(3).toString('hex').toUpperCase()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1시간 후 만료

    // 기존 토큰 삭제
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id)

    // 새 토큰 저장
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString()
      })

    if (tokenError) {
      return { success: false, error: '토큰 생성에 실패했습니다.' }
    }

    // 이메일 발송 (실제 구현에서는 이메일 서비스 사용)
    console.log(`Password reset token for ${email}: ${resetToken}`)
    
    // TODO: 실제 이메일 발송 로직 구현
    // await sendPasswordResetEmail(email, resetToken)

    return { success: true }
  } catch (error) {
    console.error('Error requesting password reset:', error)
    return {
      success: false,
      error: '비밀번호 재설정 요청에 실패했습니다.'
    }
  }
}

// 비밀번호 재설정
export async function resetPassword(token: string, newPassword: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // 토큰 유효성 검사
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at')
      .eq('token', token.toUpperCase())
      .single()

    if (tokenError || !tokenData) {
      return { success: false, error: '유효하지 않은 인증 코드입니다.' }
    }

    // 토큰 만료 확인
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    
    if (now > expiresAt) {
      // 만료된 토큰 삭제
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token', token.toUpperCase())
        
      return { success: false, error: '인증 코드가 만료되었습니다. 다시 요청해 주세요.' }
    }

    // Supabase Auth에서 비밀번호 업데이트
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: newPassword }
    )

    if (updateError) {
      return { success: false, error: '비밀번호 업데이트에 실패했습니다.' }
    }

    // 사용된 토큰 삭제
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', token.toUpperCase())

    return { success: true }
  } catch (error) {
    console.error('Error resetting password:', error)
    return {
      success: false,
      error: '비밀번호 재설정에 실패했습니다.'
    }
  }
}