"use client"

import { useState, useEffect } from "react"
import { AspectImage } from "@/components/ui/aspect-image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useInView } from "react-intersection-observer"
import { X, Download } from "lucide-react"
import { toast } from "sonner"

export interface Photo {
  id: string
  filename: string
  storage_url: string
  created_at: string
  thumbnail_url?: string
  width?: number
  height?: number
  size_kb?: number
  photo_categories?: {
    categories: {
      id: string
      name: string
      path: string
    }
  }[]
}
export const handleDownload = async (photo: Photo | Photo[]) => {
  if (Array.isArray(photo)) {
    photo.forEach(async (p) => {
      await handleDownload(p)
    })
    return
  }
  try {
    const response = await fetch(photo.storage_url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = photo.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    toast.success("사진이 다운로드되었습니다.")
  } catch (error) {
    toast.error("다운로드 중 오류가 발생했습니다.")
  }
}

export function GalleryClient({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPhotos.length === 50)
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  // Load more photos when scrolling
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMore()
    }
  }, [inView, hasMore, loading])

  const loadMore = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("photos")
        .select(`
          *,
          photo_categories (
            categories (
              id,
              name,
              path
            )
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(photos.length, photos.length + 49)

      if (error) {
        toast.error("더 많은 사진을 불러오는 중 오류가 발생했습니다.")
        return
      }

      if (data && data.length > 0) {
        setPhotos((prev) => [...prev, ...(data as any)])
        setHasMore(data.length === 50)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Error loading more photos:", error)
      toast.error("사진을 불러오는 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  

  return (
    <>
      {/* Pinterest-style masonry grid */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
        {photos.map((photo) => (
          <div key={photo.id} className="break-inside-avoid">
            <div className="group relative">
              <AspectImage
                src={photo.storage_url}
                alt={photo.filename}
                ratio={16 / 9}
                className="rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                onClick={() => setSelectedPhoto(photo)}
              />

              {/* Category badges overlay */}
              {photo.photo_categories && photo.photo_categories.length > 0 && (
                <div className="absolute top-2 left-2 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {photo.photo_categories.slice(0, 2).map((pc) => (
                    <Badge
                      key={pc.categories.id}
                      variant="secondary"
                      className="text-xs bg-black/70 text-white border-none"
                    >
                      {pc.categories.name}
                    </Badge>
                  ))}
                  {photo.photo_categories.length > 2 && (
                    <Badge variant="secondary" className="text-xs bg-black/70 text-white border-none">
                      +{photo.photo_categories.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={ref} className="mt-12 flex items-center justify-center">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-muted-foreground">더 많은 사진을 불러오는 중...</span>
            </div>
          ) : (
            <div className="h-20" />
          )}
        </div>
      )}

      {/* End of gallery message */}
      {!hasMore && photos.length > 0 && (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">모든 사진을 확인했습니다.</p>
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">아직 갤러리에 사진이 없습니다.</p>
        </div>
      )}

      {/* Lightbox Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogTitle className="sr-only">{selectedPhoto?.filename || "Photo"}</DialogTitle>
          {selectedPhoto && (
            <div className="relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Download button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-16 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={() => handleDownload(selectedPhoto)}
              >
                <Download className="h-4 w-4" />
              </Button>

              {/* Image */}
              <AspectImage
                src={selectedPhoto.storage_url}
                alt={selectedPhoto.filename}
                ratio={16 / 9}
                objectFit="contain"
                className="w-full max-h-[90vh]"
              />

              {/* Photo info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="text-white">
                  <h3 className="font-semibold mb-2">{selectedPhoto.filename}</h3>
                  {selectedPhoto.photo_categories && selectedPhoto.photo_categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedPhoto.photo_categories.map((pc) => (
                        <Badge
                          key={pc.categories.id}
                          variant="secondary"
                          className="bg-white/20 text-white border-white/30"
                        >
                          {pc.categories.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
