import { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/admin/analytics/analytics-dashboard";
import { PermissionGuard } from "@/components/auth/permission-guard";

export const metadata: Metadata = {
  title: "통계 및 분석 - Iris 관리자",
  description: "성향 진단, 예약, AI 이미지 생성 등 전체 시스템의 통계와 분석을 확인합니다.",
};

export default function AnalyticsPage() {
  return (
    <PermissionGuard 
      requiredPermission="analytics"
      fallbackMessage="통계 및 분석 권한이 없습니다. 관리자만 접근 가능합니다."
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">통계 및 분석</h1>
          <p className="text-muted-foreground">
            성향 진단, 예약, AI 이미지 생성 등 전체 시스템의 성과와 추이를 분석합니다.
          </p>
        </div>
        
        <AnalyticsDashboard />
      </div>
    </PermissionGuard>
  );
}