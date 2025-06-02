import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { InquiryTable } from "@/components/admin/inquiry-table"
import { SearchBar } from "@/components/admin/search-bar"
import { FilterDropdown } from "@/components/admin/filter-dropdown"
import { SortDropdown } from "@/components/admin/sort-dropdown"
import { Pagination } from "@/components/admin/pagination"

export default async function AdminPage({
  searchParams,
}: {
  searchParams: {
    page?: string
    status?: string
    sort?: string
    search?: string
  }
}) {
  const supabase = createServerComponentClient({ cookies })

  const page = Number.parseInt(searchParams.page || "1")
  const status = searchParams.status || "all"
  const sort = searchParams.sort || "newest"
  const search = searchParams.search || ""

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
      )
    `,
    { count: "exact" },
  )

  // Apply status filter
  if (status !== "all") {
    query = query.eq("status", status)
  }

  // Apply search
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  // Apply sorting
  if (sort === "newest") {
    query = query.order("created_at", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: true })
  }

  // Apply pagination
  query = query.range(start, end)

  const { data: inquiries, count, error } = await query

  if (error) {
    console.error("Error fetching inquiries:", error)
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inquiry Management</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <FilterDropdown currentStatus={status} />
          <SortDropdown currentSort={sort} />
        </div>
        <SearchBar initialSearch={search} />
      </div>

      <InquiryTable inquiries={inquiries || []} />

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  )
}
