"use client"
import { adminLogger } from "@/lib/logger"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X, Download } from "lucide-react"
import html2canvas from "html2canvas-pro"
import { formatDate, formatTime } from "@/lib/date-fns"
import { PhotoGallery } from "./photo-gallery"
import { Inquiry } from "@/types/inquiry.types"
import { StatusBadge } from "./status-badge"

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
import { toast } from "sonner"

interface InquiryExportPopupProps {
  inquiry: Inquiry
  photos: Photo[]
  isOpen: boolean
  onClose: () => void
}

interface FieldOption {
  key: string
  label: string
  section: "basic" | "details" | "notes"
}

const getGenderLabel = (gender: string) => {
  const genderMap = {
    male: "남성",
    female: "여성", 
    other: "기타",
  }
  return genderMap[gender as keyof typeof genderMap] || gender
}

export function InquiryExportPopup({ inquiry, photos, isOpen, onClose }: InquiryExportPopupProps) {
  const captureRef = useRef<HTMLDivElement>(null)
  const [categoryRecommendations, setCategoryRecommendations] = useState<{
    male_clothing_recommendation?: string | null;
    female_clothing_recommendation?: string | null;
    accessories_recommendation?: string | null;
  }>({})
  
  // 내보낼 수 있는 필드들 정의
  const fieldOptions: FieldOption[] = [
    { key: "name", label: "이름", section: "basic" },
    { key: "phone", label: "전화번호", section: "basic" },
    { key: "instagram_id", label: "인스타그램", section: "basic" },
    { key: "gender", label: "성별", section: "basic" },
    { key: "people_count", label: "인원수", section: "basic" },
    { key: "desired_date", label: "예약 날짜/시간", section: "basic" },
    { key: "selection_path", label: "선택한 카테고리", section: "details" },
    { key: "current_mood_keywords", label: "현재 분위기 키워드", section: "details" },
    { key: "desired_mood_keywords", label: "원하는 분위기 키워드", section: "details" },
    { key: "special_request", label: "특별 요청", section: "notes" },
    { key: "difficulty_note", label: "어려운 점", section: "notes" },
    { key: "admin_note", label: "작가 메모", section: "notes" },
    { key: "place_recommendation", label: "장소 추천", section: "notes" },
    { key: "male_clothing_recommendation", label: "남성 의상 추천", section: "notes" },
    { key: "female_clothing_recommendation", label: "여성 의상 추천", section: "notes" },
    { key: "accessories_recommendation", label: "악세서리 추천", section: "notes" },
    { key: "status", label: "상태", section: "basic" },
    { key: "created_at", label: "문의 날짜", section: "basic" },
  ]

  const [selectedFields, setSelectedFields] = useState<string[]>([
    "name", "phone", "people_count", "desired_date", "selection_path"
  ])
  const [includePhotos, setIncludePhotos] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // 카테고리 추천 정보 로드
  useEffect(() => {
    const fetchCategoryRecommendations = async () => {
      if (!inquiry.selected_category_id) return;

      // Note: These columns don't exist in the current schema
      // If needed in the future, create a server action in lib/actions/categories.ts
      // For now, set empty recommendations
      setCategoryRecommendations({});
    };

    if (isOpen) {
      fetchCategoryRecommendations();
    }
  }, [isOpen, inquiry.selected_category_id])

  const handleFieldToggle = (fieldKey: string) => {
    adminLogger.info("Toggling field:", fieldKey);
    setSelectedFields(prev => {
      const newFields = prev.includes(fieldKey) 
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey];
      adminLogger.info("New selected fields:", newFields);
      return newFields;
    })
  }

  const handleSelectAll = (section: "basic" | "details" | "notes") => {
    let sectionFields = fieldOptions.filter(f => f.section === section).map(f => f.key)
    
    // 성별에 따라 해당하는 의상 추천만 포함
    if (section === "notes") {  
      if (inquiry.gender === "male") {
        sectionFields = sectionFields.filter(f => f !== "female_clothing_recommendation")
      } else if (inquiry.gender === "female") {
        sectionFields = sectionFields.filter(f => f !== "male_clothing_recommendation")
      } else if (inquiry.gender === "other" || !inquiry.gender) {
        sectionFields = sectionFields.filter(f => f !== "male_clothing_recommendation" && f !== "female_clothing_recommendation" && f !== "accessories_recommendation")
      }
    }
    
    const allSelected = sectionFields.every(field => selectedFields.includes(field))
    
    if (allSelected) {
      setSelectedFields(prev => prev.filter(f => !sectionFields.includes(f)))
    } else {
      setSelectedFields(prev => [...new Set([...prev, ...sectionFields])])
    }
  }

  const handleExport = async () => {
    if (!captureRef.current) return
    
    setIsExporting(true)
    try {
      // oklch 색상을 오버라이드하는 임시 스타일 추가
      const tempStyle = document.createElement('style')
      tempStyle.textContent = `
        .export-safe {
          --background: #ffffff !important;
          --foreground: #030712 !important;
          --card: #ffffff !important;
          --card-foreground: #030712 !important;
          --popover: #ffffff !important;
          --popover-foreground: #030712 !important;
          --primary: #111827 !important;
          --primary-foreground: #f9fafb !important;
          --secondary: #f8fafc !important;
          --secondary-foreground: #111827 !important;
          --muted: #f8fafc !important;
          --muted-foreground: #64748b !important;
          --accent: #f8fafc !important;
          --accent-foreground: #111827 !important;
          --destructive: #dc2626 !important;
          --destructive-foreground: #ffffff !important;
          --border: #e2e8f0 !important;
          --input: #e2e8f0 !important;
          --ring: #94a3b8 !important;
        }
      `
      document.head.appendChild(tempStyle)

      // 캡처할 요소에 export-safe 클래스 추가
      captureRef.current.classList.add('export-safe')

      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        ignoreElements: (element) => {
          // 필요한 경우 특정 요소 무시
          return false
        },
        onclone: (clonedDoc) => {
          // 클론된 문서에서도 oklch 제거
          const clonedElement = clonedDoc.querySelector('.export-safe') as HTMLElement
          if (clonedElement) {
            clonedElement.style.setProperty('--background', '#ffffff', 'important')
            clonedElement.style.setProperty('--foreground', '#030712', 'important')
            clonedElement.style.setProperty('--card', '#ffffff', 'important')
            clonedElement.style.setProperty('--card-foreground', '#030712', 'important')
          }
        }
      })

      // 임시 스타일과 클래스 제거
      document.head.removeChild(tempStyle)
      captureRef.current.classList.remove('export-safe')

      const dataUrl = canvas.toDataURL("image/png", 0.95)
      
      // 파일 다운로드
      const link = document.createElement("a")
      const date = new Date().toISOString().split("T")[0]
      link.download = `inquiry-${inquiry.name}-${date}.png`
      link.href = dataUrl
      link.click()

      toast.success("문의 정보가 PNG로 내보내기 되었습니다!")
      onClose()
    } catch (error) {
      adminLogger.error("Export error:", error)
      toast.error("내보내기 중 오류가 발생했습니다.")
    } finally {
      setIsExporting(false)
    }
  }

  const renderFieldContent = (fieldKey: string) => {
    switch (fieldKey) {
      case "name":
        return <p className="text-lg font-medium">{inquiry.name}</p>
      case "phone":
        return <p className="text-lg font-medium">{inquiry.phone}</p>
      case "instagram_id":
        return inquiry.instagram_id ? <p className="text-lg font-medium">@{inquiry.instagram_id}</p> : null
      case "gender":
        return inquiry.gender ? <p className="text-lg font-medium">{getGenderLabel(inquiry.gender)}</p> : null
      case "people_count":
        return <p className="text-lg font-medium">{inquiry.people_count}명</p>
      case "desired_date":
        return (
          <p className="text-lg font-medium">
            {formatDate(inquiry.desired_date)}{" "}
            {inquiry.selected_slot_id?.start_time && (
              <>
                {formatTime(inquiry.selected_slot_id.start_time)}
                {" ~ "}
                {formatTime(inquiry.selected_slot_id.end_time)}
              </>
            )}
          </p>
        )
      case "selection_path":
        return inquiry.selection_path && inquiry.selection_path.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {inquiry.selection_path.map((item: string, index: number) => (
              <div key={index} className="flex items-center">
                <span className="text-lg font-medium">{item}</span>
                {index < inquiry.selection_path!.length - 1 && (
                  <span className="mx-1 text-muted-foreground">{">"}</span>
                )}
              </div>
            ))}
          </div>
        ) : null
      case "current_mood_keywords":
        return inquiry.current_mood_keywords && inquiry.current_mood_keywords.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">현재 분위기</p>
            <div className="flex flex-wrap gap-1">
              {inquiry.current_mood_keywords.map((keyword: string) => (
                <Badge key={keyword} variant="outline" className="bg-blue-50 text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        ) : null
      case "desired_mood_keywords":
        return inquiry.desired_mood_keywords && inquiry.desired_mood_keywords.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">원하는 분위기</p>
            <div className="flex flex-wrap gap-1">
              {inquiry.desired_mood_keywords.map((keyword: string) => (
                <Badge key={keyword} variant="outline" className="bg-green-50 text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        ) : null
      case "special_request":
        return inquiry.special_request ? <p className="text-lg">{inquiry.special_request}</p> : null
      case "difficulty_note":
        return inquiry.difficulty_note ? <p className="text-lg">{inquiry.difficulty_note}</p> : null
      case "admin_note":
        return inquiry.admin_note ? <p className="text-lg">{inquiry.admin_note}</p> : null
      case "place_recommendation":
        return inquiry.place_recommendation ? <p className="text-lg">{inquiry.place_recommendation}</p> : null
      case "male_clothing_recommendation":
        adminLogger.info("Rendering male clothing:", categoryRecommendations.male_clothing_recommendation);
        return categoryRecommendations.male_clothing_recommendation ? <p className="text-lg">{categoryRecommendations.male_clothing_recommendation}</p> : null
      case "female_clothing_recommendation":
        adminLogger.info("Rendering female clothing:", categoryRecommendations.female_clothing_recommendation);
        return categoryRecommendations.female_clothing_recommendation ? <p className="text-lg">{categoryRecommendations.female_clothing_recommendation}</p> : null
      case "accessories_recommendation":
        adminLogger.info("Rendering accessories:", categoryRecommendations.accessories_recommendation);
        return categoryRecommendations.accessories_recommendation ? <p className="text-lg">{categoryRecommendations.accessories_recommendation}</p> : null
      case "status":
        return <StatusBadge status={inquiry.status} />
      case "created_at":
        return <p className="text-lg font-medium">{formatDate(inquiry.created_at)}</p>
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[100vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">문의 정보 내보내기</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* 왼쪽: 옵션 선택 */}
          <div className="w-1/3 p-6 border-r overflow-y-auto">
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">기본 정보</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSelectAll("basic")}
                  >
                    전체선택
                  </Button>
                </div>
                <div className="space-y-2">
                  {fieldOptions.filter(f => f.section === "basic").map((field) => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.key}
                        checked={selectedFields.includes(field.key)}
                        onCheckedChange={() => handleFieldToggle(field.key)}
                      />
                      <label htmlFor={field.key} className="text-sm cursor-pointer">
                        {field.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>  

              {/* 상세 정보 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">상세 정보</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSelectAll("details")}
                  >
                    전체선택
                  </Button>
                </div>
                <div className="space-y-2">
                  {fieldOptions.filter(f => f.section === "details").map((field) => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.key}
                        checked={selectedFields.includes(field.key)}
                        onCheckedChange={() => handleFieldToggle(field.key)}
                      />
                      <label htmlFor={field.key} className="text-sm cursor-pointer">
                        {field.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 메모 및 요청사항 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">메모 및 요청사항</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSelectAll("notes")}
                  >
                    전체선택
                  </Button>
                </div>
                <div className="space-y-2">
                  {fieldOptions.filter(f => f.section === "notes").filter(field => {
                    // 성별에 따라 해당하는 의상 추천만 표시
                    if (field.key === "male_clothing_recommendation") {
                      return inquiry.gender === "male"
                    }
                    if (field.key === "female_clothing_recommendation") {
                      return inquiry.gender === "female"
                    }
                    if (field.key === "accessories_recommendation") {
                      return inquiry.gender !== "other" && inquiry.gender
                    }
                    return true
                  }).map((field) => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.key}
                        checked={selectedFields.includes(field.key)}
                        onCheckedChange={() => handleFieldToggle(field.key)}
                      />
                      <label htmlFor={field.key} className="text-sm cursor-pointer">
                        {field.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 사진 갤러리 포함 여부 */}
              <div>
                <h3 className="font-medium mb-3">사진 갤러리</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-photos"
                    checked={includePhotos}
                    onCheckedChange={(checked) => setIncludePhotos(!!checked)}
                  />
                  <label htmlFor="include-photos" className="text-sm cursor-pointer">
                    사진 갤러리 포함 ({photos.length}장)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 미리보기 */}
          <div className="flex-1 overflow-y-auto">
            <div ref={captureRef} className="p-8 bg-white">
              <div className="space-y-6">
                {/* 헤더 */}
                <div className="text-center border-b pb-4">
                  <h1 className="text-2xl font-bold mb-2">문의 상세 정보</h1>
                  <p className="text-sm text-gray-500">
                    접수일: {formatDate(inquiry.created_at)}
                  </p>
                </div>

                {/* 선택된 필드들 표시 */}
                <div className="grid gap-4">
                  {selectedFields.map((fieldKey) => {
                    const field = fieldOptions.find(f => f.key === fieldKey)
                    
                    // 카테고리 추천 필드들은 데이터가 로드된 후에만 렌더링
                    if ((fieldKey === "male_clothing_recommendation" || 
                         fieldKey === "female_clothing_recommendation" || 
                         fieldKey === "accessories_recommendation") && 
                        !categoryRecommendations) {
                      return null
                    }
                    
                    const content = renderFieldContent(fieldKey)
                    
                    if (!field || !content) return null

                    return (
                      <div key={fieldKey} className="border-b pb-3">
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          {field.label}
                        </p>
                        {content}
                      </div>
                    )
                  })}
                </div>

                {/* 사진 갤러리 */}
                {includePhotos && photos.length > 0 && (
                  <div className="border-t pt-6">
                    <PhotoGallery photos={photos} isForExport={true} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-end gap-2 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || selectedFields.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "내보내는 중..." : "PNG로 내보내기"}
          </Button>
        </div>
      </div>
    </div>
  )
} 