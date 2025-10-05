'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plus, Users, Shield, Trash2, Eye, EyeOff, Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

import {
  createAdminSchema,
  createPhotographerSchema,
  type CreateAdminFormData,
  type CreatePhotographerFormData,
  type AdminUser,
  type PhotographerUser
} from '@/types/user-management.types'
import {
  useAdminUsers,
  usePhotographerUsers,
  useCreateAdminUser,
  useCreatePhotographerUser,
  useDeleteUser,
} from '@/lib/hooks/use-user-management'

export function UserManagement() {
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false)
  const [isPhotographerDialogOpen, setIsPhotographerDialogOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | PhotographerUser | null>(null)
  const [selectedUserType, setSelectedUserType] = useState<'admin' | 'photographer' | null>(null)

  // Fetch users using React Query hooks
  const { data: adminUsers = [], isLoading: isLoadingAdmins } = useAdminUsers()
  const { data: photographerUsers = [], isLoading: isLoadingPhotographers } = usePhotographerUsers()

  const adminForm = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
  })

  const photographerForm = useForm<CreatePhotographerFormData>({
    resolver: zodResolver(createPhotographerSchema),
  })

  // Mutation hooks
  const createAdminMutation = useCreateAdminUser(() => {
    setIsAdminDialogOpen(false)
    adminForm.reset()
  })

  const createPhotographerMutation = useCreatePhotographerUser(() => {
    setIsPhotographerDialogOpen(false)
    photographerForm.reset()
  })

  const deleteUserMutation = useDeleteUser()

  const onCreateAdmin = (data: CreateAdminFormData) => {
    createAdminMutation.mutate(data)
  }

  const onCreatePhotographer = (data: CreatePhotographerFormData) => {
    createPhotographerMutation.mutate(data)
  }

  const handleDeleteUser = (userId: string, userType: 'admin' | 'photographer') => {
    deleteUserMutation.mutate({ userId, userType })
  }

  const handleViewUser = (user: AdminUser | PhotographerUser, userType: 'admin' | 'photographer') => {
    setSelectedUser(user)
    setSelectedUserType(userType)
    setIsDetailModalOpen(true)
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

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">관리자</p>
                <p className="text-2xl font-bold text-blue-600">{adminUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">작가</p>
                <p className="text-2xl font-bold text-green-600">{photographerUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">전체 사용자</p>
                <p className="text-2xl font-bold text-gray-900">{adminUsers.length + photographerUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 사용자 관리 탭 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 관리</CardTitle>
          <CardDescription>시스템 관리자 및 작가 사용자를 생성하고 관리합니다.</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="admins" className="space-y-4">
            <TabsList>
              <TabsTrigger value="admins">관리자</TabsTrigger>
              <TabsTrigger value="photographers">작가</TabsTrigger>
            </TabsList>
            
            <TabsContent value="admins" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">관리자 계정</h3>
                  <p className="text-sm text-gray-600">시스템 관리자 계정을 관리합니다.</p>
                </div>
                
                <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        관리자 추가
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>새 관리자 생성</DialogTitle>
                        <DialogDescription>
                          새로운 시스템 관리자 계정을 생성합니다.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...adminForm}>
                        <form onSubmit={adminForm.handleSubmit(onCreateAdmin)} className="space-y-4">
                          <FormField
                            control={adminForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>이메일</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="admin@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={adminForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>비밀번호</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      type={showPassword ? "text" : "password"} 
                                      placeholder="최소 8자 이상" 
                                      {...field} 
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowPassword(!showPassword)}
                                    >
                                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={adminForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>이름</FormLabel>
                                <FormControl>
                                  <Input placeholder="관리자 이름" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAdminDialogOpen(false)}
                              disabled={createAdminMutation.isPending}
                            >
                              취소
                            </Button>
                            <Button type="submit" disabled={createAdminMutation.isPending}>
                              {createAdminMutation.isPending ? '생성 중...' : '생성'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
              </div>
              
              {isLoadingAdmins ? (
                <div className="text-center py-8">
                  <p>관리자 목록을 불러오는 중...</p>
                </div>
              ) : adminUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">등록된 관리자가 없습니다.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>권한</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead>마지막 로그인</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="w-[100px]">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.created_at ? format(new Date(user.created_at), 'PPP', { locale: ko }) : '-'}
                        </TableCell>
                        <TableCell>
                          {'-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? '활성' : '비활성'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewUser(user, 'admin')}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>사용자 삭제 확인</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    정말로 {user.name} 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id, 'admin')}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    삭제
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="photographers" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">작가 계정</h3>
                  <p className="text-sm text-gray-600">작가 사용자 계정을 관리합니다.</p>
                </div>
                
                <Dialog open={isPhotographerDialogOpen} onOpenChange={setIsPhotographerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      작가 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>새 작가 생성</DialogTitle>
                      <DialogDescription>
                        새로운 작가 계정을 생성합니다.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...photographerForm}>
                      <form onSubmit={photographerForm.handleSubmit(onCreatePhotographer)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={photographerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>이메일</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="photographer@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={photographerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>이름</FormLabel>
                                <FormControl>
                                  <Input placeholder="작가 이름" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={photographerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>비밀번호</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="최소 8자 이상" 
                                    {...field} 
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={photographerForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>전화번호 (선택)</FormLabel>
                                <FormControl>
                                  <Input placeholder="010-0000-0000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={photographerForm.control}
                            name="instagram_handle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>인스타그램 (선택)</FormLabel>
                                <FormControl>
                                  <Input placeholder="@username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={photographerForm.control}
                          name="website_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>웹사이트 (선택)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={photographerForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>소개 (선택)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="작가 소개글을 입력하세요" className="resize-none" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsPhotographerDialogOpen(false)}
                            disabled={createPhotographerMutation.isPending}
                          >
                            취소
                          </Button>
                          <Button type="submit" disabled={createPhotographerMutation.isPending}>
                            {createPhotographerMutation.isPending ? '생성 중...' : '생성'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              
              {isLoadingPhotographers ? (
                <div className="text-center py-8">
                  <p>작가 목록을 불러오는 중...</p>
                </div>
              ) : photographerUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">등록된 작가가 없습니다.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>전화번호</TableHead>
                      <TableHead>인스타그램</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="w-[100px]">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {photographerUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>{user.instagram_handle || '-'}</TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), 'PPP', { locale: ko })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.approval_status === 'approved' ? 'default' : 'secondary'}>
                            {user.approval_status === 'approved' ? '승인됨' : '대기중'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewUser(user, 'photographer')}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>사용자 삭제 확인</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    정말로 {user.name} 작가를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id, 'photographer')}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    삭제
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedUserType === 'admin' ? '관리자' : '작가'} 상세 정보
            </DialogTitle>
            <DialogDescription>
              사용자 정보를 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-medium mb-4">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">이름</label>
                    <p className="mt-1">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">이메일</label>
                    <p className="mt-1">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">생성일</label>
                    <p className="mt-1">
                      {selectedUser.created_at ? format(new Date(selectedUser.created_at), 'PPP p', { locale: ko }) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 작가 전용 정보 */}
              {selectedUserType === 'photographer' && 'phone' in selectedUser && (
                <div>
                  <h3 className="text-lg font-medium mb-4">작가 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">전화번호</label>
                      <p className="mt-1">{selectedUser.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">웹사이트</label>
                      <p className="mt-1">
                        {selectedUser.website_url ? (
                          <a 
                            href={selectedUser.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedUser.website_url}
                          </a>
                        ) : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">인스타그램</label>
                      <p className="mt-1">{selectedUser.instagram_handle || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">승인 상태</label>
                      <p className="mt-1">
                        <Badge variant={selectedUser.approval_status === 'approved' ? 'default' : 'secondary'}>
                          {selectedUser.approval_status === 'approved' ? '승인됨' : '대기중'}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  {selectedUser.bio && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-600">소개</label>
                      <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedUser.bio}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 관리자 전용 정보 */}
              {selectedUserType === 'admin' && 'is_active' in selectedUser && (
                <div>
                  <h3 className="text-lg font-medium mb-4">관리자 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">권한</label>
                      <p className="mt-1">
                        <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                          {getRoleLabel(selectedUser.role)}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">계정 상태</label>
                      <p className="mt-1">
                        <Badge variant={selectedUser.is_active ? 'default' : 'secondary'}>
                          {selectedUser.is_active ? '활성' : '비활성'}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}