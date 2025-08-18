"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"
import { createSpecificAdmin } from "@/lib/actions/user-management"

export default function CreateAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleCreateAdmin = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    const result = await createSpecificAdmin()

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(result.message || "Admin이 성공적으로 생성되었습니다.")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">특정 Admin 생성</CardTitle>
            <CardDescription>
              leeh09077@gmail.com 사용자를 Admin으로 생성합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>ID:</strong> b6a15cf5-8a2d-4d34-b6c5-9f7ff6fc64c0
              </p>
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> leeh09077@gmail.com
              </p>
              <p className="text-sm text-gray-600">
                <strong>Name:</strong> Lee Heechan
              </p>
              <p className="text-sm text-gray-600">
                <strong>Role:</strong> admin
              </p>
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

            <Button 
              onClick={handleCreateAdmin} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "생성 중..." : "Admin 생성"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}