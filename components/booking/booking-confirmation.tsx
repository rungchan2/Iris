"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  CheckCircle,
  AlertCircle,
  Clock3,
  MessageSquare,
  Star,
  Download,
  Share2,
  CalendarDays,
  Timer,
  UserCheck,
  Lightbulb,
  FileText,
  Heart
} from "lucide-react";

interface Inquiry {
  id: string;
  name: string;
  phone: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  assigned_admin_id?: string;
  selected_category_id?: string;
  selected_slot_id?: string;
  special_request?: string;
  gender?: string;
  people_count?: number;
  relationship?: string;
  desired_date?: string;
  current_mood_keywords?: string[];
  desired_mood_keywords?: string[];
  assigned_admin?: {
    name: string;
    email: string;
  };
}

interface BookingConfirmationProps {
  inquiry: Inquiry;
}

export function BookingConfirmation({ inquiry }: BookingConfirmationProps) {
  const [timeUntilShoot, setTimeUntilShoot] = useState("");

  // 상태별 배지 색상
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">촬영 완료</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800">예약 확정</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">확인 대기</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">취소됨</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  // 촬영까지 남은 시간 계산
  useEffect(() => {
    const calculateTimeUntilShoot = () => {
      const shootDateTime = inquiry.desired_date ? new Date(inquiry.desired_date) : new Date();
      const now = new Date();
      const timeDiff = shootDateTime.getTime() - now.getTime();

      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeUntilShoot(`${days}일 ${hours}시간 후`);
        } else if (hours > 0) {
          setTimeUntilShoot(`${hours}시간 ${minutes}분 후`);
        } else {
          setTimeUntilShoot(`${minutes}분 후`);
        }
      } else {
        setTimeUntilShoot("촬영 시간 지났음");
      }
    };

    calculateTimeUntilShoot();
    const interval = setInterval(calculateTimeUntilShoot, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, [inquiry.desired_date]);

  // 촬영 준비 체크리스트
  const preparationChecklist = [
    "편안한 복장 준비 (1-2벌 권장)",
    "메이크업 및 헤어 스타일링",
    "소품 준비 (선택사항)",
    "촬영 장소 확인 및 이동 시간 계산",
    "작가님과 사전 소통 완료",
    "결제 준비 완료"
  ];

  // 촬영 팁
  const shootingTips = [
    "자연스러운 표정과 포즈를 위해 충분한 휴식을 취하세요",
    "좋아하는 음악이나 향수를 준비하여 편안한 분위기를 만드세요",
    "카메라를 의식하지 말고 작가님의 지시에 따라 자연스럽게 행동하세요",
    "다양한 각도와 표정으로 촬영에 임해보세요",
    "궁금한 점이 있으면 언제든 작가님께 문의하세요"
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">예약 확인</h1>
        <p className="text-muted-foreground">
          예약 번호: <span className="font-mono font-medium">#{inquiry.id.slice(-8).toUpperCase()}</span>
        </p>
      </div>

      {/* 예약 상태 요약 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>예약 정보</span>
              </CardTitle>
              <CardDescription>예약이 성공적으로 접수되었습니다</CardDescription>
            </div>
            {getStatusBadge(inquiry.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* 예약자 정보 */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center">
                <User className="h-4 w-4 mr-2" />
                예약자 정보
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="w-12 text-muted-foreground">이름:</span>
                  <span className="font-medium">{inquiry.name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span className="w-11 text-muted-foreground">이메일:</span>
                  <span>{inquiry.assigned_admin?.email || '이메일 없음'}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span className="w-11 text-muted-foreground">연락처:</span>
                  <span>{inquiry.phone}</span>
                </div>
              </div>
            </div>

            {/* 촬영 일정 */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                촬영 일정
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <CalendarDays className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span className="w-11 text-muted-foreground">날짜:</span>
                  <span className="font-medium">{inquiry.desired_date ? new Date(inquiry.desired_date).toLocaleDateString('ko-KR') : '날짜 미정'}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span className="w-11 text-muted-foreground">시간:</span>
                  <span className="font-medium">시간 미정</span>
                </div>
                <div className="flex items-center">
                  <Timer className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span className="w-11 text-muted-foreground">남은시간:</span>
                  <span className="font-medium text-blue-600">{timeUntilShoot}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 담당 작가 정보 */}
          {inquiry.assigned_admin && (
            <div className="pt-4 border-t">
              <h4 className="font-medium flex items-center mb-3">
                <Camera className="h-4 w-4 mr-2" />
                담당 작가
              </h4>
              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {inquiry.assigned_admin.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{inquiry.assigned_admin.name}</p>
                  <p className="text-sm text-muted-foreground">{inquiry.assigned_admin.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* 특별 요청사항 */}
          {inquiry.special_request && (
            <div className="pt-4 border-t">
              <h4 className="font-medium flex items-center mb-2">
                <MessageSquare className="h-4 w-4 mr-2" />
                특별 요청사항
              </h4>
              <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">{inquiry.special_request}</p>
            </div>
          )}

          {/* 관리자 노트 */}
          {inquiry.admin_notes && (
            <div className="pt-4 border-t">
              <h4 className="font-medium flex items-center mb-2">
                <UserCheck className="h-4 w-4 mr-2" />
                작가 메시지
              </h4>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{inquiry.admin_notes}</AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 촬영 준비 체크리스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            촬영 준비 체크리스트
          </CardTitle>
          <CardDescription>완벽한 촬영을 위한 준비사항들을 확인해보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {preparationChecklist.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 촬영 팁 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            촬영 팁
          </CardTitle>
          <CardDescription>더 나은 촬영 결과를 위한 전문가 조언</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shootingTips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼들 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="flex-1" size="lg">
          <Download className="h-4 w-4 mr-2" />
          예약 확인서 다운로드
        </Button>
        <Button variant="outline" className="flex-1" size="lg">
          <Share2 className="h-4 w-4 mr-2" />
          예약 정보 공유
        </Button>
        <Button variant="outline" className="flex-1" size="lg">
          <MessageSquare className="h-4 w-4 mr-2" />
          작가님과 대화
        </Button>
      </div>

      {/* 추가 안내사항 */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium">중요 안내사항</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 촬영 24시간 전까지 일정 변경이 가능합니다</li>
                <li>• 촬영 당일 10분 전까지 도착해 주세요</li>
                <li>• 날씨나 기타 사정으로 인한 일정 조정 시 미리 연락드립니다</li>
                <li>• 문의사항이 있으시면 언제든 연락 주세요</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}