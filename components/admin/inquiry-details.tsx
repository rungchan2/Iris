"use client";

import { useState } from "react";
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
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";
import { Inquiry } from "@/types/inquiry.types";
import { formatTime } from "@/lib/date-fns";

const getGenderLabel = (gender: string) => {
  const genderMap = {
    male: "남성",
    female: "여성",
    other: "기타",
  };
  return genderMap[gender as keyof typeof genderMap] || gender;
};

export function InquiryDetails({ inquiry }: { inquiry: Inquiry }) {
  const supabase = createClient();
  const [status, setStatus] = useState(inquiry.status);
  const [adminNotes, setAdminNotes] = useState(inquiry.admin_notes || "");
  const [isSaving, setIsSaving] = useState(false);

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
      console.error("Error saving notes:", error);
    }
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>문의 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">이름</p>
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
              <p className="text-lg font-medium">@{inquiry.instagram_id}</p>
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
              <p className="text-sm font-medium text-muted-foreground">인원</p>
              <p className="text-lg font-medium">{inquiry.people_count}</p>
            </div>
          </div>

          {inquiry.desired_date && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                예약 날짜
              </p>
              <p className="text-lg font-medium">
                {inquiry.desired_date}{" "}
                {/* {inquiry.selected_slot_id.start_time ? (
                  <>
                    {formatTime(inquiry.selected_slot_id.start_time)}
                    {" ~ "}
                    {formatTime(inquiry.selected_slot_id.end_time)}
                  </>
                ) : (
                  <></>
                )} */}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              생성 날짜
            </p>
            <p className="text-lg font-medium">
              {formatDate(inquiry.created_at)}
            </p>
          </div>

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
                      <span className="mx-1 text-muted-foreground">{">"}</span>
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

          {/* Mood Keywords */}
          {(inquiry.current_mood_keywords.length > 0 ||
            inquiry.desired_mood_keywords.length > 0) && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-4 w-4" />
                <p className="text-sm font-medium text-muted-foreground">
                  분위기 키워드
                </p>
              </div>

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
              placeholder="Add notes about this inquiry..."
              rows={4}
            />
            <Button onClick={saveNotes} disabled={isSaving} className="w-full">
              {isSaving ? "저장중..." : "메모 저장"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
