import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Calendar, MessageSquare, Star, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PhotographersDashboard() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Get photographer data (layout already handles approval check)
  const { data: photographer, error } = await supabase
    .from('photographers')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !photographer) {
    redirect("/login");
  }

  // Get real statistics
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

  // Get inquiries stats
  const { data: thisMonthInquiries } = await supabase
    .from('inquiries')
    .select('id, created_at')
    .eq('photographer_id', photographer.id)
    .gte('created_at', currentMonth.toISOString());

  const { data: lastMonthInquiries } = await supabase
    .from('inquiries')
    .select('id, created_at')
    .eq('photographer_id', photographer.id)
    .gte('created_at', lastMonth.toISOString())
    .lt('created_at', currentMonth.toISOString());

  // Get reviews stats
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating, inquiries!inner(photographer_id)')
    .eq('inquiries.photographer_id', photographer.id)
    .eq('is_submitted', true);

  // Get portfolio stats
  const { data: portfolioPhotos } = await supabase
    .from('photos')
    .select('id, created_at')
    .eq('uploaded_by', photographer.id);

  // Get recent inquiries for response calculation
  const { data: recentInquiries } = await supabase
    .from('inquiries')
    .select('id, created_at, updated_at')
    .eq('photographer_id', photographer.id)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

  // Calculate stats
  const thisMonthCount = thisMonthInquiries?.length || 0;
  const lastMonthCount = lastMonthInquiries?.length || 0;
  const monthlyGrowth = lastMonthCount > 0 ? ((thisMonthCount - lastMonthCount) / lastMonthCount * 100) : 0;

  const totalReviews = reviews?.length || 0;
  const averageRating = totalReviews > 0 
    ? (reviews || []).reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews
    : 0;

  const portfolioCount = portfolioPhotos?.length || 0;

  // Calculate response rate (assuming inquiries with updated_at different from created_at means responded)
  const respondedInquiries = recentInquiries?.filter(inq => {
    const updatedAt = inq.updated_at || inq.created_at;
    const createdAt = inq.created_at;
    if (!updatedAt || !createdAt) return false;
    return new Date(updatedAt).getTime() > new Date(createdAt).getTime();
  })?.length || 0;
  const responseRate = (recentInquiries?.length || 0) > 0 
    ? Math.round((respondedInquiries / (recentInquiries?.length || 1)) * 100)
    : 0;

  const stats = [
    {
      title: "이번 달 예약",
      value: thisMonthCount.toString(),
      description: `지난달 대비 ${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth.toFixed(0)}%`,
      icon: Calendar,
      trend: `${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth.toFixed(0)}%`
    },
    {
      title: "총 리뷰",
      value: totalReviews.toString(),
      description: `평균 평점 ${averageRating.toFixed(1)}/5`,
      icon: Star,
      trend: `${averageRating.toFixed(1)}⭐`
    },
    {
      title: "포트폴리오",
      value: portfolioCount.toString(),
      description: "업로드된 사진",
      icon: Camera,
      trend: `${portfolioCount}개`
    },
    {
      title: "응답률",
      value: `${responseRate}%`,
      description: "최근 30일",
      icon: MessageSquare,
      trend: `${responseRate}%`
    }
  ];

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <div className="flex items-center pt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600 font-medium">
                  {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>환영합니다, {photographer.name}님!</CardTitle>
            <CardDescription>
              작가 대시보드에서 예약 현황과 포트폴리오를 관리하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-4">
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold text-sm">최근 예약 현황</h4>
                <p className="text-sm text-muted-foreground">
                  새로운 예약 문의가 {thisMonthCount}건 있습니다. 빠른 답변을 통해 고객 만족도를 높여보세요.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-sm">포트폴리오 업데이트</h4>
                <p className="text-sm text-muted-foreground">
                  포트폴리오에 {portfolioCount}개의 작품이 있습니다. 최근 촬영한 작품들을 추가해보세요.
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-sm">리뷰 현황</h4>
                <p className="text-sm text-muted-foreground">
                  {totalReviews}개의 리뷰를 받았으며 평균 평점은 <strong>{averageRating.toFixed(1)}점</strong>입니다.
                  고객 만족도가 높아지고 있어요!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>빠른 작업</CardTitle>
            <CardDescription>자주 사용하는 기능들</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/photographer-admin/photos" className="block">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Camera className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">포트폴리오 관리</span>
                  </div>
                  <span className="text-xs text-muted-foreground">→</span>
                </div>
              </Link>
              
              <Link href="/photographer-admin/inquiries" className="block">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">예약 관리</span>
                  </div>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">{thisMonthCount}</span>
                </div>
              </Link>
              
              <Link href="/photographer-admin/reviews" className="block">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <span className="font-medium">리뷰 관리</span>
                  </div>
                  <span className="text-xs text-muted-foreground">→</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}