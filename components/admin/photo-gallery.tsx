"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"
import { AspectImage } from "../ui/aspect-image"
import Image from "next/image"

interface Photo {
  id: string
  filename: string
  storage_url: string
  thumbnail_url?: string | null
  width?: number | null
  height?: number | null
  size_kb?: number | null
  created_at: string
}

const handleDownload = async (photos: Photo[]) => {
  for (const photo of photos) {
    try {
      const response = await fetch(photo.storage_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }
}


export function PhotoGallery({ photos, isForExport = false }: { photos: Photo[], isForExport?: boolean }) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  if (photos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>사진 갤러리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">사진이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>사진 갤러리</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {photos.length} {photos.length === 1 ? "사진" : "사진들"}
            </span>
            {!isForExport && (
              <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => handleDownload(photos)}>
                <Download className="h-4 w-4" />
                Download All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id}>
                <AspectImage
                  src={photo.thumbnail_url || photo.storage_url}
                  alt={photo.filename}
                  ratio={16 / 9}
                  className="rounded-md cursor-pointer transition-transform hover:scale-105"
                  onClick={() => setSelectedPhoto(photo)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 text-white z-10"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-6 w-6" />
              <span className="sr-only">닫기</span>
            </Button>

            <div className="relative max-h-full max-w-full">
              <Image
                src={selectedPhoto.storage_url || "/placeholder.svg"}
                alt={selectedPhoto.filename}
                width={selectedPhoto.width || 1200}
                height={selectedPhoto.height || 800}
                className="max-h-[90vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
