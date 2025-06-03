"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Category {
  id: string
  name: string
  path: string
  parent_id: string | null
}

interface PhotoFiltersProps {
  categories: Category[]
  selectedCategory?: string
  showUnassigned: boolean
}

export function PhotoFilters({ categories, selectedCategory, showUnassigned }: PhotoFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (categoryId === "all") {
      params.delete("category")
    } else {
      params.set("category", categoryId)
    }
    params.delete("unassigned")
    params.delete("page")
    router.push(`/admin/photos?${params.toString()}`)
  }

  const handleUnassignedToggle = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (showUnassigned) {
      params.delete("unassigned")
    } else {
      params.set("unassigned", "true")
    }
    params.delete("category")
    params.delete("page")
    router.push(`/admin/photos?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push("/admin/photos")
  }

  const hasFilters = selectedCategory || showUnassigned

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Filter by:</label>

        <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.path}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant={showUnassigned ? "default" : "outline"} size="sm" onClick={handleUnassignedToggle}>
          Unassigned Only
        </Button>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedCategory && (
            <Badge variant="secondary">Category: {categories.find((c) => c.id === selectedCategory)?.name}</Badge>
          )}
          {showUnassigned && <Badge variant="secondary">Unassigned</Badge>}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
