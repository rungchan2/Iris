"use client"

import { useState, useEffect } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, CheckCircle, AlertCircle } from "lucide-react"
import { createInitialAdmin, checkAdminExists } from "@/lib/actions/user-management"
import Link from "next/link"

export default function AdminSetupPage() {
  const [adminExists, setAdminExists] = useState<boolean | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isCreated, setIsCreated] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const result = await checkAdminExists()
      setAdminExists(result.exists)
    }
    checkAdmin()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // 비밀번호 확인 검증
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      setIsLoading(false)
      return
    }

    // 비밀번호 강도 검증
    if (password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.")
      setIsLoading(false)
      return
    }

    const result = await createInitialAdmin({
      email,
      password,
      name
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(result.message || "Admin이 성공적으로 생성되었습니다.")
      setIsCreated(true)
      // 폼 초기화
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setName("")
    }

    setIsLoading(false)
  }

  if (adminExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">시스템 상태를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {adminExists ? (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">시스템 초기화 완료</CardTitle>
              <CardDescription>
                Admin이 이미 설정되어 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  이 페이지는 최초 설정시에만 사용할 수 있습니다.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col space-y-2">
                <Link href="/login">
                  <Button className="w-full">
                    로그인 페이지로 이동
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    홈페이지로 이동
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">시스템 초기화</CardTitle>
              <CardDescription>
                Iris 시스템의 최초 Admin을 생성하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isCreated ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="관리자 이름"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="8자 이상의 비밀번호"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="비밀번호 다시 입력"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "생성 중..." : "Admin 생성"}
                  </Button>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>중요:</strong> 이 페이지는 시스템 최초 설정시에만 사용할 수 있습니다. 
                      Admin 생성 후에는 더 이상 접근할 수 없습니다.
                    </AlertDescription>
                  </Alert>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                  
                  <p className="text-sm text-gray-600">
                    이제 생성한 계정으로 로그인하여 시스템을 관리할 수 있습니다.
                  </p>
                  
                  <div className="flex flex-col space-y-2">
                    <Link href="/login">
                      <Button className="w-full">
                        로그인 페이지로 이동
                      </Button>
                    </Link>
                    <Link href="/">
                      <Button variant="outline" className="w-full">
                        홈페이지로 이동
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}