"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { StatusBadge } from "@/components/admin/status-badge"
import { formatDate } from "@/lib/utils"
import { useInquiryMutations } from "@/lib/hooks/use-inquiries"
import { Inquiry } from "@/types/inquiry.types"

export function InquiryTable({
  inquiries,
  basePath = "/admin",
  onStatusUpdate
}: {
  inquiries: Inquiry[],
  basePath?: string,
  onStatusUpdate?: (id: string, newStatus: string) => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updateStatus, isUpdatingStatus } = useInquiryMutations()
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Client-side sorting for booking_date to handle nulls properly
  const sortField = searchParams.get('sortField')
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  
  const sortedInquiries = React.useMemo(() => {
    if (!inquiries || sortField !== 'booking_date') {
      return inquiries || []
    }
    
    return [...inquiries].sort((a, b) => {
      const aDate = a.selected_slot_id?.date
      const bDate = b.selected_slot_id?.date
      
      // Handle null values - put them at the end
      if (!aDate && !bDate) return 0
      if (!aDate) return 1
      if (!bDate) return -1
      
      // Compare dates only when mounted
      if (!mounted) return 0
      const comparison = new Date(aDate).getTime() - new Date(bDate).getTime()
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [inquiries, sortField, sortOrder, mounted])

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams)
    const currentSort = params.get('sortField')
    const currentOrder = params.get('sortOrder')
    
    if (currentSort === field) {
      // Toggle order
      params.set('sortOrder', currentOrder === 'desc' ? 'asc' : 'desc')
    } else {
      // New field, default to desc
      params.set('sortField', field)
      params.set('sortOrder', 'desc')
    }
    
    router.push(`?${params.toString()}`)
  }

  const getSortIcon = (field: string) => {
    const currentSort = searchParams.get('sortField')
    const currentOrder = searchParams.get('sortOrder')
    
    if (currentSort !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    
    return currentOrder === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />
  }

  const handleStatusChange = (id: string, newStatus: "new" | "contacted" | "completed") => {
    updateStatus({ id, status: newStatus })

    // Call optional callback to update parent state
    if (onStatusUpdate) {
      onStatusUpdate(id, newStatus)
    }
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Instagram</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('booking_date')}
                className="h-8 p-2 flex items-center gap-1 font-medium"
              >
                예약일
                {getSortIcon('booking_date')}
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('created_at')}
                className="h-8 p-2 flex items-center gap-1 font-medium"
              >
                신청일
                {getSortIcon('created_at')}
              </Button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!sortedInquiries || sortedInquiries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                {!inquiries ? "데이터를 불러오는 중 오류가 발생했습니다." : "문의가 없습니다."}
              </TableCell>
            </TableRow>
          ) : (
            sortedInquiries.map((inquiry, index) => (
              <TableRow key={inquiry.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{inquiry.name}</TableCell>
                <TableCell>{inquiry.phone}</TableCell>
                <TableCell>{inquiry.instagram_id || "N/A"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 p-0 flex items-center gap-1"
                        disabled={isUpdatingStatus}
                      >
                        <StatusBadge status={inquiry.status} />
                        <ChevronDown size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(inquiry.id, "new")}
                        disabled={inquiry.status === "new"}
                      >
                        <StatusBadge status="new" />
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(inquiry.id, "contacted")}
                        disabled={inquiry.status === "contacted"}
                      >
                        <StatusBadge status="contacted" />
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(inquiry.id, "completed")}
                        disabled={inquiry.status === "completed"}
                      >
                        <StatusBadge status="completed" />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {inquiry.selected_slot_id ? 
                    (mounted ? formatDate(inquiry.selected_slot_id.date + " " + inquiry.selected_slot_id.start_time) : inquiry.selected_slot_id.date + " " + inquiry.selected_slot_id.start_time) : 
                    <span className="text-muted-foreground">미정</span>
                  }
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {mounted ? formatDate(inquiry.created_at) : inquiry.created_at}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`${basePath}/inquiries/${inquiry.id}`}>
                    <Button size="sm" variant="ghost">
                      <Eye size={16} className="mr-1" />
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
