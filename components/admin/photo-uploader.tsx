"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react"
import { uploadMultiplePhotos } from "@/lib/upload"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PhotoUploaderProps {
  userId: string
  onUploadComplete: () => void
}

interface UploadResult {
  success: boolean
  file?: File
  error?: any
  metadata?: any
}

export function PhotoUploader({ userId, onUploadComplete }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({})
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true)
      setUploadProgress({})
      setUploadResults([])

      const results = await uploadMultiplePhotos(acceptedFiles, userId, (fileIndex, progress) => {
        setUploadProgress((prev) => ({
          ...prev,
          [fileIndex]: progress,
        }))
      })

      setUploadResults(results)
      setUploading(false)
      onUploadComplete()
    },
    [userId, onUploadComplete],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: true,
  })

  const clearResults = () => {
    setUploadResults([])
  }

  const successCount = uploadResults.filter((r) => r.success).length
  const errorCount = uploadResults.filter((r) => !r.success).length

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary",
          uploading && "pointer-events-none opacity-50",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p>Drop the photos here...</p>
        ) : (
          <div>
            <p className="text-lg font-medium">Drop photos here, or click to select</p>
            <p className="text-sm text-muted-foreground mt-1">
              Support for JPEG, PNG, WebP • Max 1.5MB per file after compression
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading {Object.keys(uploadProgress).length} files...</h4>
          {Object.entries(uploadProgress).map(([index, progress]) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>File {Number.parseInt(index) + 1}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ))}
        </div>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <Alert className={successCount === uploadResults.length ? "border-green-200" : "border-yellow-200"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {successCount === uploadResults.length ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <AlertDescription>
                Successfully uploaded {successCount} of {uploadResults.length} photos
                {errorCount > 0 && ` (${errorCount} failed)`}
              </AlertDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={clearResults}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}
    </div>
  )
}
