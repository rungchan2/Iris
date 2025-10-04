"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import { useAvailableSlotsByDate } from "@/lib/hooks/use-available-slots";

interface TimeSlotSelectorProps {
  date: Date;
  selectedSlotId?: string;
  onSelect: (slotId: string) => void;
  photographerId?: string;
}

export function TimeSlotSelector({
  date,
  selectedSlotId,
  onSelect,
  photographerId,
}: TimeSlotSelectorProps) {
  const { data: slots = [], isLoading: loading, error } = useAvailableSlotsByDate(date, photographerId);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">
          시간대를 불러오는 중입니다...
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">이 날짜에는 시간대가 설정되지 않았습니다.</p>
        <p className="text-sm">다른 날짜를 선택해주세요.</p>
      </div>
    );
  }

  const availableSlots = slots.filter(slot => slot.is_available);
  const bookedSlots = slots.filter(slot => !slot.is_available);

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        {availableSlots.length > 0 ? (
          <>
            {availableSlots.length}개의 예약 가능한 시간대가 있습니다.{" "}
            {format(date, "yyyy년 MM월 dd일")}
            {bookedSlots.length > 0 && (
              <span className="block mt-1">
                {bookedSlots.length}개의 시간대가 이미 예약되었습니다.
              </span>
            )}
          </>
        ) : bookedSlots.length > 0 ? (
          <>
            이 날짜의 모든 시간대가 예약 마감되었습니다.{" "}
            {format(date, "yyyy년 MM월 dd일")}
            <span className="block mt-1 text-red-600">
              {bookedSlots.length}개의 시간대가 모두 예약되었습니다.
            </span>
          </>
        ) : (
          <>
            이 날짜에는 시간대가 설정되지 않았습니다.{" "}
            {format(date, "yyyy년 MM월 dd일")}
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {/* Available slots first */}
        {availableSlots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;

          return (
            <Button
              type="button"
              key={slot.id}
              variant={isSelected ? "default" : "outline"}
              className={`p-4 h-auto text-center transition-all hover:scale-105 w-full ${
                isSelected ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
              onClick={() => onSelect(slot.id)}
            >
              <div className="space-y-2">
                <div className="font-semibold">
                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </div>

                <div className="text-xs text-muted-foreground">
                  작가: {(slot as any).photographers?.name}
                </div>

                <Badge variant="secondary" className="text-xs">
                  {slot.duration_minutes}분
                </Badge>
              </div>
            </Button>
          );
        })}

        {/* Booked slots */}
        {bookedSlots.map((slot) => (
          <Button
            type="button"
            key={slot.id}
            variant="outline"
            disabled
            className="p-4 h-auto text-center w-full opacity-50 cursor-not-allowed"
          >
            <div className="space-y-2">
              <div className="font-semibold">
                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
              </div>

              <div className="text-xs text-muted-foreground">
                작가: {(slot as any).photographers?.name}
              </div>

              <div className="flex items-center justify-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  예약 마감
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {slot.duration_minutes}분
                </Badge>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
