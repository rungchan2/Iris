import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Calendar, MessageSquare, Star, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";

export default async function PhotographersDashboard() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Get photographer data
  const { data: photographer } = await supabase
    .from('photographers')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!photographer) {
    redirect("/login");
  }

  // Get basic stats (mock data for now - you can implement real data later)
  const stats = [
    {
      title: "이번 달 예약",
      value: "12",
      description: "지난달 대비 +20%",
      icon: Calendar,
      trend: "+20%"
    },
    {
      title: "총 리뷰",
      value: "48",
      description: "평균 평점 4.8/5",
      icon: Star,
      trend: "4.8⭐"
    },
    {
      title: "포트폴리오 조회",
      value: "156",
      description: "이번 주 조회수",
      icon: Camera,
      trend: "+12%"
    },
    {
      title: "응답률",
      value: "98%",
      description: "24시간 내 응답",
      icon: MessageSquare,
      trend: "98%"
    }
  ];

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
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
                  새로운 예약 문의가 3건 있습니다. 빠른 답변을 통해 고객 만족도를 높여보세요.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-sm">포트폴리오 업데이트</h4>
                <p className="text-sm text-muted-foreground">
                  최근 촬영한 작품들을 포트폴리오에 추가해보세요. 더 많은 고객들이 볼 수 있습니다.
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-sm">성격유형 매칭</h4>
                <p className="text-sm text-muted-foreground">
                  회원님과 잘 맞는 성격유형은 <strong>A1, B1, E2</strong>입니다. 
                  해당 고객들의 예약이 많이 들어오고 있어요.
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
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Camera className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">포트폴리오 관리</span>
                </div>
                <span className="text-xs text-muted-foreground">→</span>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">예약 관리</span>
                </div>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">3</span>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  <span className="font-medium">리뷰 관리</span>
                </div>
                <span className="text-xs text-muted-foreground">→</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}