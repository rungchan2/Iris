"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/admin/status-badge"
import { formatDate } from "@/lib/utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
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
  admin_notes?: string
  categories?: {
    id: string
    name: string
    path: string
    representative_image_url?: string
  }
}

export function InquiryDetails({ inquiry }: { inquiry: Inquiry }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [status, setStatus] = useState(inquiry.status)
  const [adminNotes, setAdminNotes] = useState(inquiry.admin_notes || "")
  const [isSaving, setIsSaving] = useState(false)

  const handleStatusChange = async (newStatus: "new" | "contacted" | "completed") => {
    setStatus(newStatus)

    setIsSaving(true)
    const { error } = await supabase.from("inquiries").update({ status: newStatus }).eq("id", inquiry.id)

    if (error) {
      console.error("Error updating status:", error)
    }
    setIsSaving(false)
  }

  const saveNotes = async () => {
    setIsSaving(true)
    const { error } = await supabase.from("inquiries").update({ admin_notes: adminNotes }).eq("id", inquiry.id)

    if (error) {
      console.error("Error saving notes:", error)
    }
    setIsSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inquiry Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg font-medium">{inquiry.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-lg font-medium">{inquiry.phone}</p>
            </div>
          </div>

          {inquiry.instagram_id && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Instagram</p>
              <p className="text-lg font-medium">@{inquiry.instagram_id}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {inquiry.gender && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                <p className="text-lg font-medium capitalize">{inquiry.gender}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">People Count</p>
              <p className="text-lg font-medium">{inquiry.people_count}</p>
            </div>
          </div>

          {inquiry.desired_date && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Desired Date</p>
              <p className="text-lg font-medium">{inquiry.desired_date}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground">Created At</p>
            <p className="text-lg font-medium">{formatDate(inquiry.created_at)}</p>
          </div>

          {inquiry.selection_path && inquiry.selection_path.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Selected Category</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {inquiry.selection_path.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-lg font-medium">{item}</span>
                    {index < inquiry.selection_path!.length - 1 && (
                      <span className="mx-1 text-muted-foreground">{">"}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {inquiry.special_request && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Special Request</p>
              <p className="text-lg">{inquiry.special_request}</p>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Select
              value={status}
              onValueChange={(value: "new" | "contacted" | "completed") => handleStatusChange(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue>
                  <StatusBadge status={status} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <StatusBadge status="new" />
                </SelectItem>
                <SelectItem value="contacted">
                  <StatusBadge status="contacted" />
                </SelectItem>
                <SelectItem value="completed">
                  <StatusBadge status="completed" />
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-4">
            <p className="text-sm font-medium text-muted-foreground">Admin Notes</p>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about this inquiry..."
              rows={4}
            />
            <Button onClick={saveNotes} disabled={isSaving} className="w-full">
              {isSaving ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
