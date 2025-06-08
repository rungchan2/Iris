"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { DateRange } from "react-day-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function DateRangeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const fromDate = searchParams.get('bookingFrom')
  const toDate = searchParams.get('bookingTo')
  
  const dateRange: DateRange | undefined = fromDate || toDate ? {
    from: fromDate ? new Date(fromDate + 'T00:00:00') : undefined,
    to: toDate ? new Date(toDate + 'T00:00:00') : undefined,
  } : undefined

  const handleDateRangeChange = (range: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams)
    
    if (range?.from) {
      // Use local date string to avoid timezone issues
      const year = range.from.getFullYear()
      const month = String(range.from.getMonth() + 1).padStart(2, '0')
      const day = String(range.from.getDate()).padStart(2, '0')
      params.set('bookingFrom', `${year}-${month}-${day}`)
    } else {
      params.delete('bookingFrom')
    }
    
    if (range?.to) {
      // Use local date string to avoid timezone issues
      const year = range.to.getFullYear()
      const month = String(range.to.getMonth() + 1).padStart(2, '0')
      const day = String(range.to.getDate()).padStart(2, '0')
      params.set('bookingTo', `${year}-${month}-${day}`)
    } else {
      params.delete('bookingTo')
    }
    
    // Reset to first page when filtering
    params.set('page', '1')
    
    router.push(`?${params.toString()}`)
  }

  const clearDateRange = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('bookingFrom')
    params.delete('bookingTo')
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <DateRangePicker
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        placeholder="예약일 범위 선택"
      />
      {dateRange && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearDateRange}
          className="h-10 w-10"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
} 