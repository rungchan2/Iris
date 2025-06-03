"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, ChevronDown } from "lucide-react"
import { StatusBadge } from "@/components/admin/status-badge"
import { formatDate } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Inquiry {
  id: string
  name: string
  phone: string
  instagram_id?: string
  gender?: "male" | "female" | "other"
  desired_date?: string
  people_count: number
  selected_category_id?: string
  selection_path?: string[]
  status: "new" | "contacted" | "completed"
  created_at: string
  special_request?: string
  categories?: {
    id: string
    name: string
    path: string
  }
}

export function InquiryTable({ inquiries }: { inquiries: Inquiry[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleStatusChange = async (id: string, newStatus: "new" | "contacted" | "completed") => {
    setUpdatingId(id)

    const { error } = await supabase.from("inquiries").update({ status: newStatus }).eq("id", id)

    if (!error) {
      router.refresh()
    } else {
      console.error("Error updating status:", error)
    }

    setUpdatingId(null)
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inquiries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No inquiries found
              </TableCell>
            </TableRow>
          ) : (
            inquiries.map((inquiry, index) => (
              <TableRow key={inquiry.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{inquiry.name}</TableCell>
                <TableCell>{inquiry.phone}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {inquiry.selection_path ? inquiry.selection_path.join(" > ") : "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 p-0 flex items-center gap-1"
                        disabled={updatingId === inquiry.id}
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
                <TableCell className="hidden md:table-cell">{formatDate(inquiry.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/inquiry/${inquiry.id}`}>
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
