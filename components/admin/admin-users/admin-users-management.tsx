"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Phone,
  Camera,
  BarChart3,
  RefreshCw,
  UserCheck,
  Target,
  Grid,
  List,
  Filter,
  X,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Loader2
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

export function AdminUsersManagement() {
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

  const loadAdminUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAllAdminUsersWithStats();
      if (result.success) {
        setAdminUsers(result.adminUsers || []);
      } else {
        setError(result.error || '작가 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error loading admin users:', error);
      setError('작가 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Error loading user detail:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      const result = await updateAdminUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email
      });

      if (result.success) {
        await loadAdminUsers();
        setEditingUser(null);
      } else {
        setError(result.error || '작가 정보 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('작가 정보 업데이트 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const filteredUsers = adminUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Users className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button onClick={loadAdminUsers} className="mt-4" variant="outline">
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
      {/* 검색 및 필터 */}
      <div className="flex items-center space-x-4">
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
        <Button onClick={loadAdminUsers} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 전체 통계 요약 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 작가 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
            <p className="text-xs text-muted-foreground">등록된 작가</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 완료 예약</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminUsers.reduce((sum, user) => sum + user.completedInquiries, 0)}
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
              {adminUsers.length > 0 
                ? Math.round(adminUsers.reduce((sum, user) => sum + user.matchingRate, 0) / adminUsers.length * 10) / 10
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">전체 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">사용 가능 슬롯</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminUsers.reduce((sum, user) => sum + user.availableSlots, 0)}
            </div>
            <p className="text-xs text-muted-foreground">예약 가능 시간</p>
          </CardContent>
        </Card>
      </div>

      {/* 작가 목록 */}
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
                <div className="flex items-center space-x-1">
                  <Badge variant={user.matchingRate >= 80 ? "default" : user.matchingRate >= 60 ? "secondary" : "destructive"}>
                    {user.matchingRate}%
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
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

              <div>
                <p className="text-sm text-muted-foreground mb-2">성과 지표</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>매칭률</span>
                    <span>{user.matchingRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(user.matchingRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  가입일: {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="flex space-x-1">
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

      {/* 작가 상세 정보 다이얼로그 */}
      <Dialog open={!!selectedUser} onOpenChange={() => {setSelectedUser(null); setScheduleStats(null);}}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>{selectedUser?.name} 작가 상세 정보</span>
            </DialogTitle>
            <DialogDescription>
              작가의 상세 성과와 활동 내역을 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">기본 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {selectedUser.email}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      가입일: {new Date(selectedUser.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      최근 활동: {new Date(selectedUser.lastActivity).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Camera className="h-4 w-4 mr-2 text-muted-foreground" />
                      포트폴리오: {selectedUser.portfolioPhotos}장
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">성과 지표</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">매칭률</span>
                      <Badge variant={selectedUser.matchingRate >= 80 ? "default" : "secondary"}>
                        {selectedUser.matchingRate}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>평균 응답시간</span>
                      <span>{selectedUser.averageResponseTime}시간</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>최근 30일 예약</span>
                      <span>{selectedUser.recentBookings}건</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 일정 통계 */}
              {scheduleStats && (
                <div>
                  <h4 className="font-medium mb-3">일정 관리 현황</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-lg font-bold">{scheduleStats.totalSlots}</div>
                          <div className="text-xs text-muted-foreground">총 슬롯</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{scheduleStats.availableSlots}</div>
                          <div className="text-xs text-muted-foreground">예약 가능</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{scheduleStats.bookedSlots}</div>
                          <div className="text-xs text-muted-foreground">예약됨</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-lg font-bold">{scheduleStats.utilizationRate}%</div>
                          <div className="text-xs text-muted-foreground">이용률</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* 월별 추이 */}
              <div>
                <h4 className="font-medium mb-3">월별 예약 추이</h4>
                <div className="space-y-2">
                  {selectedUser.monthlyInquiries.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 text-center">
                          <p className="font-medium">{month.month}</p>
                        </div>
                        <div className="flex space-x-6">
                          <div>
                            <p className="text-sm text-muted-foreground">총 문의</p>
                            <p className="font-medium">{month.inquiries}건</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">완료</p>
                            <p className="font-medium">{month.completed}건</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">완료율</p>
                            <p className="font-medium">
                              {month.inquiries > 0 
                                ? Math.round((month.completed / month.inquiries) * 100)
                                : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500"
                          style={{ 
                            width: `${month.inquiries > 0 ? (month.completed / month.inquiries) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {setSelectedUser(null); setScheduleStats(null);}}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 작가 정보 편집 다이얼로그 */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작가 정보 편집</DialogTitle>
            <DialogDescription>
              작가의 기본 정보를 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="작가 이름"
                />
              </div>
              <div>
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="이메일 주소"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              취소
            </Button>
            <Button onClick={handleUpdateUser}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}