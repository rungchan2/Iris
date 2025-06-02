"use client"

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
import { signUpNewUser, getSession } from "@/lib/login"
import { validateInvitationCode } from "@/lib/actions/code"
import { useForm } from "react-hook-form"
import { createUser } from "@/lib/user"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Toaster, toast } from 'sonner';


type SignupFormData = {
  email: string;
  name: string;
  password: string;
  passwordConfirm: string;
  code: string;
}

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, setError, watch } = useForm<SignupFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const password = watch("password");

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await getSession();
      if (data.session) {
        router.push("/");
      }
    }
    fetchSession();
  }, [router]);

  const onSubmit = async (data: SignupFormData) => {
    const { email, password, name, code } = data;

    console.log(data);

    setIsLoading(true);

    const isCodeValid = await validateInvitationCode(code);
    console.log("isCodeValid", isCodeValid);

    try {
      // 1. 가입 코드 검증
      if (!isCodeValid) {
        setError("code", { message: "유효하지 않은 가입 코드입니다." });
        setIsLoading(false);
        return;
      }

      // 2. Supabase 회원가입
      const { data: signupData, error: signupError } = await signUpNewUser(email, password);
      
      if (signupError) {
        console.error("회원가입 오류:", signupError);
        toast.error("회원가입에 실패했습니다. 다시 시도해주세요.");
        setIsLoading(false);
        return;
      }

      if (!signupData?.user) {
        toast.error("회원가입 데이터를 받아올 수 없습니다.");
        setIsLoading(false);
        return;
      }

      // 3. admin_users 테이블에 사용자 생성
      try {
        await createUser(signupData.user.id, email, name);
        toast.success("회원가입이 완료되었습니다!");
        router.push("/");
      } catch (createUserError) {
        console.dir(createUserError, { depth: null });
        toast.error("사용자 프로필 생성에 실패했습니다.");
        setIsLoading(false);
        return;
      }
      
    } catch (error) {
      console.error("예상치 못한 오류:", error);
      toast.error("예상치 못한 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Toaster position="top-right" richColors/>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>
            회원가입 페이지입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  {...register("email", {
                    required: "이메일을 입력해주세요.",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "유효한 이메일 주소를 입력해주세요."
                    }
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="이름"
                  required
                  {...register("name", {
                    required: "이름을 입력해주세요.",
                    minLength: {
                      value: 2,
                      message: "이름은 최소 2글자 이상이어야 합니다."
                    }
                  })}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">비밀번호</Label>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    required 
                    {...register("password", {
                      required: "비밀번호를 입력해주세요.",
                      minLength: {
                        value: 6,
                        message: "비밀번호는 최소 6글자 이상이어야 합니다."
                      }
                    })} 
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
                </div>
                <div className="relative">
                  <Input 
                    id="passwordConfirm" 
                    type={showPasswordConfirm ? "text" : "password"}
                    required 
                    {...register("passwordConfirm", {
                      required: "비밀번호 확인을 입력해주세요.",
                      validate: (value) => {
                        if (value !== password) {
                          return "비밀번호가 일치하지 않습니다.";
                        }
                        return true;
                      }
                    })} 
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  >
                    {showPasswordConfirm ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.passwordConfirm && (
                  <p className="text-sm text-red-600">{errors.passwordConfirm.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="code">가입 코드</Label>
                </div>
                <Input 
                  id="code" 
                  type="text" 
                  placeholder="가입 코드" 
                  required 
                  {...register("code", {
                    required: "가입 코드를 입력해주세요."
                  })} 
                />
                {errors.code && (
                  <p className="text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "회원가입 중..." : "회원가입"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
