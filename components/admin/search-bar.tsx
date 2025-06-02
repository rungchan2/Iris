"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface SearchBarProps {
  initialSearch?: string
}

export function SearchBar({ initialSearch = "" }: SearchBarProps) {
  const [search, setSearch] = useState(initialSearch)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(() => {
      const params = new URLSearchParams(window.location.search)

      if (search) {
        params.set("search", search)
      } else {
        params.delete("search")
      }

      // Reset to page 1 when searching
      params.set("page", "1")

      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const clearSearch = () => {
    setSearch("")

    startTransition(() => {
      const params = new URLSearchParams(window.location.search)
      params.delete("search")
      params.set("page", "1")

      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name or phone..."
          className="pl-8 pr-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-9 w-9"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      <Button type="submit" className="ml-2" disabled={isPending}>
        Search
      </Button>
    </form>
  )
}
