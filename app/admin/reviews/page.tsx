import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewManagement } from "@/components/admin/review-management";
import { getReviewStats } from "@/lib/actions/reviews";
import { StarDisplay } from "@/components/review/star-rating";
import { 
  MessageSquare, 
  Star, 
  TrendingUp, 
  Users,
  Clock,
  CheckCircle
} from "lucide-react";

async function getInquiriesWithReviews() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get all inquiries for the current photographer
  const { data: inquiries, error: inquiriesError } = await supabase
    .from("inquiries")
    .select(`
      id,
      name,
      phone,
      created_at,
      status
    `)
    .eq("matched_admin_id", user.id)
    .order("created_at", { ascending: false });

  if (inquiriesError) {
    throw new Error("Failed to fetch inquiries");
  }

  // Get all reviews for these inquiries
  const inquiryIds = inquiries?.map(i => i.id) || [];
  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("*")
    .in("inquiry_id", inquiryIds);

  if (reviewsError) {
    throw new Error("Failed to fetch reviews");
  }

  // Group reviews by inquiry_id
  const reviewsByInquiry = (reviews || []).reduce((acc, review) => {
    const inquiryId = review.inquiry_id;
    if (!inquiryId) return acc;
    
    if (!acc[inquiryId]) {
      acc[inquiryId] = [];
    }
    acc[inquiryId].push(review);
    return acc;
  }, {} as Record<string, any[]>);

  return {
    inquiries: inquiries || [],
    reviews: reviewsByInquiry,
  };
}

async function ReviewStats() {
  const statsResult = await getReviewStats();
  
  if (statsResult.error || !statsResult.data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              통계를 불러올 수 없습니다
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { total_reviews, average_rating, rating_distribution } = statsResult.data;
  const pendingReviews = 0; // This would need to be calculated from inquiries without reviews

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 리뷰 수</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total_reviews}</div>
          <p className="text-xs text-muted-foreground">
            고객 후기
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평균 평점</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{average_rating}</span>
            <StarDisplay rating={average_rating} size="sm" />
          </div>
          <p className="text-xs text-muted-foreground">
            5점 만점
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">완료된 리뷰</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{total_reviews}</div>
          <p className="text-xs text-muted-foreground">
            제출 완료
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">대기 중</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{pendingReviews}</div>
          <p className="text-xs text-muted-foreground">
            리뷰 대기
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function ReviewContent() {
  const { inquiries, reviews } = await getInquiriesWithReviews();

  return (
    <div className="space-y-8">
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }>
        <ReviewStats />
      </Suspense>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">리뷰 관리</h2>
            <p className="text-gray-600">
              고객들에게 리뷰 링크를 생성하고 전송하세요
            </p>
          </div>
        </div>

        <ReviewManagement inquiries={inquiries} reviews={reviews} />
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">리뷰 관리</h1>
        <p className="text-gray-600">
          고객 만족도를 확인하고 새로운 리뷰를 요청하세요
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      }>
        <ReviewContent />
      </Suspense>
    </div>
  );
}

export const metadata = {
  title: "리뷰 관리 - Photo4You Admin",
  description: "고객 리뷰를 관리하고 새로운 리뷰 링크를 생성하세요.",
};