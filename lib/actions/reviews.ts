'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export type Review = Tables<'reviews'>
export type ReviewInsert = TablesInsert<'reviews'>
export type ReviewUpdate = TablesUpdate<'reviews'>

export interface ReviewSubmissionData {
  reviewer_name?: string
  rating: number
  comment?: string
  photos?: string[]
  is_public: boolean
  is_anonymous: boolean
}

// Generate a new review link for an inquiry
export async function generateReviewLink(inquiryId: string) {
  try {
    const supabase = await createClient()
    
    // Check if current user is the photographer for this inquiry
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Verify the inquiry belongs to the current photographer
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('id, photographer_id, name, phone')
      .eq('id', inquiryId)
      .eq('photographer_id', user.id)
      .single()

    if (inquiryError || !inquiry) {
      return { error: 'Inquiry not found or unauthorized' }
    }

    // Check if review already exists for this inquiry
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id, review_token, is_submitted, expires_at')
      .eq('inquiry_id', inquiryId)
      .single()

    if (existingReview) {
      // If review exists but not submitted and not expired, return existing token
      if (!existingReview.is_submitted && new Date(existingReview.expires_at!) > new Date()) {
        return { 
          data: { 
            review_token: existingReview.review_token,
            review_url: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${existingReview.review_token}`,
            customer_name: inquiry.name,
            customer_phone: inquiry.phone
          }
        }
      }
      
      // If review is submitted, return error
      if (existingReview.is_submitted) {
        return { error: 'Review has already been submitted for this inquiry' }
      }
      
      // If expired, we'll create a new one below
    }

    // Create new review record
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        inquiry_id: inquiryId,
        is_submitted: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })
      .select('review_token')
      .single()

    if (reviewError || !review) {
      return { error: 'Failed to create review link' }
    }

    const reviewUrl = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${review.review_token}`

    return { 
      data: { 
        review_token: review.review_token,
        review_url: reviewUrl,
        customer_name: inquiry.name,
        customer_phone: inquiry.phone
      }
    }
  } catch (error) {
    console.error('Error generating review link:', error)
    return { error: 'Failed to generate review link' }
  }
}

// Get review by token (for anonymous access)
export async function getReviewByToken(token: string) {
  try {
    const supabase = await createClient()
    
    const { data: review, error } = await supabase
      .from('reviews')
      .select(`
        *,
        inquiries (
          id,
          name,
          photographer_id,
          photographers!photographer_id (
            name,
            bio
          )
        )
      `)
      .eq('review_token', token)
      .single()

    if (error || !review) {
      return { error: 'Review not found' }
    }

    // Check if token is expired
    if (new Date(review.expires_at!) < new Date()) {
      return { error: 'Review link has expired' }
    }

    // Check if already submitted
    if (review.is_submitted) {
      return { error: 'Review has already been submitted' }
    }

    return { data: review }
  } catch (error) {
    console.error('Error fetching review by token:', error)
    return { error: 'Failed to fetch review' }
  }
}

// Submit anonymous review
export async function submitReview(token: string, reviewData: ReviewSubmissionData) {
  try {
    const supabase = await createClient()
    
    // Get the review record
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('id, inquiry_id, is_submitted, expires_at')
      .eq('review_token', token)
      .single()

    if (fetchError || !review) {
      return { error: 'Review not found' }
    }

    // Check if token is expired
    if (new Date(review.expires_at!) < new Date()) {
      return { error: 'Review link has expired' }
    }

    // Check if already submitted
    if (review.is_submitted) {
      return { error: 'Review has already been submitted' }
    }

    // Validate rating
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      return { error: 'Rating must be between 1 and 5' }
    }

    // Update the review with submission data
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        reviewer_name: reviewData.reviewer_name || null,
        rating: reviewData.rating,
        comment: reviewData.comment || null,
        photos: reviewData.photos || null,
        is_public: reviewData.is_public,
        is_anonymous: reviewData.is_anonymous,
        is_submitted: true
      })
      .eq('id', review.id)
      .select()
      .single()

    if (updateError) {
      return { error: 'Failed to submit review ' + updateError.message }
    }

    // Revalidate relevant pages
    revalidatePath('/admin/reviews')
    revalidatePath('/reviews')

    return { data: updatedReview }
  } catch (error) {
    console.error('Error submitting review:', error)
    return { error: 'Failed to submit review ' + error }
  }
}

// Get reviews for a specific inquiry (for photographers)
export async function getReviewsForInquiry(inquiryId: string) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Verify the inquiry belongs to the current photographer
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('id, photographer_id')
      .eq('id', inquiryId)
      .eq('photographer_id', user.id)
      .single()

    if (inquiryError || !inquiry) {
      return { error: 'Inquiry not found or unauthorized' }
    }

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('inquiry_id', inquiryId)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: 'Failed to fetch reviews' }
    }

    return { data: reviews }
  } catch (error) {
    console.error('Error fetching reviews for inquiry:', error)
    return { error: 'Failed to fetch reviews' }
  }
}

