'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StarDisplay } from '@/components/review/star-rating'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Eye, EyeOff, User, UserX } from 'lucide-react'

interface Review {
  id: string
  rating: number | null
  comment: string | null
  is_public: boolean | null
  is_anonymous: boolean | null
  created_at: string | null
  inquiries?: {
    id: string
    name: string
    matched_admin_id?: string | null
  }
}

interface Photographer {
  id: string
  name: string | null
  email: string | null
}

interface AdminAllReviewsManagementProps {
  reviews: Review[]
  photographers: Photographer[]
}

export function AdminAllReviewsManagement({ 
  reviews, 
  photographers 
}: AdminAllReviewsManagementProps) {
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>('all')
  const [filterTab, setFilterTab] = useState<string>('all')

  // Filter reviews based on selected photographer
  const filteredReviews = reviews.filter(review => {
    if (selectedPhotographer === 'all') return true
    return review.inquiries?.matched_admin_id === selectedPhotographer
  })

  // Further filter based on tab
  const displayReviews = filteredReviews.filter(review => {
    if (filterTab === 'public') return review.is_public === true
    if (filterTab === 'private') return review.is_public !== true
    return true
  })

  // Get photographer name for a review
  const getPhotographerName = (review: Review) => {
    const photographer = photographers.find(p => p.id === review.inquiries?.matched_admin_id)
    return photographer?.name || '알 수 없음'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>리뷰 목록</CardTitle>
            <CardDescription>모든 작가의 리뷰를 확인하고 관리하세요</CardDescription>
          </div>
          <Select value={selectedPhotographer} onValueChange={setSelectedPhotographer}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="작가 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 작가</SelectItem>
              {photographers.map((photographer) => (
                <SelectItem key={photographer.id} value={photographer.id}>
                  {photographer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filterTab} onValueChange={setFilterTab}>
          <TabsList>
            <TabsTrigger value="all">
              전체 ({filteredReviews.length})
            </TabsTrigger>
            <TabsTrigger value="public">
              공개 ({filteredReviews.filter(r => r.is_public === true).length})
            </TabsTrigger>
            <TabsTrigger value="private">
              비공개 ({filteredReviews.filter(r => r.is_public !== true).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filterTab} className="mt-4">
            {displayReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {selectedPhotographer === 'all' 
                  ? '표시할 리뷰가 없습니다'
                  : '선택한 작가의 리뷰가 없습니다'}
              </div>
            ) : (
              <div className="space-y-4">
                {displayReviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <StarDisplay rating={review.rating || 0} size="sm" />
                          <span className="text-sm font-medium">
                            {review.rating || 0}점
                          </span>
                          <Badge variant={review.is_public === true ? 'default' : 'secondary'}>
                            {review.is_public === true ? (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                공개
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                비공개
                              </>
                            )}
                          </Badge>
                          <Badge variant={review.is_anonymous === true ? 'outline' : 'secondary'}>
                            {review.is_anonymous === true ? (
                              <>
                                <UserX className="w-3 h-3 mr-1" />
                                익명
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3 mr-1" />
                                실명
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          작가: <span className="font-medium">{getPhotographerName(review)}</span>
                          {' • '}
                          고객: <span className="font-medium">{review.inquiries?.name || '알 수 없음'}</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {review.created_at ? format(new Date(review.created_at), 'yyyy년 MM월 dd일', { locale: ko }) : '날짜 없음'}
                      </div>
                    </div>
                    
                    {review.comment && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {review.comment}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}