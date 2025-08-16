import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">예약을 찾을 수 없습니다</h1>
            <p className="text-muted-foreground">
              요청하신 예약 정보가 존재하지 않거나 삭제되었을 수 있습니다.
              예약 번호를 다시 확인해 주세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button asChild className="flex-1">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  홈으로 돌아가기
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/admin">
                  <Search className="h-4 w-4 mr-2" />
                  예약 관리
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}