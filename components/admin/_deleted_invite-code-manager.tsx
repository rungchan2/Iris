'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plus, Copy, Check, Calendar, User, UserCheck, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

import { createInviteCode, getInviteCodes } from '@/lib/actions/admin-auth'

const createInviteSchema = z.object({
  role: z.enum(['admin', 'photographer']),
  expiresInDays: z.number().min(1).max(365),
  notes: z.string().optional(),
})

type CreateInviteFormData = z.infer<typeof createInviteSchema>

interface InviteCode {
  id: string
  code: string
  role: string
  expires_at: string
  used_at: string | null
  created_at: string
  notes: string | null
  created_by_user: { name: string } | null
  used_by_user: { name: string } | null
}

export function InviteCodeManager() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const form = useForm<CreateInviteFormData>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: {
      role: 'photographer',
      expiresInDays: 7,
      notes: '',
    },
  })

  const loadInviteCodes = async () => {
    setIsLoading(true)
    try {
      const result = await getInviteCodes()
      if (result.success && result.data) {
        setInviteCodes(result.data as unknown as InviteCode[])
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('초대 코드를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInviteCodes()
  }, [])

  const onCreateInvite = async (data: CreateInviteFormData) => {
    setIsCreating(true)
    try {
      const result = await createInviteCode(data)
      if (result.success && result.data) {
        toast.success('초대 코드가 생성되었습니다.')
        setIsDialogOpen(false)
        form.reset()
        loadInviteCodes()
        
        // 생성된 코드를 클립보드에 복사
        await navigator.clipboard.writeText(result.data.code)
        setCopiedCode(result.data.code)
        setTimeout(() => setCopiedCode(null), 3000)
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('초대 코드 생성 중 오류가 발생했습니다.')
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
      toast.success('초대 코드가 클립보드에 복사되었습니다.')
    } catch (error) {
      toast.error('복사에 실패했습니다.')
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '관리자'
      case 'photographer':
        return '작가'
      default:
        return role
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'photographer':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusBadge = (invite: InviteCode) => {
    if (!mounted) {
      return <Badge variant="outline" className="text-blue-600 border-blue-200">활성</Badge>
    }
    
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    
    if (invite.used_at) {
      return <Badge variant="outline" className="text-green-600 border-green-200">사용됨</Badge>
    } else if (expiresAt < now) {
      return <Badge variant="outline" className="text-red-600 border-red-200">만료됨</Badge>
    } else {
      return <Badge variant="outline" className="text-blue-600 border-blue-200">활성</Badge>
    }
  }

  const activeCount = mounted ? inviteCodes.filter(invite => !invite.used_at && new Date(invite.expires_at) > new Date()).length : 0
  const usedCount = mounted ? inviteCodes.filter(invite => invite.used_at).length : 0
  const expiredCount = mounted ? inviteCodes.filter(invite => !invite.used_at && new Date(invite.expires_at) <= new Date()).length : 0

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">활성 코드</p>
                <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">사용된 코드</p>
                <p className="text-2xl font-bold text-green-600">{usedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">만료된 코드</p>
                <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">전체 코드</p>
                <p className="text-2xl font-bold text-gray-900">{inviteCodes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 새 초대 코드 생성 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>초대 코드 관리</CardTitle>
              <CardDescription>새로운 어드민 사용자를 위한 초대 코드를 생성하고 관리합니다.</CardDescription>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  새 초대 코드
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 초대 코드 생성</DialogTitle>
                  <DialogDescription>
                    새로운 어드민 사용자를 위한 초대 코드를 생성합니다.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCreateInvite)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>권한</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="권한을 선택하세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="photographer">작가</SelectItem>
                              <SelectItem value="admin">관리자</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            초대받을 사용자의 권한을 설정합니다.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expiresInDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>유효 기간 (일)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="365"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            초대 코드의 유효 기간을 일 단위로 설정합니다. (1-365일)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>메모 (선택)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="초대 코드에 대한 메모를 입력하세요"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            초대 코드의 용도나 대상자에 대한 메모를 남길 수 있습니다.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isCreating}
                      >
                        취소
                      </Button>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? '생성 중...' : '생성'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>초대 코드를 불러오는 중...</p>
            </div>
          ) : inviteCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">생성된 초대 코드가 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>코드</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>만료일</TableHead>
                  <TableHead>사용자</TableHead>
                  <TableHead>메모</TableHead>
                  <TableHead>생성일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inviteCodes.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {invite.code}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(invite.code)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedCode === invite.code ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(invite.role)}>
                        {getRoleLabel(invite.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invite)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invite.expires_at), 'PPP', { locale: ko })}
                    </TableCell>
                    <TableCell>
                      {invite.used_by_user?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-32 truncate text-sm text-gray-600">
                        {invite.notes || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invite.created_at), 'PPP', { locale: ko })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* 사용 방법 안내 */}
      <Alert>
        <AlertDescription>
          <strong>초대 코드 사용 방법:</strong>
          <br />
          1. 초대 코드를 생성한 후 대상자에게 전달합니다.
          <br />
          2. 대상자는 <code>/admin/signup</code> 페이지에서 초대 코드를 입력하여 회원가입할 수 있습니다.
          <br />
          3. 초대 코드는 한 번만 사용 가능하며, 만료일이 지나면 사용할 수 없습니다.
        </AlertDescription>
      </Alert>
    </div>
  )
}