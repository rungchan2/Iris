'use server'

import { createClient } from '@/lib/supabase/server'

export interface PublicReview {
  id: string
  reviewer_name: string | null
  rating: number
  comment: string
  created_at: string
  photographer: {
    id: string
    name: string
    specialty?: string
    experience?: string
    profile_image_url?: string
  }
  personality?: string
}

export async function getPublicReviews() {
  try {
    const supabase = await createClient()
    
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        reviewer_name,
        rating,
        comment,
        created_at,
        inquiries!inner (
          id,
          photographer_id,
          photographers!photographer_id (
            id,
            name,
            directing_style,
            created_at,
            profile_image_url
          )
        )
      `)
      .eq('is_public', true)
      .eq('is_submitted', true)
      .not('rating', 'is', null)
      .not('comment', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching public reviews:', error.message)
      return { error: error.message }
    }

    if (!reviews || reviews.length === 0) {
      return { data: [] }
    }

    // Transform the data to match the component interface
    const transformedReviews: PublicReview[] = reviews
      .filter(review => review.inquiries?.photographers)
      .map(review => {
        const photographer = review.inquiries.photographers
        const experience = photographer?.created_at 
          ? Math.floor((new Date().getTime() - new Date(photographer.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)) + 1
          : 3

        return {
          id: review.id,
          reviewer_name: review.reviewer_name,
          rating: review.rating || 5,
          comment: review.comment || '',
          created_at: review.created_at || '',
          photographer: {
            id: photographer?.id || '',
            name: photographer?.name || '작가',
            specialty: photographer?.directing_style || '포트레이트',
            experience: `${experience}년차`,
            profile_image_url: photographer?.profile_image_url
          },
          personality: '감성 기록자' // TODO: 실제 성격 유형 매핑 추가
        }
      })

    return { data: transformedReviews }
  } catch (error) {
    console.error('Error in getPublicReviews:', error)
    return { error: 'Failed to fetch reviews' }
  }
}