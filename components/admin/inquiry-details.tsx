"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { createClient } from "@/lib/supabase/client";
import { Inquiry } from "@/types/inquiry.types";
import { formatDate, formatTime } from "@/lib/date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const getGenderLabel = (gender: string) => {
  const genderMap = {
    male: "남성",
    female: "여성",
    other: "기타",
  };
  return genderMap[gender as keyof typeof genderMap] || gender;
};

export function InquiryDetails({
  inquiry,
  onUpdate,
}: {
  inquiry: Inquiry;
  onUpdate?: (updates: Partial<Inquiry>) => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState(inquiry.status);
  const [adminNotes, setAdminNotes] = useState(inquiry.admin_note || "");
  const [placeRecommendation, setPlaceRecommendation] = useState(
    inquiry.place_recommendation || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaceRecommendationSaving, setIsPlaceRecommendationSaving] =
    useState(false);
  const [categoryRecommendations, setCategoryRecommendations] = useState<{
    male_clothing_recommendation?: string | null;
    female_clothing_recommendation?: string | null;
    accessories_recommendation?: string | null;
  }>({});

  const handleStatusChange = async (
    newStatus: "new" | "contacted" | "completed"
  ) => {
    setStatus(newStatus);

    setIsSaving(true);
    const { error } = await supabase
      .from("inquiries")
      .update({ status: newStatus })
      .eq("id", inquiry.id);

    if (error) {
      console.error("Error updating status:", error);
    } else {
      // 상위 컴포넌트에 업데이트 알림
      onUpdate?.({ status: newStatus });
    }
    setIsSaving(false);
  };

  const saveNotes = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("inquiries")
      .update({ admin_note: adminNotes })
      .eq("id", inquiry.id);

    if (error) {
      toast.error("메모 저장 실패");
    } else {
      toast.success("메모 저장 성공");
      // 상위 컴포넌트에 업데이트 알림
      onUpdate?.({ admin_note: adminNotes });
    }
    setIsSaving(false);
  };

  const savePlaceRecommendation = async () => {
    setIsPlaceRecommendationSaving(true);
    const { error } = await supabase
      .from("inquiries")
      .update({ place_recommendation: placeRecommendation } as any)
      .eq("id", inquiry.id);

    if (error) {
      toast.error("장소 추천 저장 실패");
    } else {
      toast.success("장소 추천 저장 성공");
      // 상위 컴포넌트에 업데이트 알림
      onUpdate?.({ place_recommendation: placeRecommendation });
    }
    setIsPlaceRecommendationSaving(false);
  };

  const handleDeleteInquiry = async () => {
    if (confirm("문의를 삭제하시겠습니까?")) {
      const { error } = await supabase
        .from("inquiries")
        .delete()
        .eq("id", inquiry.id);
      if (error) {
        console.error("Error deleting inquiry:", error);
      }
      router.push("/admin");
    }
  };

  // 카테고리 추천 정보 로드
  useEffect(() => {
    const fetchCategoryRecommendations = async () => {
      if (!inquiry.selection_path || inquiry.selection_path.length === 0)
        return;

      const lastCategoryId = inquiry.selected_category_id || "";

      // Note: These columns don't exist in the current schema
      // Commenting out until schema is updated
      /*
      const { data, error } = await supabase
        .from("categories")
        .select(
          "male_clothing_recommendation, female_clothing_recommendation, accessories_recommendation"
        )
        .eq("id", lastCategoryId)
        .single();

      if (error) {
        console.error("Error fetching category recommendations:", error);
      } else {
        setCategoryRecommendations(data);
      }
      */
      
      // Set empty recommendations for now
      setCategoryRecommendations({});
    };

    fetchCategoryRecommendations();
  }, [inquiry.selected_category_id, supabase]);

  console.log(inquiry);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>문의 정보</CardTitle>
          <p className="text-sm text-muted-foreground">
            문의 날짜: {formatDate(new Date(inquiry.created_at), true)}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  이름
                </p>
                <p className="text-lg font-medium">{inquiry.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  전화번호
                </p>
                <p className="text-lg font-medium">{inquiry.phone}</p>
              </div>
            </div>

            {inquiry.instagram_id && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  인스타그램
                </p>
                <p className="text-lg font-medium">{inquiry.instagram_id}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {inquiry.gender && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    성별
                  </p>
                  <p className="text-lg font-medium capitalize">
                    {getGenderLabel(inquiry.gender)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  인원
                </p>
                <p className="text-lg font-medium">{inquiry.people_count}</p>
              </div>
            </div>

            {inquiry.desired_date && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  예약 날짜
                </p>
                <p className="text-lg font-medium">
                  {inquiry.selected_slot_id?.date ? formatDate(inquiry.selected_slot_id?.date) : "날짜 미정"} {" / "}
                  {inquiry.selected_slot_id?.start_time ? (
                    <>
                      {formatTime(inquiry.selected_slot_id.start_time)}
                      {" ~ "}
                      {formatTime(inquiry.selected_slot_id.end_time)}
                    </>
                  ) : (
                    <></>
                  )}
                </p>
              </div>
            )}

            {inquiry.selection_path && inquiry.selection_path.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  선택한 카테고리
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {inquiry.selection_path.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-lg font-medium">{item}</span>
                      {index < inquiry.selection_path!.length - 1 && (
                        <span className="mx-1 text-muted-foreground">
                          {">"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inquiry.special_request && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  특별 요청
                </p>
                <p className="text-lg">{inquiry.special_request}</p>
              </div>
            )}
            {inquiry.difficulty_note && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  어려운 점
                </p>
                <p className="text-lg">{inquiry.difficulty_note}</p>
              </div>
            )}

            {/* 4가지 촬영 전 질문 */}
            {(inquiry.conversation_preference || inquiry.conversation_topics || inquiry.favorite_music || inquiry.shooting_meaning) && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  촬영 전 질문
                </p>
                <div className="space-y-3">
                  {inquiry.conversation_preference && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        처음 보는 사람과 대화는 많이 or 적게?
                      </p>
                      <p className="text-sm mt-1">{inquiry.conversation_preference}</p>
                    </div>
                  )}
                  {inquiry.conversation_topics && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        어떤 주제로 대화하는 걸 좋아하세요?
                      </p>
                      <p className="text-sm mt-1">{inquiry.conversation_topics}</p>
                    </div>
                  )}
                  {inquiry.favorite_music && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        좋아하시는 음악이 있으신가요?
                      </p>
                      <p className="text-sm mt-1">{inquiry.favorite_music}</p>
                    </div>
                  )}
                  {inquiry.shooting_meaning && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        이번 촬영은 본인에게 어떤 의미인가요?
                      </p>
                      <p className="text-sm mt-1">{inquiry.shooting_meaning}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 의상/악세서리 추천 - 성별에 따라 조건부 렌더링 */}
            {inquiry.gender &&
              inquiry.gender !== "other" &&
              categoryRecommendations && (
                <>
                  {/* 의상 추천 */}
                  {((inquiry.gender === "male" &&
                    categoryRecommendations.male_clothing_recommendation) ||
                    (inquiry.gender === "female" &&
                      categoryRecommendations.female_clothing_recommendation)) && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {inquiry.gender === "male"
                          ? "남성 의상 추천"
                          : "여성 의상 추천"}
                      </p>
                        <p className="text-lg">
                          {inquiry.gender === "male"
                            ? categoryRecommendations.male_clothing_recommendation
                            : categoryRecommendations.female_clothing_recommendation}
                        </p>
                    </div>
                  )}

                  {/* 악세서리 추천 */}
                  {categoryRecommendations.accessories_recommendation && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        악세서리 추천
                      </p>
                        <p className="text-lg">
                          {categoryRecommendations.accessories_recommendation}
                        </p>
                    </div>
                  )}
                </>
              )}

            {/* Mood Keywords */}
            {(inquiry.current_mood_keywords.length > 0 ||
              inquiry.desired_mood_keywords.length > 0) && (
              <div className="pt-4 border-t">
                <div className="space-y-3">
                  {inquiry.current_mood_keywords.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        현재 분위기
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {inquiry.current_mood_keywords.map((keyword) => (
                          <Badge
                            key={keyword.id}
                            variant="outline"
                            className="bg-blue-50 text-xs"
                          >
                            {keyword.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {inquiry.desired_mood_keywords.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        원하는 분위기
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {inquiry.desired_mood_keywords.map((keyword) => (
                          <Badge
                            key={keyword.id}
                            variant="outline"
                            className="bg-green-50 text-xs"
                          >
                            {keyword.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-muted-foreground">상태</p>
              <Select
                value={status}
                onValueChange={(value: "new" | "contacted" | "completed") =>
                  handleStatusChange(value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue>
                    <StatusBadge status={status} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    <StatusBadge status="new" />
                  </SelectItem>
                  <SelectItem value="contacted">
                    <StatusBadge status="contacted" />
                  </SelectItem>
                  <SelectItem value="completed">
                    <StatusBadge status="completed" />
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-4">
              <p className="text-sm font-medium text-muted-foreground">
                작가 메모
              </p>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="문의 내용을 입력해주세요."
                rows={4}
              />
              <Button
                onClick={saveNotes}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? "저장중..." : "메모 저장"}
              </Button>
            </div>

            <div className="space-y-2 pt-4">
              <p className="text-sm font-medium text-muted-foreground">
                장소 추천
              </p>
              <Textarea
                value={placeRecommendation}
                onChange={(e) => setPlaceRecommendation(e.target.value)}
                placeholder="추천 촬영 장소를 입력해주세요."
                rows={4}
              />
              <Button
                onClick={savePlaceRecommendation}
                disabled={isPlaceRecommendationSaving}
                className="w-full"
              >
                {isPlaceRecommendationSaving ? "저장중..." : "장소 추천 저장"}
              </Button>
            </div>

            
            <Button
              onClick={handleDeleteInquiry}
              disabled={isSaving}
              className="w-full border-red-500 border-1 text-red-500 bg-transparent hover:text-white hover:bg-red-500"
            >
              문의 삭제
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
