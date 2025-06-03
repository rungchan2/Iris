"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Search } from "lucide-react"

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

  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchPhotos()
    }
  }, [isOpen])

  const fetchPhotos = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("photos")
        .select("id, filename, storage_url, thumbnail_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      setPhotos(data || [])
    } catch (error) {
      console.error("Error fetching photos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPhotos = photos.filter((photo) => photo.filename.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleSelect = () => {
    if (selectedPhoto) {
      onSelect(selectedPhoto.id, selectedPhoto.storage_url)
    }
  }

  const handleClose = () => {
    setSelectedPhoto(null)
    setSearchTerm("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Representative Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search photos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="grid grid-cols-4 md:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="col-span-full text-center py-8">Loading photos...</div>
            ) : filteredPhotos.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">No photos found</div>
            ) : (
              filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
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
