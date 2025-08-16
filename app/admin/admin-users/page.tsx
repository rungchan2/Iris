import { Metadata } from "next";
import { AdminUsersManagementEnhanced } from "@/components/admin/admin-users/admin-users-management-enhanced";

export const metadata: Metadata = {
  title: "작가 관리 - Iris 관리자",
  description: "작가 계정과 성과 통계를 관리합니다.",
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">작가 관리</h1>
        <p className="text-muted-foreground">
          등록된 작가들의 정보와 성과를 관리할 수 있습니다.
        </p>
      </div>
      
      <AdminUsersManagementEnhanced />
    </div>
  );
}