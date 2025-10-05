"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUpNewUser } from "@/app/actions/auth"
import { authLogger } from "@/lib/logger"

type UserSignupFormData = {
  email: string
  name: string
  phone: string
  password: string
  passwordConfirm: string
}

export function UserSignupForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserSignupFormData>()

  const password = watch("password")

  const onSubmit = async (data: UserSignupFormData) => {
    try {
      setIsLoading(true)

      // Validate passwords match
      if (data.password !== data.passwordConfirm) {
        toast.error("비밀번호가 일치하지 않습니다")
        return
      }

      // Sign up with email and password
      const signupResult = await signUpNewUser(
        data.email,
        data.password,
        data.name,
        'user' // user_type
      )

      if (!signupResult.success) {
        toast.error(signupResult.error || "회원가입에 실패했습니다")
        return
      }

      // Update user profile with additional info
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('users')
        .update({
          phone: data.phone,
        })
        .eq('email', data.email)

      if (updateError) {
        authLogger.error('Error updating user profile:', updateError)
      }

      toast.success("회원가입이 완료되었습니다!")

      // Redirect to home page
      router.push('/')
      router.refresh()

    } catch (error) {
      authLogger.error('User signup error:', error)
      toast.error("회원가입 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">일반 회원가입</CardTitle>
          <CardDescription>
            아래 정보를 입력하여 회원가입을 진행하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register("email", {
                    required: "이메일을 입력해주세요",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "올바른 이메일 형식이 아닙니다",
                    },
                  })}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  {...register("name", {
                    required: "이름을 입력해주세요",
                    minLength: {
                      value: 2,
                      message: "이름은 최소 2자 이상이어야 합니다",
                    },
                  })}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="grid gap-2">
                <Label htmlFor="phone">전화번호 *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="010-1234-5678"
                  {...register("phone", {
                    required: "전화번호를 입력해주세요",
                    pattern: {
                      value: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
                      message: "올바른 전화번호 형식이 아닙니다",
                    },
                  })}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label htmlFor="password">비밀번호 *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    {...register("password", {
                      required: "비밀번호를 입력해주세요",
                      minLength: {
                        value: 8,
                        message: "비밀번호는 최소 8자 이상이어야 합니다",
                      },
                    })}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Password Confirm */}
              <div className="grid gap-2">
                <Label htmlFor="passwordConfirm">비밀번호 확인 *</Label>
                <div className="relative">
                  <Input
                    id="passwordConfirm"
                    type={showPasswordConfirm ? "text" : "password"}
                    placeholder="********"
                    {...register("passwordConfirm", {
                      required: "비밀번호 확인을 입력해주세요",
                      validate: (value) =>
                        value === password || "비밀번호가 일치하지 않습니다",
                    })}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.passwordConfirm && (
                  <p className="text-sm text-red-500">{errors.passwordConfirm.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    회원가입 중...
                  </>
                ) : (
                  "회원가입"
                )}
              </Button>

              {/* Links */}
              <div className="text-center text-sm">
                이미 계정이 있으신가요?{" "}
                <a href="/login" className="underline underline-offset-4 hover:text-primary">
                  로그인
                </a>
              </div>
              <div className="text-center text-sm">
                작가이신가요?{" "}
                <a href="/signup/photographer" className="underline underline-offset-4 hover:text-primary">
                  작가 회원가입
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
