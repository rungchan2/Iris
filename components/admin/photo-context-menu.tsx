"use client"

import type React from "react"

import { useState } from "react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Eye, Trash2, Download } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Image from "next/image"

interface Photo {
  id: string
  filename: string
  storage_url: string
  thumbnail_url?: string
  width?: number
  height?: number
  size_kb?: number
  created_at: string
  photo_categories?: Array<{
    category_id: string
    categories: {
      id: string
      name: string
      path: string
    }
  }>
}

interface PhotoContextMenuProps {
  photo: Photo
  children: React.ReactNode
  onDelete?: () => void
}

export function PhotoContextMenu({ photo, children, onDelete }: PhotoContextMenuProps) {
  const [viewOpen, setViewOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Delete this photo? This action cannot be undone.")) return

    setDeleting(true)
    const supabase = createClient()

    try {
      // Extract storage path from URL
      const url = new URL(photo.storage_url)
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/photos\/(.+)/)
      const path = pathMatch ? pathMatch[1] : null

      // Delete from storage
      if (path) {
        const { error: storageError } = await supabase.storage.from("photos").remove([path])

        if (storageError) throw storageError
      }

      // Delete photo categories first (foreign key constraint)
      await supabase.from("photo_categories").delete().eq("photo_id", photo.id)

      // Delete from database
      const { error: dbError } = await supabase.from("photos").delete().eq("id", photo.id)

      if (dbError) throw dbError

      toast.success("사진 삭제 성공")
      onDelete?.()
    } catch (error) {
      toast.error("사진 삭제 실패")
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = photo.storage_url
    link.download = photo.filename
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleViewOpen = () => requestAnimationFrame(() => setViewOpen(true))
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleViewOpen} className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            크게 보기
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            다운로드
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "삭제중..." : "삭제"}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">사진 보기 - {photo.filename}</DialogTitle>
          <div className="relative">
            <div className="relative w-full" style={{ maxHeight: '80vh' }}>
              <Image
                src={photo.storage_url || "/placeholder.svg"}
                alt={photo.filename}
                width={photo.width || 1200}
                height={photo.height || 800}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">파일명:</span>
                  <p className="font-mono">{photo.filename}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">크기:</span>
                  <p>{photo.size_kb ? `${photo.size_kb}KB` : "Unknown"}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">크기:</span>
                  <p>{photo.width && photo.height ? `${photo.width} × ${photo.height}` : "Unknown"}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">업로드 일자:</span>
                  <p>{new Date(photo.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {photo.photo_categories && photo.photo_categories.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">카테고리:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {photo.photo_categories.map((pc) => (
                      <Badge key={pc.category_id} variant="secondary">
                        {pc.categories.path}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}