'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Eye,
  Check,
  X,
  Trash2,
  Star,
  StarOff,
  Globe,
  Lock,
  AlertCircle,
  MessageSquare,
} from 'lucide-react'
import {
  useStories,
  useStoryStats,
  useStory,
  useApproveStory,
  useRejectStory,
  useToggleFeaturedStory,
  useUpdateStoryVisibility,
  useDeleteStory,
  type StoryFilters,
} from '@/lib/hooks/use-stories'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function StoryManagement() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<StoryFilters>({
    moderationStatus: 'all',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const { data: storiesData, isLoading } = useStories(currentPage, 20, filters)
  const { data: stats } = useStoryStats()
  const approveMutation = useApproveStory()
  const rejectMutation = useRejectStory()
  const toggleFeaturedMutation = useToggleFeaturedStory()
  const updateVisibilityMutation = useUpdateStoryVisibility()
  const deleteMutation = useDeleteStory()

  const stories = storiesData?.data || []
  const pagination = storiesData?.pagination

  const handleApprove = (id: string) => {
    approveMutation.mutate({ id })
  }

  const handleReject = () => {
    if (!selectedStoryId || !rejectNote.trim()) return

    rejectMutation.mutate(
      { id: selectedStoryId, note: rejectNote },
      {
        onSuccess: () => {
          setShowRejectDialog(false)
          setSelectedStoryId(null)
          setRejectNote('')
        },
      }
    )
  }

  const handleToggleFeatured = (id: string) => {
    toggleFeaturedMutation.mutate(id)
  }

  const handleToggleVisibility = (id: string, currentVisibility: string) => {
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public'
    updateVisibilityMutation.mutate({ id, visibility: newVisibility })
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleSearch = () => {
    setFilters({ ...filters, searchTerm })
    setCurrentPage(1)
  }

  const getModerationBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">승인됨</Badge>
      case 'rejected':
        return <Badge variant="destructive">거절됨</Badge>
      case 'pending':
      default:
        return <Badge variant="secondary">대기중</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>전체 사연</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>검토 대기</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>승인됨</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>의심스러운 사연</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.suspicious}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status">검토 상태</Label>
              <Select
                value={filters.moderationStatus || 'all'}
                onValueChange={(value) => {
                  setFilters({ ...filters, moderationStatus: value })
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="approved">승인됨</SelectItem>
                  <SelectItem value="rejected">거절됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="visibility">공개 설정</Label>
              <Select
                value={filters.visibility || 'all'}
                onValueChange={(value) => {
                  setFilters({ ...filters, visibility: value })
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="public">공개</SelectItem>
                  <SelectItem value="private">비공개</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="suspicious">의심 여부</Label>
              <Select
                value={
                  filters.isSuspicious === undefined
                    ? 'all'
                    : filters.isSuspicious
                    ? 'true'
                    : 'false'
                }
                onValueChange={(value) => {
                  setFilters({
                    ...filters,
                    isSuspicious: value === 'all' ? undefined : value === 'true',
                  })
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger id="suspicious">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="true">의심스러움</SelectItem>
                  <SelectItem value="false">정상</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">검색</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="사연 내용 또는 작성자"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>검색</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stories Table */}
      <Card>
        <CardHeader>
          <CardTitle>사연 목록</CardTitle>
          <CardDescription>사연을 검토하고 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : stories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">사연이 없습니다</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>작성자</TableHead>
                  <TableHead>사연 내용</TableHead>
                  <TableHead>검토 상태</TableHead>
                  <TableHead>의심</TableHead>
                  <TableHead>추천</TableHead>
                  <TableHead>공개</TableHead>
                  <TableHead>작성일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stories.map((story) => (
                  <TableRow key={story.id}>
                    <TableCell>{story.contact_name}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate">{story.body}</p>
                    </TableCell>
                    <TableCell>{getModerationBadge(story.moderation_status)}</TableCell>
                    <TableCell>
                      {story.is_suspicious && (
                        <Badge variant="destructive">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          의심
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {story.is_featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      {story.visibility === 'public' ? (
                        <Globe className="w-4 h-4 text-green-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {story.created_at
                        ? format(new Date(story.created_at), 'yyyy-MM-dd HH:mm', {
                            locale: ko,
                          })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStoryId(story.id)
                          setShowDetailDialog(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {story.moderation_status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(story.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStoryId(story.id)
                              setShowRejectDialog(true)
                            }}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFeatured(story.id)}
                        disabled={toggleFeaturedMutation.isPending}
                      >
                        {story.is_featured ? (
                          <StarOff className="w-4 h-4" />
                        ) : (
                          <Star className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleToggleVisibility(story.id, story.visibility || 'private')
                        }
                        disabled={updateVisibilityMutation.isPending}
                      >
                        {story.visibility === 'public' ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>사연 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              정말 이 사연을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(story.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                총 {pagination.total}개 중 {(currentPage - 1) * 20 + 1}-
                {Math.min(currentPage * 20, pagination.total)}개 표시
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  이전
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {currentPage} / {pagination.totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedStoryId && (
        <Dialog
          open={showDetailDialog}
          onOpenChange={(open) => {
            setShowDetailDialog(open)
            if (!open) setSelectedStoryId(null)
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>사연 상세</DialogTitle>
            </DialogHeader>
            <StoryDetail storyId={selectedStoryId} />
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사연 거절</DialogTitle>
            <DialogDescription>거절 사유를 입력해주세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-note">거절 사유 *</Label>
              <Textarea
                id="reject-note"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="사연 거절 사유를 입력하세요"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false)
                  setRejectNote('')
                  setSelectedStoryId(null)
                }}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectNote.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? '처리 중...' : '거절'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StoryDetail({ storyId }: { storyId: string }) {
  const { data: story } = useStory(storyId)

  if (!story) {
    return <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">작성자</Label>
          <p className="font-semibold">{story.contact_name}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">인스타그램</Label>
          <p className="font-semibold">@{story.contact_instagram}</p>
        </div>
        {story.contact_phone && (
          <div>
            <Label className="text-muted-foreground">연락처</Label>
            <p className="font-semibold">{story.contact_phone}</p>
          </div>
        )}
        <div>
          <Label className="text-muted-foreground">작성일</Label>
          <p className="text-sm">
            {story.created_at
              ? format(new Date(story.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })
              : '-'}
          </p>
        </div>
        <div>
          <Label className="text-muted-foreground">검토 상태</Label>
          <div className="mt-1">
            <Badge
              variant={
                story.moderation_status === 'approved'
                  ? 'default'
                  : story.moderation_status === 'rejected'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {story.moderation_status === 'approved'
                ? '승인됨'
                : story.moderation_status === 'rejected'
                ? '거절됨'
                : '대기중'}
            </Badge>
          </div>
        </div>
        <div>
          <Label className="text-muted-foreground">공개 설정</Label>
          <div className="flex items-center gap-2 mt-1">
            {story.visibility === 'public' ? (
              <>
                <Globe className="w-4 h-4 text-green-600" />
                <span>공개</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-gray-400" />
                <span>비공개</span>
              </>
            )}
          </div>
        </div>
      </div>

      {story.is_suspicious && (
        <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
            <AlertCircle className="w-4 h-4" />
            의심스러운 사연
          </div>
          <p className="text-sm text-red-700">{story.suspicious_reason || '이유 없음'}</p>
        </div>
      )}

      <div>
        <Label className="text-muted-foreground">사연 내용</Label>
        <div className="mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">{story.body}</div>
      </div>

      {story.images && story.images.length > 0 && (
        <div>
          <Label className="text-muted-foreground">첨부 이미지 ({story.images.length}개)</Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {story.images.map((imageUrl, index) => (
              <img
                key={index}
                src={imageUrl}
                alt={`이미지 ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {story.moderated_at && (
        <div className="border-t pt-4">
          <Label className="text-muted-foreground">검토 정보</Label>
          <div className="mt-2 space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">검토 시간:</span>{' '}
              {format(new Date(story.moderated_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
            </p>
            {story.moderation_note && (
              <p>
                <span className="text-muted-foreground">검토 메모:</span> {story.moderation_note}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <Label className="text-muted-foreground">기타 정보</Label>
        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">조회 수:</span>{' '}
            {story.view_count?.toLocaleString() || 0}
          </div>
          <div>
            <span className="text-muted-foreground">좋아요 수:</span>{' '}
            {story.like_count?.toLocaleString() || 0}
          </div>
          {story.writing_duration_sec && (
            <div>
              <span className="text-muted-foreground">작성 시간:</span> {story.writing_duration_sec}초
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
