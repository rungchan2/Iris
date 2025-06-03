"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

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
}

interface PhotoGridProps {
  photos: Photo[]
  selectedPhotos: Set<string>
  onPhotoSelect: (photoId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onLoadMore: () => void
  hasMore?: boolean
  isLoading: boolean
}

export function PhotoGrid({
  photos,
  selectedPhotos,
  onPhotoSelect,
  onSelectAll,
  onLoadMore,
  hasMore,
  isLoading,
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
            if (el) el.indeterminate = someSelected
          }}
          onCheckedChange={(checked) => onSelectAll(!!checked)}
        />
        <label className="text-sm font-medium">
          {selectedPhotos.size > 0 ? `${selectedPhotos.size} selected` : "Select all"}
        </label>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 2xl:grid-cols-20 gap-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group cursor-pointer"
            onClick={() => onPhotoSelect(photo.id, !selectedPhotos.has(photo.id))}
          >
            {/* Checkbox Overlay */}
            <div className="absolute top-1 left-1 z-10">
              <Checkbox
                checked={selectedPhotos.has(photo.id)}
                onCheckedChange={(checked) => onPhotoSelect(photo.id, !!checked)}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/80 border-white/80"
              />
            </div>

            {/* Image */}
            <div className="aspect-square overflow-hidden rounded-md bg-muted">
              <img
                src={photo.thumbnail_url || photo.storage_url}
                alt={photo.filename}
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                loading="lazy"
              />
            </div>

            {/* Category Badges */}
            {photo.photo_categories && photo.photo_categories.length > 0 && (
              <div className="absolute bottom-1 right-1 left-1">
                <div className="flex flex-wrap gap-0.5 justify-end">
                  {photo.photo_categories.slice(0, 2).map((pc) => (
                    <Badge key={pc.category_id} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                      {pc.categories.name}
                    </Badge>
                  ))}
                  {photo.photo_categories.length > 2 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                      +{photo.photo_categories.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Selection Overlay */}
            {selectedPhotos.has(photo.id) && (
              <div className="absolute inset-0 bg-primary/20 border-2 border-primary rounded-md" />
            )}
          </div>
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
        <div className="text-center py-12 text-muted-foreground">
          <p>No photos found. Upload some photos to get started.</p>
        </div>
      )}
    </div>
  )
}
