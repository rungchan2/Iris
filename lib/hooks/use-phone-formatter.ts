/**
 * usePhoneFormatter Hook
 * 전화번호 자동 포맷팅 훅
 */

import { useEffect } from "react"
import { UseFormReturn, Path } from "react-hook-form"
import { formatPhoneNumber } from "@/lib/utils/booking-form.utils"

export function usePhoneFormatter<T extends Record<string, any>>(
  form: UseFormReturn<T>
) {
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "phone" && value.phone) {
        const formatted = formatPhoneNumber(value.phone)

        // Only update if it's different to avoid cursor jumping
        if (formatted !== value.phone) {
          form.setValue("phone" as Path<T>, formatted as any)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form])
}
