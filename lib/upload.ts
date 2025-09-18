import { createClient } from "@/lib/supabase/client"
import imageCompression from "browser-image-compression"

interface UploadOptions {
  onProgress?: (progress: number) => void
  generateThumbnail?: boolean
}

// Photo 데이터베이스 레코드 타입 정의
interface PhotoRecord {
  id: string
  filename: string
  storage_url: string
  width: number | null
  height: number | null
  size_kb: number | null
  uploaded_by: string | null
  created_at: string | null
  updated_at: string | null
  thumbnail_url: string | null
  is_active: boolean | null
}

interface UploadResult {
  url: string
  thumbnailUrl?: string
  metadata: PhotoRecord
}

// 업로드 결과 타입 정의
interface UploadResultWithStatus {
  success: boolean
  url?: string
  thumbnailUrl?: string
  metadata?: PhotoRecord
  error?: Error | unknown
  file?: File
}

export async function uploadPhoto(file: File, userId: string, options?: UploadOptions): Promise<UploadResult> {
  const supabase = createClient()

  // Compress image
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    onProgress: options?.onProgress,
  })

  // Generate unique filename
  const timestamp = Date.now()
  const ext = file.name.split(".").pop()
  const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`
  
  // IMPORTANT: Path must start with userId to match the RLS policy
  // Policy checks if auth.uid() equals the first folder name
  const path = `${userId}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${filename}`

  // Upload to Supabase Storage
  const { error } = await supabase.storage.from("photos").upload(path, compressedFile, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) throw error

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("photos").getPublicUrl(path)

  // Get image dimensions
  const img = new Image()
  img.src = URL.createObjectURL(compressedFile)
  await new Promise((resolve) => (img.onload = resolve))

  // Save to database
  const { data: photo, error: dbError } = await supabase
    .from("photos")
    .insert({
      filename: file.name,
      storage_url: publicUrl,
      width: img.width,
      height: img.height,
      size_kb: Math.round(compressedFile.size / 1024),
      uploaded_by: userId,
    })
    .select()
    .single()

  if (dbError) throw dbError

  return {
    url: publicUrl,
    metadata: photo,
  }
}

// Survey 이미지 업로드 함수
export async function uploadSurveyImage(
  file: File, 
  questionId: string,
  imageLabel: string,
  options?: UploadOptions
): Promise<{ url: string; imageRecord: any }> {
  const supabase = createClient()

  // Compress image
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    onProgress: options?.onProgress,
  })

  // Generate unique filename
  const timestamp = Date.now()
  const ext = file.name.split(".").pop()
  const filename = `survey-${questionId}-${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`
  
  // Survey images path
  const path = `survey-images/${questionId}/${filename}`

  // Upload to Supabase Storage
  const { error } = await supabase.storage.from("photos").upload(path, compressedFile, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) throw error

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("photos").getPublicUrl(path)

  // Generate image key
  const imageKey = `${questionId}-${timestamp}`

  // Get next order
  const { data: existingImages } = await supabase
    .from('survey_images')
    .select('image_order')
    .eq('question_id', questionId)
    .order('image_order', { ascending: false })
    .limit(1)

  const nextOrder = existingImages && existingImages.length > 0 
    ? existingImages[0].image_order + 1 
    : 1

  // Save to survey_images table
  const { data: imageRecord, error: dbError } = await supabase
    .from("survey_images")
    .insert({
      question_id: questionId,
      image_key: imageKey,
      image_label: imageLabel,
      image_url: publicUrl,
      image_order: nextOrder,
      is_active: true
    })
    .select()
    .single()

  if (dbError) throw dbError

  return {
    url: publicUrl,
    imageRecord
  }
}

export async function uploadMultiplePhotos(
  files: File[],
  userId: string,
  onProgress?: (fileIndex: number, progress: number) => void,
): Promise<UploadResultWithStatus[]> {
  const results: UploadResultWithStatus[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadPhoto(files[i], userId, {
        onProgress: (progress) => onProgress?.(i, progress),
      })
      results.push({ success: true, ...result })
    } catch (error) {
      results.push({ success: false, error, file: files[i] })
    }
  }

  return results
}

// 범용 업로드 함수
export async function uploadMultipleSurveyImages(
  files: File[],
  questionId: string,
  onProgress?: (fileIndex: number, progress: number) => void,
): Promise<Array<{ success: boolean; imageRecord?: any; error?: any; file?: File }>> {
  const results: Array<{ success: boolean; imageRecord?: any; error?: any; file?: File }> = []

  for (let i = 0; i < files.length; i++) {
    try {
      const imageLabel = files[i].name.split('.')[0] // Use filename without extension as label
      const result = await uploadSurveyImage(files[i], questionId, imageLabel, {
        onProgress: (progress) => onProgress?.(i, progress),
      })
      results.push({ success: true, imageRecord: result.imageRecord })
    } catch (error) {
      results.push({ success: false, error, file: files[i] })
    }
  }

  return results
}
