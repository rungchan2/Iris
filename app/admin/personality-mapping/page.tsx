import { Metadata } from "next";
import { PersonalityMappingManagement } from "@/components/admin/personality-mapping/personality-mapping-management";

export const metadata: Metadata = {
  title: "성격유형 매칭 관리 - Iris 관리자",
  description: "작가의 성격유형별 호환성과 매칭 설정을 관리합니다.",
};

export default function PersonalityMappingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">성격유형 매칭 관리</h1>
        <p className="text-muted-foreground">
          작가별 성격유형 호환성 점수를 설정하고 매칭 알고리즘을 관리합니다.
        </p>
      </div>
      
      <PersonalityMappingManagement />
    </div>
  );
}