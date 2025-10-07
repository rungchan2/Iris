import { InquiryTable } from "@/components/admin/inquiry-table"
import { AdminFilters } from "@/components/admin/admin-filters"
import { Pagination } from "@/components/admin/pagination"
import { createClient } from "@/lib/supabase/server"
import { getUserCookie } from '@/lib/auth/cookie'
import { bookingLogger } from "@/lib/logger"

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
  const user = await getUserCookie()

  // Verify user is authenticated and is a photographer
  if (!user || user.role !== 'photographer') {
    bookingLogger.warn('Unauthorized access attempt to photographer inquiries', { user })
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">문의 관리</h1>
        </div>
        <div className="text-center py-10 text-red-500">
          접근 권한이 없습니다. 사진작가로 로그인해주세요.
        </div>
      </div>
    )
  }

  bookingLogger.info('Fetching inquiries for photographer', { photographerId: user.id, email: user.email })

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
      selected_slot_id:available_slots!inquiries_selected_slot_id_fkey (
        id,
        date,
        start_time,
        end_time
      ),
      photographers:photographer_id (
        id,
        name,
        email
      ),
      products:product_id (
        id,
        name,
        price
      )
    `,
    { count: "exact" },
  )
  .eq("photographer_id", user.id) // Filter by current photographer's ID

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
    bookingLogger.error("Error fetching inquiries:", error)
  } else {
    bookingLogger.info('Successfully fetched inquiries', {
      photographerId: user.id,
      count,
      inquiriesCount: inquiries?.length || 0,
      page,
      status,
      search
    })
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
