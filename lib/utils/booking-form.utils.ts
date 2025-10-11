/**
 * Booking Form Utilities
 * 예약 폼 관련 유틸리티 함수들
 */

import { format } from "date-fns"

/**
 * 날짜가 예약 가능한지 확인
 */
export function isDateAvailable(date: Date, availableDates: string[]): boolean {
  const dateStr = format(date, "yyyy-MM-dd")
  return availableDates.includes(dateStr)
}

/**
 * 날짜의 예약 상태 모디파이어 반환
 */
export function getDateModifiers(
  date: Date,
  dateSlotCounts: Record<string, { available: number; total: number }>
) {
  const dateStr = format(date, "yyyy-MM-dd")
  const slotCount = dateSlotCounts[dateStr]

  if (!slotCount || slotCount.total === 0) {
    return { available: false, partiallyBooked: false, fullyBooked: false }
  }

  if (slotCount.available === 0) {
    return { available: false, partiallyBooked: false, fullyBooked: true }
  } else if (slotCount.available < slotCount.total) {
    return { available: false, partiallyBooked: true, fullyBooked: false }
  } else {
    return { available: true, partiallyBooked: false, fullyBooked: false }
  }
}

/**
 * 전화번호 포맷팅
 * 010-1234-5678 형식으로 변환
 */
export function formatPhoneNumber(value: string): string {
  // Remove non-digits
  const digitsOnly = value.replace(/\D/g, "")

  // Format based on length
  let formatted = ""
  if (digitsOnly.length <= 3) {
    formatted = digitsOnly
  } else if (digitsOnly.length <= 7) {
    formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`
  } else {
    formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7, 11)}`
  }

  return formatted
}

/**
 * 달력 모디파이어 스타일 설정
 */
export const calendarModifiersStyles = {
  available: {
    backgroundColor: "hsl(142, 76%, 36%)",
    color: "white",
    fontWeight: "bold",
  },
  partiallyBooked: {
    backgroundColor: "hsl(48, 96%, 53%)",
    color: "black",
    fontWeight: "bold",
  },
  fullyBooked: {
    backgroundColor: "hsl(0, 84%, 60%)",
    color: "white",
    fontWeight: "bold",
  },
}
