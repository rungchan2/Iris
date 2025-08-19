"use client"

import type React from "react"

import { useState } from "react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Eye, Trash2, Download } from "lucide-react"
import { PhotoDetailModal } from "@/components/admin/photo-detail-modal"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Photo {
  id: string
  filename: string
  storage_url: string
  thumbnail_url?: string
  width?: number
  height?: number
  size_kb?: number
  uploaded_by?: string | null
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
  
  const handleViewOpen = () => {
    setViewOpen(true)
  }
  
  const handleViewClose = () => {
    setViewOpen(false)
  }

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

      {/* View Modal - Separated Component */}
      <PhotoDetailModal 
        photo={viewOpen ? photo : null}
        open={viewOpen} 
        onClose={handleViewClose} 
      />
    </>
  )
}
