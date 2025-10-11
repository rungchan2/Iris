import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type InquiryStatus, INQUIRY_STATUS, INQUIRY_STATUS_LABELS } from "@/types"

interface StatusBadgeProps {
  status: InquiryStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        status === INQUIRY_STATUS.NEW && "bg-blue-100 text-blue-800 hover:bg-blue-100",
        status === INQUIRY_STATUS.PENDING_PAYMENT && "bg-purple-100 text-purple-800 hover:bg-purple-100",
        status === INQUIRY_STATUS.PAYMENT_FAILED && "bg-red-100 text-red-800 hover:bg-red-100",
        status === INQUIRY_STATUS.RESERVED && "bg-green-100 text-green-800 hover:bg-green-100",
        status === INQUIRY_STATUS.CONTACTED && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        status === INQUIRY_STATUS.COMPLETED && "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
        status === INQUIRY_STATUS.CANCELLED && "bg-gray-100 text-gray-800 hover:bg-gray-100",
        status === INQUIRY_STATUS.EXPIRED && "bg-orange-100 text-orange-800 hover:bg-orange-100",
      )}
    >
      {INQUIRY_STATUS_LABELS[status]}
    </Badge>
  )
}
