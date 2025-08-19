"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useEffect } from "react"

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

interface PhotoDetailModalProps {
  photo: Photo | null
  open: boolean
  onClose: () => void
}

export function PhotoDetailModal({ photo, open, onClose }: PhotoDetailModalProps) {
  // Global cleanup when modal opens/closes
  useEffect(() => {
    if (open) {
      // Store original state
      const originalBodyStyle = document.body.style.cssText
      const originalDocumentStyle = document.documentElement.style.cssText
      
      return () => {
        // Restore original state when modal closes
        setTimeout(() => {
          document.body.style.cssText = originalBodyStyle
          document.documentElement.style.cssText = originalDocumentStyle
          
          // Force remove any Radix artifacts
          document.querySelectorAll('[data-radix-focus-scope]').forEach(el => {
            el.removeAttribute('data-radix-focus-scope')
          })
          document.querySelectorAll('[data-radix-focus-guard]').forEach(el => {
            el.remove()
          })
          
          // Reset focus
          if (document.activeElement && document.activeElement !== document.body) {
            ;(document.activeElement as HTMLElement).blur()
          }
        }, 100)
      }
    }
  }, [open])

  const handleClose = () => {
    onClose()
  }

  if (!photo) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogTitle className="sr-only">사진 보기 - {photo.filename}</DialogTitle>
        <div className="relative">
          <img
            src={photo.storage_url || "/placeholder.svg"}
            alt={photo.filename}
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">파일명:</span>
                <p className="font-mono">{photo.filename}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">파일 크기:</span>
                <p>{photo.size_kb ? `${photo.size_kb}KB` : "Unknown"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">이미지 크기:</span>
                <p>{photo.width && photo.height ? `${photo.width} × ${photo.height}` : "Unknown"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">업로드 일자:</span>
                <p>{new Date(photo.created_at).toLocaleDateString()}</p>
              </div>
              {photo.uploaded_by && (
                <div className="col-span-2">
                  <span className="font-medium text-muted-foreground">업로더 ID:</span>
                  <p className="font-mono text-xs break-all">{photo.uploaded_by}</p>
                </div>
              )}
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
  )
}