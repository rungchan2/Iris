"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

interface Photo {
  id: string
  filename: string
  storage_url: string
  thumbnail_url: string | null
}

interface ImageSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (imageId: string, imageUrl: string) => void
}

export function ImageSelectorModal({ isOpen, onClose, onSelect }: ImageSelectorModalProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  const ITEMS_PER_PAGE = 24
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchPhotos()
      fetchTotalCount()
    }
  }, [isOpen, currentPage, searchTerm])

  const fetchTotalCount = async () => {
    try {
      let query = supabase
        .from("photos")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)

      if (searchTerm) {
        query = query.ilike("filename", `%${searchTerm}%`)
      }

      const { count, error } = await query

      if (error) throw error
      setTotalCount(count || 0)
    } catch (error) {
      console.error("Error fetching total count:", error)
    }
  }

  const fetchPhotos = async () => {
    setIsLoading(true)
    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      let query = supabase
        .from("photos")
        .select("id, filename, storage_url, thumbnail_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (searchTerm) {
        query = query.ilike("filename", `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setPhotos(data || [])
    } catch (error) {
      console.error("Error fetching photos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const handleSelect = () => {
    if (selectedPhoto) {
      onSelect(selectedPhoto.id, selectedPhoto.storage_url)
    }
  }

  const handleClose = () => {
    setSelectedPhoto(null)
    setSearchTerm("")
    setCurrentPage(1)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>대표 이미지 선택</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이미지 검색..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="col-span-full text-center py-8">이미지 로딩중...</div>
            ) : photos.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">이미지가 없습니다.</div>
            ) : (
              photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative aspect-video cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedPhoto?.id === photo.id ? "border-blue-500" : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.thumbnail_url || photo.storage_url}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {totalCount}개 중 {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}개 표시
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSelect} disabled={!selectedPhoto}>
              Select Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
