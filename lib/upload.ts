import { createClient } from "@/lib/supabase/client"
import imageCompression from "browser-image-compression"

interface UploadOptions {
  onProgress?: (progress: number) => void
  generateThumbnail?: boolean
}

interface UploadResult {
  url: string
  thumbnailUrl?: string
  metadata: any
}

export async function uploadPhoto(file: File, userId: string, options?: UploadOptions): Promise<UploadResult> {
  const supabase = createClient()

  // Compress image
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  })

  // Generate unique filename
  const timestamp = Date.now()
  const ext = file.name.split(".").pop()
  const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`
  const path = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${filename}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage.from("photos").upload(path, compressedFile, {
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

export async function uploadMultiplePhotos(
  files: File[],
  userId: string,
  onProgress?: (fileIndex: number, progress: number) => void,
): Promise<any[]> {
  const results = []

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