// Get all reviews for the current photographer
export async function getPhotographerReviews() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        inquiries (
          id,
          name,
          created_at
        )
      `)
      .eq('inquiries.photographer_id', user.id)
      .eq('is_submitted', true)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: 'Failed to fetch reviews' }
    }

    return { data: reviews }
  } catch (error) {
    console.error('Error fetching photographer reviews:', error)
    return { error: 'Failed to fetch reviews' }
  }
}

// Get public reviews (for public display)
export async function getPublicReviews(limit: number = 20) {
  try {
    const supabase = await createClient()
    
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        reviewer_name,
        rating,
        comment,
        photos,
        is_anonymous,
        created_at,
        inquiries (
          photographers (
            name
          )
        )
      `)
      .eq('is_public', true)
      .eq('is_submitted', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { error: 'Failed to fetch public reviews' }
    }

    return { data: reviews }
  } catch (error) {
    console.error('Error fetching public reviews:', error)
    return { error: 'Failed to fetch public reviews' }
  }
}

// Get review statistics for a photographer
export async function getReviewStats(photographerId?: string) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('reviews')
      .select(`
        rating,
        inquiries!inner (
          photographer_id
        )
      `)
      .eq('is_submitted', true)

    if (photographerId) {
      query = query.eq('inquiries.photographer_id', photographerId)
    } else {
      // Get stats for current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { error: 'Unauthorized' }
      }
      query = query.eq('inquiries.photographer_id', user.id)
    }

    const { data: reviews, error } = await query

    if (error) {
      return { error: 'Failed to fetch review stats' }
    }

    if (!reviews || reviews.length === 0) {
      return { 
        data: { 
          total_reviews: 0, 
          average_rating: 0, 
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } 
        }
      }
    }

    const totalReviews = reviews.length
    const averageRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews
    
    const ratingDistribution = reviews.reduce((dist, review) => {
      const rating = review.rating
      if (rating && rating >= 1 && rating <= 5) {
        dist[rating as keyof typeof dist] = (dist[rating as keyof typeof dist] || 0) + 1
      }
      return dist
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })

    return { 
      data: { 
        total_reviews: totalReviews,
        average_rating: Math.round(averageRating * 10) / 10,
        rating_distribution: ratingDistribution
      }
    }
  } catch (error) {
    console.error('Error fetching review stats:', error)
    return { error: 'Failed to fetch review stats' }
  }
}

// Get inquiries for the current photographer (for review management)
export async function getPhotographerInquiries() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const { data: inquiries, error } = await supabase
      .from('inquiries')
      .select(`
        id,
        name,
        phone,
        created_at,
        status,
        reviews (
          id,
          rating,
          comment,
          is_submitted,
          is_public,
          review_token,
          expires_at,
          created_at
        )
      `)
      .eq('photographer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching photographer inquiries:', error)
      return { error: 'Failed to fetch inquiries' }
    }

    return { data: inquiries }
  } catch (error) {
    console.error('Error in getPhotographerInquiries:', error)
    return { error: 'Failed to fetch inquiries' }
  }
}

// Toggle review visibility (public/private)
export async function toggleReviewVisibility(reviewId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Get the review and verify ownership
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select(`
        id,
        is_public,
        inquiries (
          photographer_id
        )
      `)
      .eq('id', reviewId)
      .single()

    if (fetchError || !review) {
      return { error: 'Review not found' }
    }

    // Check if the current user owns this review's inquiry
    if (review.inquiries?.photographer_id !== user.id) {
      return { error: 'Unauthorized' }
    }

    // Toggle visibility
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({ is_public: !review.is_public })
      .eq('id', reviewId)
      .select()
      .single()

    if (updateError) {
      return { error: 'Failed to update review visibility' }
    }

    revalidatePath('/admin/reviews')
    revalidatePath('/reviews')

    return { data: updatedReview }
  } catch (error) {
    console.error('Error toggling review visibility:', error)
    return { error: 'Failed to update review visibility' }
  }
}