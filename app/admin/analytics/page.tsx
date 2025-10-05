import { Metadata } from "next";
import { MatchingAnalyticsDashboard } from "@/components/admin/analytics/matching-analytics-dashboard";

export const metadata: Metadata = {
  title: "매칭 성능 분석 - kindt 관리자",
  description: "10문항 매칭 시스템의 성능, 사용자 행동, 작가별 성과를 분석합니다.",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">매칭 성능 분석</h1>
        <p className="text-muted-foreground">
          10문항 매칭 시스템의 성능, 사용자 행동 패턴, 작가별 성과를 종합적으로 분석합니다.
        </p>
      </div>
      
      <MatchingAnalyticsDashboard />
    </div>
  );
}