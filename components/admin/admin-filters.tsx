"use client"

import { SearchBar } from "@/components/admin/search-bar"
import { FilterDropdown } from "@/components/admin/filter-dropdown"
import { SortDropdown } from "@/components/admin/sort-dropdown"
import { DateRangeFilter } from "@/components/admin/date-range-filter"

interface AdminFiltersProps {
  currentStatus: string
  currentSort: string
  initialSearch: string
}

export function AdminFilters({ currentStatus, currentSort, initialSearch }: AdminFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <FilterDropdown currentStatus={currentStatus} />
          <SortDropdown currentSort={currentSort} />
        </div>
        <SearchBar initialSearch={initialSearch} />
      </div>
      
      <div className="flex justify-start">
        <DateRangeFilter />
      </div>
    </div>
  )
} 