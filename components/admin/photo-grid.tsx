"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, ImageIcon } from "lucide-react"
import { PhotoContextMenu } from "@/components/admin/photo-context-menu"
import Image from "next/image"

interface Photo {
  id: string
  filename: string
  storage_url: string
  thumbnail_url?: string
  photo_categories?: Array<{
    category_id: string
    categories: {
      id: string
      name: string
      path: string
    }
  }>
  created_at: string
}

interface PhotoGridProps {
  photos: Photo[]
  selectedPhotos: Set<string>
  onPhotoSelect: (photoId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onLoadMore: () => void
  hasMore?: boolean
  isLoading: boolean
  filterCategoryId?: string
}

export function PhotoGrid({
  photos,
  selectedPhotos,
  onPhotoSelect,
  onSelectAll,
  onLoadMore,
  hasMore,
  isLoading,
  filterCategoryId,
}: PhotoGridProps) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  })

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      onLoadMore()
    }
  }, [inView, hasMore, isLoading, onLoadMore])

  const allSelected = photos.length > 0 && selectedPhotos.size === photos.length
  const someSelected = selectedPhotos.size > 0 && selectedPhotos.size < photos.length

  return (
    <div className="space-y-4">
      {/* Select All */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={allSelected}
          ref={(el) => {
            if (el) (el as any).indeterminate = someSelected
          }}
          onCheckedChange={(checked) => onSelectAll(!!checked)}
        />
        <label className="text-sm font-medium">
          {selectedPhotos.size > 0 ? `${selectedPhotos.size} selected` : "Select all"}
        </label>
      </div>

      {/* Photo Grid - Responsive layout for 150x150 thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
        {photos.map((photo) => (
          <PhotoContextMenu
            key={photo.id}
            photo={photo as Photo}
            onDelete={() => {
              // Refresh the grid after delete
              onLoadMore()
            }}
          >
            <div
              className="relative group cursor-pointer w-[150px] h-[150px]"
              onClick={() => onPhotoSelect(photo.id, !selectedPhotos.has(photo.id))}
            >
              {/* Checkbox Overlay */}
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedPhotos.has(photo.id)}
                  onCheckedChange={(checked) => onPhotoSelect(photo.id, !!checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white/90 backdrop-blur border-white/90"
                />
              </div>

              {/* Image - 150x150 */}
              <div className="w-[150px] h-[150px] overflow-hidden rounded-lg bg-muted">
                <Image
                  width={150}
                  height={150}
                  src={photo.thumbnail_url || photo.storage_url}
                  alt={photo.filename}
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                />
              </div>

              {/* Category Badges */}
              {photo.photo_categories && photo.photo_categories.length > 0 && (
                <div className="absolute bottom-2 right-2 left-2">
                  <div className="flex flex-wrap gap-1 justify-end">
                    {(() => {
                      // If filter is applied, only show matching categories
                      const categoriesToShow = filterCategoryId 
                        ? photo.photo_categories.filter(pc => pc.category_id === filterCategoryId)
                        : photo.photo_categories
                      
                      return (
                        <>
                          {categoriesToShow.slice(0, 2).map((pc) => (
                            <Badge
                              key={pc.category_id}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0.5 h-5 bg-white/90 backdrop-blur text-gray-700"
                            >
                              {pc.categories.name}
                            </Badge>
                          ))}
                          {categoriesToShow.length > 2 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0.5 h-5 bg-white/90 backdrop-blur text-gray-700"
                            >
                              +{categoriesToShow.length - 2}
                            </Badge>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Selection Overlay */}
              {selectedPhotos.has(photo.id) && (
                <div className="absolute inset-0 bg-primary/20 border-2 border-primary rounded-lg" />
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
            </div>
          </PhotoContextMenu>
        ))}
      </div>

      {/* Load More Trigger */}
      {hasMore && (
        <div ref={ref} className="flex justify-center py-4">
          {isLoading && <Loader2 className="h-6 w-6 animate-spin" />}
        </div>
      )}

      {/* No Photos Message */}
      {photos.length === 0 && !isLoading && (
        <div className="col-span-full text-center py-16 text-muted-foreground">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="w-8 h-8" />
            </div>
            <p className="text-lg font-medium mb-2">사진이 없습니다.</p>
            <p className="text-sm">사진을 업로드하거나 필터를 조정해주세요.</p>
          </div>
        </div>
      )}
    </div>
  )
}