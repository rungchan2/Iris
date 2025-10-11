/**
 * BookingSummary Component
 * 예약 정보 요약 카드
 */

import { format } from "date-fns"
import { type Tables } from "@/types"

type Product = Tables<"products">

interface BookingSummaryProps {
  name: string
  phone: string
  desiredDate?: Date
  peopleCount?: number
  selectedProduct?: Product
}

export function BookingSummary({
  name,
  phone,
  desiredDate,
  peopleCount,
  selectedProduct,
}: BookingSummaryProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
      <h4 className="font-semibold">예약 정보 확인</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>예약자:</span>
          <span>{name}</span>
        </div>
        <div className="flex justify-between">
          <span>연락처:</span>
          <span>{phone}</span>
        </div>
        <div className="flex justify-between">
          <span>예약 날짜:</span>
          <span>
            {desiredDate ? format(desiredDate, "yyyy년 M월 d일") : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>인원:</span>
          <span>{peopleCount}명</span>
        </div>
        {selectedProduct && (
          <>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="font-medium">선택 상품:</span>
              <span className="font-medium">{selectedProduct.name}</span>
            </div>
            <div className="flex justify-between">
              <span>금액:</span>
              <span className="text-lg font-bold text-primary">
                {selectedProduct.price?.toLocaleString()}원
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
