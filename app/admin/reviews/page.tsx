import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminAllReviewsManagement } from "@/components/admin/admin-all-reviews-management";

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin
  const isAdmin = session.user.user_metadata?.user_type === 'admin'
  if (!isAdmin) {
    redirect("/unauthorized");
  }

  // Get all photographers
  const { data: photographers } = await supabase
    .from("photographers")
    .select("id, name, email")
    .order("name", { ascending: true });

  // Get all reviews with inquiry and photographer information
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      *,
      inquiries!inner (
        id,
        name,
        photographer_id
      )
    `)
    .order("created_at", { ascending: false });

  // Calculate photographer statistics
  const photographerStats = photographers?.map(photographer => {
    const photographerReviews = reviews?.filter(
      review => review.inquiries?.photographer_id === photographer.id
    ) || [];
    
    const totalReviews = photographerReviews.length;
    const averageRating = totalReviews > 0
      ? photographerReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews
      : 0;
    
    const publicReviews = photographerReviews.filter(review => review.is_public === true).length;
    const anonymousReviews = photographerReviews.filter(review => review.is_anonymous === true).length;
    
    // Calculate rating distribution
    const ratingCounts = [0, 0, 0, 0, 0]; // for 1-5 stars
    photographerReviews.forEach(review => {
      if (review.rating && review.rating >= 1 && review.rating <= 5) {
        ratingCounts[review.rating - 1]++;
      }
    });
    
    return {
      ...photographer,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      publicReviews,
      anonymousReviews,
      ratingDistribution: ratingCounts,
      recentReviews: photographerReviews.slice(0, 3)
    };
  }) || [];

  // Sort by average rating (desc) and total reviews (desc)
  photographerStats.sort((a, b) => {
    if (b.averageRating !== a.averageRating) {
      return b.averageRating - a.averageRating;
    }
    return b.totalReviews - a.totalReviews;
  });

  // Calculate overall statistics
  const totalReviews = reviews?.length || 0;
  const overallAverage = totalReviews > 0
    ? reviews?.reduce((sum, review) => sum + (review.rating || 0), 0) || 0 / totalReviews
    : 0;
  const publicReviewsCount = reviews?.filter(review => review.is_public === true).length || 0;
  const anonymousReviewsCount = reviews?.filter(review => review.is_anonymous === true).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">전체 리뷰 관리</h1>
        <p className="text-muted-foreground">모든 작가의 리뷰를 관리하고 통계를 확인하세요</p>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">전체 리뷰</div>
          <div className="text-2xl font-bold">{totalReviews}</div>
          <div className="text-xs text-muted-foreground">총 리뷰 수</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">평균 평점</div>
          <div className="text-2xl font-bold text-yellow-600">
            {Math.round(overallAverage * 10) / 10} ⭐
          </div>
          <div className="text-xs text-muted-foreground">전체 평균</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">공개 리뷰</div>
          <div className="text-2xl font-bold text-green-600">{publicReviewsCount}</div>
          <div className="text-xs text-muted-foreground">
            {totalReviews > 0 ? Math.round((publicReviewsCount / totalReviews) * 100) : 0}% 공개율
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">익명 리뷰</div>
          <div className="text-2xl font-bold text-blue-600">{anonymousReviewsCount}</div>
          <div className="text-xs text-muted-foreground">
            {totalReviews > 0 ? Math.round((anonymousReviewsCount / totalReviews) * 100) : 0}% 익명율
          </div>
        </div>
      </div>

      {/* Photographer Review Statistics */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">작가별 리뷰 통계</h2>
          <p className="text-sm text-muted-foreground">각 작가의 리뷰 현황과 평균 평점을 확인하세요</p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-sm">작가명</th>
                  <th className="text-center p-2 font-medium text-sm">총 리뷰</th>
                  <th className="text-center p-2 font-medium text-sm">평균 평점</th>
                  <th className="text-center p-2 font-medium text-sm">공개 리뷰</th>
                  <th className="text-center p-2 font-medium text-sm">익명 리뷰</th>
                  <th className="text-center p-2 font-medium text-sm">평점 분포</th>
                </tr>
              </thead>
              <tbody>
                {photographerStats.map((photographer) => (
                  <tr key={photographer.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{photographer.name}</div>
                        <div className="text-xs text-muted-foreground">{photographer.email}</div>
                      </div>
                    </td>
                    <td className="text-center p-2">{photographer.totalReviews}</td>
                    <td className="text-center p-2">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-yellow-600">
                          {photographer.averageRating}
                        </span>
                        <span className="text-yellow-500">⭐</span>
                      </div>
                    </td>
                    <td className="text-center p-2 text-green-600">{photographer.publicReviews}</td>
                    <td className="text-center p-2 text-blue-600">{photographer.anonymousReviews}</td>
                    <td className="text-center p-2">
                      <div className="flex items-center justify-center gap-1">
                        {photographer.ratingDistribution.map((count, index) => (
                          <div key={index} className="text-center">
                            <div
                              className="h-16 w-6 bg-gray-200 rounded relative"
                              title={`${index + 1}점: ${count}개`}
                            >
                              <div
                                className="absolute bottom-0 left-0 right-0 bg-yellow-500 rounded"
                                style={{
                                  height: photographer.totalReviews > 0 
                                    ? `${(count / photographer.totalReviews) * 100}%`
                                    : '0%'
                                }}
                              />
                            </div>
                            <div className="text-xs mt-1">{index + 1}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Management Component */}
      <AdminAllReviewsManagement 
        reviews={reviews || []} 
        photographers={photographers || []}
      />
    </div>
  );
}