"use client"

import { useRouter, usePathname } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { INQUIRY_STATUS, INQUIRY_STATUS_LABELS } from "@/types"

interface FilterDropdownProps {
  currentStatus: string
}

export function FilterDropdown({ currentStatus }: FilterDropdownProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(window.location.search)

    if (value === "all") {
      params.delete("status")
    } else {
      params.set("status", value)
    }

    // Reset to page 1 when filtering
    params.set("page", "1")

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value={INQUIRY_STATUS.NEW}>{INQUIRY_STATUS_LABELS[INQUIRY_STATUS.NEW]}</SelectItem>
        <SelectItem value={INQUIRY_STATUS.PENDING_PAYMENT}>{INQUIRY_STATUS_LABELS[INQUIRY_STATUS.PENDING_PAYMENT]}</SelectItem>
        <SelectItem value={INQUIRY_STATUS.PAYMENT_FAILED}>{INQUIRY_STATUS_LABELS[INQUIRY_STATUS.PAYMENT_FAILED]}</SelectItem>
        <SelectItem value={INQUIRY_STATUS.RESERVED}>{INQUIRY_STATUS_LABELS[INQUIRY_STATUS.RESERVED]}</SelectItem>
        <SelectItem value={INQUIRY_STATUS.CONTACTED}>{INQUIRY_STATUS_LABELS[INQUIRY_STATUS.CONTACTED]}</SelectItem>
        <SelectItem value={INQUIRY_STATUS.COMPLETED}>{INQUIRY_STATUS_LABELS[INQUIRY_STATUS.COMPLETED]}</SelectItem>
        <SelectItem value={INQUIRY_STATUS.CANCELLED}>{INQUIRY_STATUS_LABELS[INQUIRY_STATUS.CANCELLED]}</SelectItem>
        <SelectItem value={INQUIRY_STATUS.EXPIRED}>{INQUIRY_STATUS_LABELS[INQUIRY_STATUS.EXPIRED]}</SelectItem>
      </SelectContent>
    </Select>
  )
}
