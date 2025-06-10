"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Download } from "lucide-react"
import { InquiryDetails } from "@/components/admin/inquiry-details"
import { PhotoGallery } from "@/components/admin/photo-gallery"
import { InquiryExportPopup } from "@/components/admin/inquiry-export-popup"
import { Inquiry } from "@/types/inquiry.types"
import { Photo } from "@/app/gallery/gallery-client"

interface InquiryDetailClientProps {
  inquiry: Inquiry
  photos: Photo[]
}

export function InquiryDetailClient({ inquiry: initialInquiry, photos }: InquiryDetailClientProps) {
  const [isExportPopupOpen, setIsExportPopupOpen] = useState(false)
  const [inquiry, setInquiry] = useState<Inquiry>(initialInquiry)
  const [popupKey, setPopupKey] = useState(0)

  // inquiry 업데이트 함수
  const handleInquiryUpdate = (updates: Partial<Inquiry>) => {
    setInquiry(prev => ({ ...prev, ...updates }))
  }

  // 팝업 열기 (새로운 key로 리렌더링)
  const handleOpenPopup = () => {
    setPopupKey(prev => prev + 1)
    setIsExportPopupOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mr-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">문의 상세</h1>
        </div>
        <Button 
          onClick={handleOpenPopup}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          정보 내보내기
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <InquiryDetails 
            inquiry={inquiry} 
            onUpdate={handleInquiryUpdate}
          />
        </div>
        <div className="lg:col-span-2">
          <PhotoGallery photos={photos} />
        </div>
      </div>

      <InquiryExportPopup
        key={popupKey}
        inquiry={inquiry}
        photos={photos}
        isOpen={isExportPopupOpen}
        onClose={() => setIsExportPopupOpen(false)}
      />
    </div>
  )
}