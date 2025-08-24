import { InquiryTable } from "@/components/admin/inquiry-table"
import { AdminFilters } from "@/components/admin/admin-filters"
import { Pagination } from "@/components/admin/pagination"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    status?: string
    sort?: string
    search?: string
    sortField?: string
    sortOrder?: string
    bookingFrom?: string
    bookingTo?: string
  }>
}) {
  const supabase = await createClient()
  
  // Get current photographer
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const params = await searchParams
  const page = Number.parseInt(params.page || "1")
  const status = params.status || "all"
  const sort = params.sort || "newest"
  const search = params.search || ""
  const sortField = params.sortField
  const sortOrder = params.sortOrder || "desc"
  const bookingFrom = params.bookingFrom
  const bookingTo = params.bookingTo

  const pageSize = 20
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1

  let query = supabase.from("inquiries").select(
    `
      *,
      categories (
        id,
        name,
        path
      ),
      selected_slot_id (
        id,
        date,
        start_time,
        end_time
      )
    `,
    { count: "exact" },
  )
  .eq("photographer_id", user.id) // Much faster direct FK filtering

  // Apply status filter
  if (status !== "all") {
    query = query.eq("status", status as "new" | "contacted" | "completed")
  }

  // Apply search
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  // Apply booking date range filter
  if (bookingFrom || bookingTo) {
    // Only filter inquiries that have a selected slot
    query = query.not('selected_slot_id', 'is', null)
    
    if (bookingFrom) {
      query = query.gte('selected_slot_id.date', bookingFrom)
    }
    if (bookingTo) {
      query = query.lte('selected_slot_id.date', bookingTo)
    }
  }

  // Apply sorting - avoid booking_date sorting on server side due to Supabase limitations
  if (sortField === 'created_at') {
    query = query.order("created_at", { ascending: sortOrder === 'asc' })
  } else if (!sortField || sortField === 'booking_date') {
    // Default sorting or booking_date sorting (will be handled client-side)
    if (sort === "newest") {
      query = query.order("created_at", { ascending: false })
    } else {
      query = query.order("created_at", { ascending: true })
    }
  } else {
    // Fallback to created_at sorting
    query = query.order("created_at", { ascending: false })
  }

  // Apply pagination
  query = query.range(start, end)

  const { data: inquiries, count, error } = await query

  if (error) {
    console.error("Error fetching inquiries:", error.message)
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">문의 관리</h1>
      </div>

      <AdminFilters
        currentStatus={status}
        currentSort={sort}
        initialSearch={search}
      />

      <InquiryTable inquiries={(inquiries || []) as any} basePath="/photographer-admin" />

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  )
}
