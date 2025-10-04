"use client";
import { adminLogger } from "@/lib/logger"

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Search,
  Eye,
  Edit,
  Mail,
  Camera,
  BarChart3,
  RefreshCw,
  UserCheck,
  Target,
  Grid,
  List,
  Filter,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Loader2,
  UserPlus,
  X
} from "lucide-react";
import { 
  getAllAdminUsersWithStats, 
  getAdminUserDetail, 
  getAdminScheduleStats,
  updateAdminUser,
  approveAdminUser,
  rejectAdminUser,
  getPendingAdminUsersCount,
  type AdminUserStats, 
  type AdminUserDetail 
} from "@/lib/actions/admin-users";

type ViewMode = 'card' | 'list';
type ApprovalFilter = 'all' | 'pending' | 'approved' | 'rejected';

export function AdminUsersManagementEnhanced() {
  // State management
  const [adminUsers, setAdminUsers] = useState<AdminUserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [scheduleStats, setScheduleStats] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<AdminUserStats | null>(null);
  const [approvingUser, setApprovingUser] = useState<AdminUserStats | null>(null);
  const [rejectingUser, setRejectingUser] = useState<AdminUserStats | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Load admin users with pagination
  const loadAdminUsers = useCallback(async (page = 0, reset = true) => {
    if (page === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    
    try {
      const result = await getAllAdminUsersWithStats(approvalFilter, page, 10);
      if (result.success) {
        if (reset) {
          setAdminUsers(result.adminUsers || []);
        } else {
          setAdminUsers(prev => [...prev, ...(result.adminUsers || [])]);
        }
        setTotalCount(result.totalCount || 0);
        setHasMore(result.hasMore || false);
        setCurrentPage(page);
      } else {
        setError(result.error || '작가 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      adminLogger.error('Error loading admin users:', error);
      setError('작가 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [approvalFilter]);

  // Load more users (infinite scroll)
  const loadMoreUsers = () => {
    if (!loadingMore && hasMore) {
      loadAdminUsers(currentPage + 1, false);
    }
  };

  // Load pending count
  const loadPendingCount = async () => {
    try {
      const result = await getPendingAdminUsersCount();
      if (result.success) {
        setPendingCount(result.count || 0);
      }
    } catch (error) {
      adminLogger.error('Error loading pending count:', error);
    }
  };

  // Handle user approval
  const handleApproveUser = async () => {
    if (!approvingUser) return;
    
    try {
      const result = await approveAdminUser(approvingUser.id, 'current-admin-id'); // TODO: Get current admin ID
      if (result.success) {
        await loadAdminUsers(0, true);
        await loadPendingCount();
        setApprovingUser(null);
      } else {
        setError(result.error || '승인 처리에 실패했습니다.');
      }
    } catch (error) {
      adminLogger.error('Error approving user:', error);
      setError('승인 처리 중 오류가 발생했습니다.');
    }
  };

  // Handle user rejection
  const handleRejectUser = async () => {
    if (!rejectingUser || !rejectionReason.trim()) return;
    
    try {
      const result = await rejectAdminUser(rejectingUser.id, 'current-admin-id', rejectionReason); // TODO: Get current admin ID
      if (result.success) {
        await loadAdminUsers(0, true);
        await loadPendingCount();
        setRejectingUser(null);
        setRejectionReason("");
      } else {
        setError(result.error || '거부 처리에 실패했습니다.');
      }
    } catch (error) {
      adminLogger.error('Error rejecting user:', error);
      setError('거부 처리 중 오류가 발생했습니다.');
    }
  };

  // Handle view detail
  const handleViewDetail = async (user: AdminUserStats) => {
    try {
      const [userResult, scheduleResult] = await Promise.all([
        getAdminUserDetail(user.id),
        getAdminScheduleStats(user.id)
      ]);

      if (userResult.success) {
        setSelectedUser(userResult.adminUser || null);
      }
      
      if (scheduleResult.success) {
        setScheduleStats(scheduleResult.scheduleStats);
      }
    } catch (error) {
      adminLogger.error('Error loading user detail:', error);
    }
  };

  // Handle user update
  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      const result = await updateAdminUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email
      });

      if (result.success) {
        await loadAdminUsers(0, true);
        setEditingUser(null);
      } else {
        setError(result.error || '작가 정보 업데이트에 실패했습니다.');
      }
    } catch (error) {
      adminLogger.error('Error updating user:', error);
      setError('작가 정보 업데이트 중 오류가 발생했습니다.');
    }
  };

  // Filter users based on search term
  const filteredUsers = adminUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return '승인됨';
      case 'pending': return '대기중';
      case 'rejected': return '거부됨';
      default: return '알 수 없음';
    }
  };

  // Effects
  useEffect(() => {
    loadAdminUsers(0, true);
    loadPendingCount();
  }, [loadAdminUsers]);

  useEffect(() => {
    setCurrentPage(0);
    loadAdminUsers(0, true);
  }, [approvalFilter]);

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(null).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button onClick={() => loadAdminUsers(0, true)} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 컨트롤 */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        {/* 검색 */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="작가 이름 또는 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 필터 */}
        <Select value={approvalFilter} onValueChange={(value: ApprovalFilter) => setApprovalFilter(value)}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="pending">대기중 ({pendingCount})</SelectItem>
            <SelectItem value="approved">승인됨</SelectItem>
            <SelectItem value="rejected">거부됨</SelectItem>
          </SelectContent>
        </Select>

        {/* 뷰 모드 토글 */}
        <div className="flex border rounded-lg p-1">
          <Button
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('card')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={() => loadAdminUsers(0, true)} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 전체 통계 요약 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 작가</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">등록된 작가</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인 대기</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">검토 필요</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 완료 예약</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredUsers.reduce((sum, user) => sum + user.completedInquiries, 0)}
            </div>
            <p className="text-xs text-muted-foreground">전체 완료 건수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 매칭률</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredUsers.length > 0 
                ? Math.round(filteredUsers.reduce((sum, user) => sum + user.matchingRate, 0) / filteredUsers.length * 10) / 10
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">전체 평균</p>
          </CardContent>
        </Card>
      </div>

      {/* 작가 목록 */}
      {viewMode === 'card' ? (
        // Card View
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Mail className="h-3 w-3 mr-1" />
                      {user.email}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant={getStatusBadgeVariant(user.approval_status)}>
                      {getStatusLabel(user.approval_status)}
                    </Badge>
                    {user.approval_status === 'approved' && (
                      <Badge variant="outline" className="text-xs">
                        {user.matchingRate}%
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {user.approval_status === 'approved' && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">총 문의</p>
                      <p className="font-medium">{user.totalInquiries}건</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">완료</p>
                      <p className="font-medium">{user.completedInquiries}건</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">가능 일정</p>
                      <p className="font-medium">{user.availableSlots}개</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">최근 예약</p>
                      <p className="font-medium">{user.recentBookings}건</p>
                    </div>
                  </div>
                )}

                {user.approval_status === 'rejected' && user.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-600">
                      <strong>거부 사유:</strong> {user.rejection_reason}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-1">
                    {user.approval_status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600"
                          onClick={() => setApprovingUser(user)}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600"
                          onClick={() => setRejectingUser(user)}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDetail(user)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingUser(user)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <Card>
          <CardHeader>
            <CardTitle>작가 목록</CardTitle>
            <CardDescription>총 {totalCount}명의 작가</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Badge variant={getStatusBadgeVariant(user.approval_status)}>
                      {getStatusLabel(user.approval_status)}
                    </Badge>
                    
                    {user.approval_status === 'approved' && (
                      <div className="text-sm text-center">
                        <p className="font-medium">{user.matchingRate}%</p>
                        <p className="text-xs text-muted-foreground">매칭률</p>
                      </div>
                    )}

                    <div className="flex space-x-1">
                      {user.approval_status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600"
                            onClick={() => setApprovingUser(user)}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600"
                            onClick={() => setRejectingUser(user)}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDetail(user)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Load More Button (Infinite Scroll) */}
      {hasMore && (
        <div className="text-center">
          <Button 
            onClick={loadMoreUsers} 
            disabled={loadingMore}
            variant="outline"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                로딩 중...
              </>
            ) : (
              '더 보기'
            )}
          </Button>
        </div>
      )}

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                {searchTerm ? '검색 결과가 없습니다.' : '등록된 작가가 없습니다.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 승인 확인 다이얼로그 */}
      <Dialog open={!!approvingUser} onOpenChange={() => setApprovingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작가 승인</DialogTitle>
            <DialogDescription>
              {approvingUser?.name} 작가를 승인하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingUser(null)}>
              취소
            </Button>
            <Button onClick={handleApproveUser}>
              <ThumbsUp className="h-4 w-4 mr-2" />
              승인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 거부 다이얼로그 */}
      <Dialog open={!!rejectingUser} onOpenChange={() => {setRejectingUser(null); setRejectionReason("");}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작가 거부</DialogTitle>
            <DialogDescription>
              {rejectingUser?.name} 작가를 거부하는 이유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">거부 사유</Label>
            <Textarea
              id="reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="거부 사유를 상세히 입력해주세요..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {setRejectingUser(null); setRejectionReason("");}}>
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectUser}
              disabled={!rejectionReason.trim()}
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              거부
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 기존 다이얼로그들 (상세 정보, 편집) - 이전 코드와 동일하므로 생략 */}
      {/* TODO: 상세 정보 다이얼로그와 편집 다이얼로그를 기존 코드에서 복사 */}
    </div>
  );
}