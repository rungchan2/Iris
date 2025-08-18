'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, User, Ticket } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { signupWithInviteCode, validateInviteCode } from '@/lib/actions/admin-auth'

const signupSchema = z.object({
  inviteCode: z.string().min(1, '초대 코드를 입력해주세요'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  confirmPassword: z.string(),
  name: z.string().min(1, '이름을 입력해주세요'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

export function AdminSignupForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [inviteCodeStatus, setInviteCodeStatus] = useState<{
    valid: boolean
    role?: string
    message: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError: setFormError
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const inviteCode = watch('inviteCode')

  // 초대 코드 실시간 검증
  const handleInviteCodeBlur = async () => {
    if (!inviteCode || inviteCode.length < 3) {
      setInviteCodeStatus(null)
      return
    }

    try {
      const result = await validateInviteCode(inviteCode)
      setInviteCodeStatus(result)
    } catch (error) {
      setInviteCodeStatus({
        valid: false,
        message: '초대 코드 검증 중 오류가 발생했습니다'
      })
    }
  }

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await signupWithInviteCode({
        email: data.email,
        password: data.password,
        name: data.name,
        inviteCode: data.inviteCode
      })

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setSuccess(result.message || '회원가입이 완료되었습니다.')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (error) {
      setError('회원가입 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">어드민 회원가입</CardTitle>
        <CardDescription className="text-center">
          초대 코드를 통해 가입하실 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 초대 코드 */}
          <div className="space-y-2">
            <Label htmlFor="inviteCode">초대 코드</Label>
            <div className="relative">
              <Ticket className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="inviteCode"
                type="text"
                placeholder="초대 코드를 입력하세요"
                className="pl-10"
                {...register('inviteCode')}
                onBlur={handleInviteCodeBlur}
              />
            </div>
            {errors.inviteCode && (
              <p className="text-sm text-red-600">{errors.inviteCode.message}</p>
            )}
            {inviteCodeStatus && (
              <Alert className={inviteCodeStatus.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription className={inviteCodeStatus.valid ? 'text-green-700' : 'text-red-700'}>
                  {inviteCodeStatus.message}
                  {inviteCodeStatus.valid && inviteCodeStatus.role && (
                    <span className="ml-2 text-xs">
                      (권한: {inviteCodeStatus.role === 'admin' ? '관리자' : '작가'})
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* 이메일 */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력하세요"
                className="pl-10"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                type="text"
                placeholder="이름을 입력하세요"
                className="pl-10"
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요 (최소 8자)"
                className="pl-10 pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="비밀번호를 다시 입력하세요"
                className="pl-10 pr-10"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* 에러/성공 메시지 */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* 제출 버튼 */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !inviteCodeStatus?.valid}
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </Button>

          {/* 로그인 링크 */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                로그인
              </button>
            </span>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}