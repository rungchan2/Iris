import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, AlertCircle, CheckCircle2, XCircle, Mail, LogOut } from "lucide-react"
import { checkPhotographerApprovalStatus } from "@/lib/actions/photographer-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { logout } from "@/app/actions/auth"

export default async function ApprovalStatusPage() {
  const result = await checkPhotographerApprovalStatus()
  
  if (result.error) {
    redirect('/login')
  }

  const photographer = result.data

  // If photographer data is missing, redirect to login
  if (!photographer) {
    redirect('/login')
  }

  // If already approved, redirect to dashboard
  if (photographer.approval_status === 'approved') {
    redirect('/photographer-admin/dashboard')
  }

  const getStatusInfo = () => {
    switch (photographer.approval_status) {
      case 'pending':
        return {
          icon: Clock,
          iconColor: 'text-yellow-500',
          title: '승인 대기 중',
          description: '프로필 검토가 진행 중입니다.',
          bgColor: 'from-yellow-50 to-orange-50',
          borderColor: 'border-yellow-200'
        }
      case 'rejected':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          title: '승인 거절됨',
          description: '프로필 심사 결과 승인이 거절되었습니다.',
          bgColor: 'from-red-50 to-pink-50',
          borderColor: 'border-red-200'
        }
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-gray-500',
          title: '상태 확인 중',
          description: '계정 상태를 확인하고 있습니다.',
          bgColor: 'from-gray-50 to-gray-100',
          borderColor: 'border-gray-200'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  async function handleLogout() {
    'use server'
    await logout()
    redirect('/login')
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${statusInfo.bgColor}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="absolute top-0 right-0">
              <form action={handleLogout}>
                <Button 
                  variant="outline" 
                  size="sm"
                  type="submit"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </Button>
              </form>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              작가 계정 상태
            </h1>
            <p className="text-gray-600">
              안녕하세요, {photographer.name}님
            </p>
          </div>

          {/* Status Card */}
          <Card className={`border-2 ${statusInfo.borderColor} shadow-lg`}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <StatusIcon className={`h-16 w-16 ${statusInfo.iconColor}`} />
              </div>
              <CardTitle className="text-2xl mb-2">{statusInfo.title}</CardTitle>
              <p className="text-gray-600">{statusInfo.description}</p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Current Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">현재 상태:</span>
                <Badge 
                  variant={photographer.approval_status === 'pending' ? 'default' : 'destructive'}
                >
                  {photographer.approval_status === 'pending' && '승인 대기'}
                  {photographer.approval_status === 'rejected' && '승인 거절'}
                  {!photographer.approval_status && '미정'}
                </Badge>
              </div>

              {/* Profile Completion Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">프로필 완성도:</span>
                <Badge variant={photographer.profile_completed ? 'secondary' : 'outline'}>
                  {photographer.profile_completed ? '완료' : '미완료'}
                </Badge>
              </div>

              {/* Rejection Reason */}
              {photographer.approval_status === 'rejected' && photographer.rejection_reason && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    <strong>거절 사유:</strong> {photographer.rejection_reason}
                  </AlertDescription>
                </Alert>
              )}

              {/* Information Section */}
              <div className="space-y-4">
                {photographer.approval_status === 'pending' && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      프로필 검토는 보통 1-3 영업일 소요됩니다. 
                      승인이 완료되면 이메일로 안내해드립니다.
                    </AlertDescription>
                  </Alert>
                )}

                {photographer.approval_status === 'rejected' && (
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      승인 거절 후 프로필을 수정하여 재신청할 수 있습니다. 
                      문의사항이 있으시면 고객센터로 연락해주세요.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {photographer.approval_status === 'rejected' && (
                  <Button asChild className="flex-1">
                    <Link href="/photographer-admin/my-page">
                      프로필 수정하기
                    </Link>
                  </Button>
                )}
                
                <Button variant="outline" asChild className="flex-1">
                  <Link href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}>
                    고객센터 문의
                  </Link>
                </Button>
                
                <Button variant="ghost" asChild className="flex-1">
                  <Link href="/">
                    홈페이지로 이동
                  </Link>
                </Button>
                
                <form action={handleLogout} className="flex-1">
                  <Button 
                    variant="destructive" 
                    type="submit"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>승인 과정에서 문제가 발생하면 언제든 연락주세요.</p>
            <p className="mt-1">
              이메일: <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="text-orange-600 hover:underline">
                {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}