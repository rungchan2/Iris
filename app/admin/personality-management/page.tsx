import { Metadata } from "next";
import { PersonalityManagementDashboard } from "@/components/admin/personality-management/dashboard";

export const metadata: Metadata = {
  title: "성향 진단 시스템 관리 | Iris Admin",
  description: "성격유형 데이터, 진단 통계, 질문 관리 등 성향 진단 시스템을 관리합니다.",
};

export default function PersonalityManagementPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">성향 진단 시스템 관리</h2>
          <p className="text-muted-foreground">
            성격유형 데이터, 진단 통계, 질문 관리를 통합 관리합니다.
          </p>
        </div>
      </div>
      
      <PersonalityManagementDashboard />
    </div>
  );
}