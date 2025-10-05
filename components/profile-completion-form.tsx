"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
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
import { authLogger } from "@/lib/logger"

type ProfileCompletionFormData = {
  name: string
  phone: string
}

interface ProfileCompletionFormProps {
  userId: string
  currentEmail: string
  currentName?: string
  className?: string
}

export function ProfileCompletionForm({
  userId,
  currentEmail,
  currentName,
  className,
  ...props
}: ProfileCompletionFormProps & React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileCompletionFormData>({
    defaultValues: {
      name: currentName || "",
      phone: "",
    },
  })

  const onSubmit = async (data: ProfileCompletionFormData) => {
    try {
      setIsLoading(true)

      // Update user profile
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: data.name,
          phone: data.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) {
        authLogger.error('Error updating user profile:', updateError)
        toast.error("프로필 업데이트에 실패했습니다")
        return
      }

      toast.success("프로필이 완성되었습니다!")

      // Redirect to home page
      router.push('/')
      router.refresh()

    } catch (error) {
      authLogger.error('Profile completion error:', error)
      toast.error("프로필 완성 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">프로필 완성</CardTitle>
          <CardDescription>
            서비스를 이용하기 위해 추가 정보를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* Email (readonly) */}
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentEmail}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Google 계정에서 가져온 이메일입니다
                </p>
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

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "프로필 완성하기"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
