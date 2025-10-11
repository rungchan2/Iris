'use client'

import { useEffect, useState } from 'react'
import { getUserInquiries, getInquiryDetails, updateInquiryOptionalFields, type InquiryWithDetails } from '@/lib/actions/user-inquiries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Calendar, User, AlertCircle, Loader2, Edit, Eye, CreditCard, Camera, ExternalLink, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function InquiriesClient() {
  const [inquiries, setInquiries] = useState<InquiryWithDetails[]>([])
  const [filteredInquiries, setFilteredInquiries] = useState<InquiryWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryWithDetails | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  // Filter & Search state
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Edit form state
  const [editForm, setEditForm] = useState({
    special_request: '',
    difficulty_note: '',
    conversation_preference: '',
    conversation_topics: '',
    favorite_music: '',
    shooting_meaning: '',
    relationship: '',
  })

  useEffect(() => {
    loadInquiries()
  }, [])

  useEffect(() => {
    filterInquiries()
  }, [inquiries, dateFilter, searchQuery])

  const loadInquiries = async () => {
    setLoading(true)
    const result = await getUserInquiries()
    if (result.success) {
      setInquiries(result.data)
    } else {
      toast.error('예약 내역을 불러오는데 실패했습니다')
    }
    setLoading(false)
  }

  const filterInquiries = () => {
    let filtered = [...inquiries]

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case '1month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case '3months':
          filterDate.setMonth(now.getMonth() - 3)
          break
        case '6months':
          filterDate.setMonth(now.getMonth() - 6)
          break
      }

      filtered = filtered.filter(inquiry => {
        const createdAt = inquiry.created_at ? new Date(inquiry.created_at) : null
        return createdAt && createdAt >= filterDate
      })
    }

    // Search query (product name or photographer name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(inquiry => {
        const productName = inquiry.product?.name?.toLowerCase() || ''
        const photographerName = inquiry.photographer?.name?.toLowerCase() || ''
        return productName.includes(query) || photographerName.includes(query)
      })
    }

    setFilteredInquiries(filtered)
  }

  const handleDetailsClick = async (inquiry: InquiryWithDetails) => {
    const result = await getInquiryDetails(inquiry.id)
    if (result.success) {
      setSelectedInquiry(result.data)
      setDetailsDialogOpen(true)
    } else {
      toast.error('예약 상세 정보를 불러오는데 실패했습니다')
    }
  }

  const handleEditClick = (inquiry: InquiryWithDetails) => {
    setSelectedInquiry(inquiry)
    setEditForm({
      special_request: inquiry.special_request || '',
      difficulty_note: inquiry.difficulty_note || '',
      conversation_preference: inquiry.conversation_preference || '',
      conversation_topics: inquiry.conversation_topics || '',
      favorite_music: inquiry.favorite_music || '',
      shooting_meaning: inquiry.shooting_meaning || '',
      relationship: inquiry.relationship || '',
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!selectedInquiry) return

    setEditLoading(true)
    const result = await updateInquiryOptionalFields(selectedInquiry.id, editForm)

    if (result.success) {
      toast.success('예약 정보가 수정되었습니다')
      setEditDialogOpen(false)
      loadInquiries()
    } else {
      toast.error(result.error || '예약 정보 수정에 실패했습니다')
    }
    setEditLoading(false)
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">상태 없음</Badge>

    switch (status) {
      case 'pending_payment':
        return <Badge className="bg-yellow-100 text-yellow-700">결제 대기</Badge>
      case 'payment_failed':
        return <Badge className="bg-red-100 text-red-700">결제 실패</Badge>
      case 'reserved':
        return <Badge className="bg-blue-100 text-blue-700">예약 완료</Badge>
      case 'contacted':
        return <Badge className="bg-purple-100 text-purple-700">작가 연락</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">촬영 완료</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-700">취소됨</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount)
  }

  const canEdit = (inquiry: InquiryWithDetails) => {
    return inquiry.status && inquiry.status !== 'completed' && inquiry.status !== 'cancelled'
  }

  const hasPayment = (inquiry: InquiryWithDetails) => {
    return inquiry.payment && inquiry.payment.length > 0 && inquiry.payment[0].paid_at
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter & Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date Filter */}
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                기간별 필터
              </Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="전체 기간" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 기간</SelectItem>
                  <SelectItem value="1month">최근 1개월</SelectItem>
                  <SelectItem value="3months">최근 3개월</SelectItem>
                  <SelectItem value="6months">최근 6개월</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                검색
              </Label>
              <Input
                placeholder="상품명 또는 작가명으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            총 {filteredInquiries.length}건의 예약 내역
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
      {filteredInquiries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              {searchQuery || dateFilter !== 'all' ? '검색 결과가 없습니다' : '예약 내역이 없습니다'}
            </p>
            {!searchQuery && dateFilter === 'all' && (
              <Link href="/photographers">
                <Button className="mt-4">작가 둘러보기</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => (
            <Card key={inquiry.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    {/* Photographer Info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={inquiry.photographer?.profile_image_url || undefined} />
                        <AvatarFallback>
                          <Camera className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {inquiry.photographer?.name || '작가'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {inquiry.product?.name || '촬영 예약'}
                        </CardDescription>
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3 h-3" />
                      촬영 희망일: {inquiry.desired_date ? format(new Date(inquiry.desired_date), 'yyyy년 M월 d일', { locale: ko }) : '-'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(inquiry.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">예약자</span>
                    <p className="font-medium flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {inquiry.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">인원</span>
                    <p className="font-medium">{inquiry.people_count}명</p>
                  </div>
                  {inquiry.payment && inquiry.payment.length > 0 && (
                    <div>
                      <span className="text-gray-600">결제 금액</span>
                      <p className="font-semibold text-lg">{formatAmount(inquiry.payment[0].amount)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">연락처</span>
                    <p className="font-medium">{inquiry.phone}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDetailsClick(inquiry)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    상세 보기
                  </Button>
                  {canEdit(inquiry) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(inquiry)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                  )}
                  {hasPayment(inquiry) && inquiry.payment![0].order_id && (
                    <Link href={`/payment/success?orderId=${inquiry.payment![0].order_id}`}>
                      <Button variant="outline" size="sm">
                        <CreditCard className="w-4 h-4 mr-1" />
                        결제 확인
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>예약 상세 정보</DialogTitle>
            <DialogDescription>
              예약 정보를 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4">
              {/* Photographer Info */}
              {selectedInquiry.photographer && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">작가 정보</h3>
                    <Link href={`/photographers/${selectedInquiry.photographer.id}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        작가 상세 보기
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={selectedInquiry.photographer.profile_image_url || undefined} />
                      <AvatarFallback>
                        <Camera className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{selectedInquiry.photographer.name}</p>
                      <p className="text-sm text-gray-600">{selectedInquiry.photographer.email}</p>
                      {selectedInquiry.photographer.bio && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{selectedInquiry.photographer.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">상품</span>
                  <p className="font-medium">{selectedInquiry.product?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">예약자</span>
                  <p className="font-medium">{selectedInquiry.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">성별</span>
                  <p className="font-medium">
                    {selectedInquiry.gender === 'male' ? '남성' : selectedInquiry.gender === 'female' ? '여성' : '기타'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">연락처</span>
                  <p className="font-medium">{selectedInquiry.phone}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">촬영 희망일</span>
                  <p className="font-medium">
                    {selectedInquiry.desired_date ? format(new Date(selectedInquiry.desired_date), 'yyyy-MM-dd') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">인원</span>
                  <p className="font-medium">{selectedInquiry.people_count}명</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">상태</span>
                  <div>{getStatusBadge(selectedInquiry.status)}</div>
                </div>
              </div>

              {/* Optional Fields */}
              {(selectedInquiry.relationship ||
                selectedInquiry.special_request ||
                selectedInquiry.difficulty_note ||
                selectedInquiry.conversation_preference ||
                selectedInquiry.conversation_topics ||
                selectedInquiry.favorite_music ||
                selectedInquiry.shooting_meaning) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">추가 정보</h3>
                  {selectedInquiry.relationship && (
                    <div>
                      <span className="text-sm text-gray-600">관계</span>
                      <p className="text-sm">{selectedInquiry.relationship}</p>
                    </div>
                  )}
                  {selectedInquiry.special_request && (
                    <div>
                      <span className="text-sm text-gray-600">특별 요청사항</span>
                      <p className="text-sm whitespace-pre-wrap">{selectedInquiry.special_request}</p>
                    </div>
                  )}
                  {selectedInquiry.difficulty_note && (
                    <div>
                      <span className="text-sm text-gray-600">어려운 점</span>
                      <p className="text-sm whitespace-pre-wrap">{selectedInquiry.difficulty_note}</p>
                    </div>
                  )}
                  {selectedInquiry.conversation_preference && (
                    <div>
                      <span className="text-sm text-gray-600">대화 선호도</span>
                      <p className="text-sm">{selectedInquiry.conversation_preference}</p>
                    </div>
                  )}
                  {selectedInquiry.conversation_topics && (
                    <div>
                      <span className="text-sm text-gray-600">대화 주제</span>
                      <p className="text-sm whitespace-pre-wrap">{selectedInquiry.conversation_topics}</p>
                    </div>
                  )}
                  {selectedInquiry.favorite_music && (
                    <div>
                      <span className="text-sm text-gray-600">좋아하는 음악</span>
                      <p className="text-sm whitespace-pre-wrap">{selectedInquiry.favorite_music}</p>
                    </div>
                  )}
                  {selectedInquiry.shooting_meaning && (
                    <div>
                      <span className="text-sm text-gray-600">촬영의 의미</span>
                      <p className="text-sm whitespace-pre-wrap">{selectedInquiry.shooting_meaning}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Info */}
              {selectedInquiry.payment && selectedInquiry.payment.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2">결제 정보</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">주문번호</span>
                      <p className="font-mono text-xs">{selectedInquiry.payment[0].order_id}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">결제 금액</span>
                      <p className="font-semibold">{formatAmount(selectedInquiry.payment[0].amount)}</p>
                    </div>
                    {selectedInquiry.payment[0].paid_at && (
                      <div className="col-span-2">
                        <span className="text-gray-600">결제일</span>
                        <p className="text-xs">
                          {format(new Date(selectedInquiry.payment[0].paid_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>예약 정보 수정</DialogTitle>
            <DialogDescription>
              선택 사항만 수정 가능합니다. (이름, 날짜, 인원수는 수정 불가)
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">예약자</span>
                  <span className="font-medium">{selectedInquiry.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">촬영 희망일</span>
                  <span className="font-medium">
                    {selectedInquiry.desired_date ? format(new Date(selectedInquiry.desired_date), 'yyyy-MM-dd') : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">인원</span>
                  <span className="font-medium">{selectedInquiry.people_count}명</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="relationship">관계</Label>
                  <Input
                    id="relationship"
                    placeholder="예: 친구, 연인, 가족 등"
                    value={editForm.relationship}
                    onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_request">특별 요청사항</Label>
                  <Textarea
                    id="special_request"
                    placeholder="촬영 시 특별히 요청하고 싶은 사항을 입력해주세요"
                    value={editForm.special_request}
                    onChange={(e) => setEditForm({ ...editForm, special_request: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty_note">어려운 점</Label>
                  <Textarea
                    id="difficulty_note"
                    placeholder="촬영 시 어려운 점이나 고민이 있다면 알려주세요"
                    value={editForm.difficulty_note}
                    onChange={(e) => setEditForm({ ...editForm, difficulty_note: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conversation_preference">대화 선호도</Label>
                  <Input
                    id="conversation_preference"
                    placeholder="예: 조용히, 편하게 대화하며, 등"
                    value={editForm.conversation_preference}
                    onChange={(e) => setEditForm({ ...editForm, conversation_preference: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conversation_topics">대화 주제</Label>
                  <Textarea
                    id="conversation_topics"
                    placeholder="촬영 중 나누고 싶은 대화 주제를 입력해주세요"
                    value={editForm.conversation_topics}
                    onChange={(e) => setEditForm({ ...editForm, conversation_topics: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favorite_music">좋아하는 음악</Label>
                  <Textarea
                    id="favorite_music"
                    placeholder="좋아하는 음악이나 아티스트를 알려주세요"
                    value={editForm.favorite_music}
                    onChange={(e) => setEditForm({ ...editForm, favorite_music: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shooting_meaning">촬영의 의미</Label>
                  <Textarea
                    id="shooting_meaning"
                    placeholder="이번 촬영이 어떤 의미인지 알려주세요"
                    value={editForm.shooting_meaning}
                    onChange={(e) => setEditForm({ ...editForm, shooting_meaning: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  필수 정보(이름, 날짜, 인원수)는 수정할 수 없습니다. 변경이 필요한 경우 작가에게 문의해주세요.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEditSubmit} disabled={editLoading}>
              {editLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
