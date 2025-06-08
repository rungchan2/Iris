"use client"

import { useState } from "react"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { PhotoUploader } from "@/components/admin/photo-uploader"
import { PhotoGrid } from "@/components/admin/photo-grid"
import { PhotoFilters } from "@/components/admin/photo-filters"
import { CategoryAssignModal } from "@/components/admin/category-assign-modal"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const PHOTOS_PER_PAGE = 500

interface Photo {
  id: string
  filename: string
  storage_url: string
  thumbnail_url?: string | null
  width?: number | null
  height?: number | null
  size_kb?: number | null
  uploaded_by?: string | null
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
  photo_categories?: Array<{
    category_id: string
    categories: {
      id: string
      name: string
      path: string
    }
  }>
}

interface Category {
  id: string
  parent_id: string | null
  name: string
  path: string
  depth: number
  is_active: boolean
}

interface PhotoManagerProps {
  categories: Category[]
  userId: string
  initialPage: number
  filterCategory?: string
  showUnassigned: boolean
}

export function PhotoManager({ categories, userId, initialPage, filterCategory, showUnassigned }: PhotoManagerProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Infinite query for photos
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["photos", filterCategory, showUnassigned],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("photos")
        .select(
          `
          *,
          photo_categories (
            category_id,
            categories (
              id,
              name,
              path
            )
          )
        `,
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(pageParam * PHOTOS_PER_PAGE, (pageParam + 1) * PHOTOS_PER_PAGE - 1)

      if (filterCategory) {
        // Use inner join to only get photos that have the specific category
        query = supabase
          .from("photos")
          .select(
            `
            *,
            photo_categories!inner (
              category_id,
              categories (
                id,
                name,
                path
              )
            )
          `,
          )
          .eq("is_active", true)
          .eq("photo_categories.category_id", filterCategory)
          .order("created_at", { ascending: false })
          .range(pageParam * PHOTOS_PER_PAGE, (pageParam + 1) * PHOTOS_PER_PAGE - 1)
      }

      if (showUnassigned) {
        // For unassigned photos, we need to use a different approach
        const { data: allPhotos } = await supabase
          .from("photos")
          .select(
            `
            *,
            photo_categories (
              category_id
            )
          `,
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .range(pageParam * PHOTOS_PER_PAGE, (pageParam + 1) * PHOTOS_PER_PAGE - 1)

        const unassignedPhotos = allPhotos?.filter((photo) => !photo.photo_categories?.length) || []
        return unassignedPhotos as any
      }

      const { data, error } = await query
      if (error) throw error
      return data as any
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === PHOTOS_PER_PAGE ? pages.length : undefined
    },
    initialPageParam: 0,
  })

  // Mutation for category assignment
  const assignCategories = useMutation({
    mutationFn: async ({ photoIds, categoryIds }: { photoIds: string[]; categoryIds: string[] }) => {
      // Delete existing assignments for these photos
      await supabase.from("photo_categories").delete().in("photo_id", photoIds)

      // Insert new assignments
      const assignments = photoIds.flatMap((photoId) =>
        categoryIds.map((categoryId) => ({
          photo_id: photoId,
          category_id: categoryId,
        })),
      )

      if (assignments.length > 0) {
        const { error } = await supabase.from("photo_categories").insert(assignments)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] })
      setSelectedPhotos(new Set())
      toast.success("Categories assigned successfully")
    },
    onError: (error) => {
      console.error("Error assigning categories:", error)
      toast.error("Failed to assign categories")
    },
  })

  // Mutation for bulk delete
  const deletePhotos = useMutation({
    mutationFn: async (photoIds: string[]) => {
      const supabase = createClient()

      // Get photo info for storage deletion
      const { data: photos } = await supabase.from("photos").select("storage_url").in("id", photoIds)

      // Extract storage paths from URLs
      const paths = photos
        ?.map((photo) => {
          const url = new URL(photo.storage_url)
          const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/photos\/(.+)/)
          return pathMatch ? pathMatch[1] : null
        })
        .filter((path): path is string => path !== null) || []

      // Delete from storage
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from("photos").remove(paths)

        if (storageError) throw storageError
      }

      // Delete photo categories first (foreign key constraint)
      await supabase.from("photo_categories").delete().in("photo_id", photoIds)

      // Delete from database
      const { error: dbError } = await supabase.from("photos").delete().in("id", photoIds)

      if (dbError) throw dbError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] })
      setSelectedPhotos(new Set())
      toast.success("Photos deleted successfully")
    },
    onError: (error) => {
      toast.error("Failed to delete photos")
      console.error(error)
    },
  })

  const photos = data?.pages.flat() || []

  const handlePhotoSelect = (photoId: string, selected: boolean) => {
    const newSelection = new Set(selectedPhotos)
    if (selected) {
      newSelection.add(photoId)
    } else {
      newSelection.delete(photoId)
    }
    setSelectedPhotos(newSelection)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedPhotos(new Set(photos.map((p) => p.id)))
    } else {
      setSelectedPhotos(new Set())
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <PhotoUploader
        userId={userId}
        onUploadComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["photos"] })
        }}
      />

      {/* Filters */}
      <PhotoFilters categories={categories} selectedCategory={filterCategory} showUnassigned={showUnassigned} />

      {/* Bulk Actions */}
      {selectedPhotos.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedPhotos.size} 개의 사진이 선택되었습니다.</span>
          <Button onClick={() => setAssignModalOpen(true)} size="sm">
            카테고리 할당
          </Button>
          <Button
            onClick={() => {
              if (confirm(`Delete ${selectedPhotos.size} photos? This action cannot be undone.`)) {
                deletePhotos.mutate(Array.from(selectedPhotos))
              }
            }}
            size="sm"
            variant="destructive"
            disabled={deletePhotos.isPending}
          >
            {deletePhotos.isPending ? "삭제중..." : "선택한 사진 삭제"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedPhotos(new Set())}>
            선택 초기화
          </Button>
        </div>
      )}

      {/* Photo Grid */}
      <PhotoGrid
        photos={photos}
        selectedPhotos={selectedPhotos}
        onPhotoSelect={handlePhotoSelect}
        onSelectAll={handleSelectAll}
        onLoadMore={fetchNextPage}
        hasMore={hasNextPage}
        isLoading={isFetchingNextPage}
        filterCategoryId={filterCategory}
      />

      {/* Category Assignment Modal */}
      <CategoryAssignModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        categories={categories}
        selectedPhotos={Array.from(selectedPhotos)}
        onAssign={(categoryIds) => {
          assignCategories.mutate({
            photoIds: Array.from(selectedPhotos),
            categoryIds,
          })
          setAssignModalOpen(false)
        }}
      />
    </div>
  )
}
