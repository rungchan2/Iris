import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusType = "new" | "contacted" | "completed"

interface StatusBadgeProps {
  status: StatusType
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "capitalize",
        status === "new" && "bg-blue-100 text-blue-800 hover:bg-blue-100",
        status === "contacted" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        status === "completed" && "bg-green-100 text-green-800 hover:bg-green-100",
      )}
    >
      {status}
    </Badge>
  )
}
