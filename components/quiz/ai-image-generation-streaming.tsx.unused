'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, Wand2, Download, RefreshCw, Heart } from 'lucide-react'
import { generatePersonalityImage, pollGenerationStatus, rateAIGeneration } from '@/lib/actions/ai'
import { toast } from 'sonner'
import Image from 'next/image'

interface AIImageGenerationStreamingProps {
  sessionId: string | null
  personalityCode: string
  personalityName: string
}

interface GenerationState {
  id?: string
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  imageUrl?: string
  error?: string
}

export function AIImageGenerationStreaming({ 
  sessionId, 
  personalityCode, 
  personalityName 
}: AIImageGenerationStreamingProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generation, setGeneration] = useState<GenerationState>({
    status: 'idle',
    progress: 0,
    message: '이미지를 업로드하여 시작하세요'
  })
  const [rating, setRating] = useState<number>(0)
  const [isPolling, setIsPolling] = useState(false)

  // 파일 선택 핸들러
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기 초과: 5MB 이하의 이미지를 선택해주세요.")
      return
    }

    // 이미지 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      toast.error("잘못된 파일 형식: 이미지 파일만 업로드 가능합니다.")
      return
    }

    setSelectedFile(file)
    
    // 미리보기 생성
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 드래그 앤 드롭 핸들러
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      // 직접 파일 처리
      if (file.size > 5 * 1024 * 1024) {
        toast.error("파일 크기 초과: 5MB 이하의 이미지를 선택해주세요.")
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error("잘못된 파일 형식: 이미지 파일만 업로드 가능합니다.")
        return
      }

      setSelectedFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  // 폴링을 통한 상태 업데이트
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (isPolling && generation.id) {
      intervalId = setInterval(async () => {
        const result = await pollGenerationStatus(generation.id!)
        
        if (result.success) {
          setGeneration(prev => ({
            ...prev,
            status: result.status === 'completed' ? 'completed' : 
                   result.status === 'failed' ? 'failed' : 'processing',
            progress: result.progress || prev.progress,
            imageUrl: result.imageUrl
          }))

          // 완료되면 폴링 중단
          if (result.status === 'completed' || result.status === 'failed') {
            setIsPolling(false)
          }
        }
      }, 2000) // 2초마다 폴링
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isPolling, generation.id])

  // AI 이미지 생성 시작
  const handleGenerateImage = async () => {
    if (!selectedFile) {
      toast.error("이미지를 선택해주세요: AI 이미지 생성을 위해 기본 이미지가 필요합니다.")
      return
    }

    setGeneration({
      status: 'uploading',
      progress: 5,
      message: '이미지 업로드 중...'
    })

    try {
      const result = await generatePersonalityImage(
        sessionId,
        personalityCode as any,
        selectedFile
      )

      if (result.success && result.generation) {
        setGeneration({
          id: result.generation.id,
          status: 'processing',
          progress: 10,
          message: '이미지 생성을 시작합니다...'
        })
        setIsPolling(true)

        toast.success("생성 시작됨: AI가 당신의 성향에 맞는 이미지를 생성하고 있습니다.")
      } else {
        throw new Error(result.error || '생성 실패')
      }
    } catch (error: any) {
      setGeneration({
        status: 'failed',
        progress: 0,
        message: '생성 실패',
        error: error.message
      })
      
      toast.error(`생성 실패: ${error.message || "이미지 생성 중 오류가 발생했습니다."}`)
    }
  }

  // 평점 제출
  const handleRating = async (newRating: number) => {
    if (!generation.id) return

    setRating(newRating)
    
    const result = await rateAIGeneration(generation.id, newRating)
    if (result.success) {
      toast.success("평가 완료: 소중한 피드백 감사합니다!")
    }
  }

  // 이미지 다운로드
  const handleDownload = () => {
    if (generation.imageUrl) {
      const link = document.createElement('a')
      link.href = generation.imageUrl
      link.download = `personality-${personalityCode}-generated.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          AI 이미지 생성
        </h3>
        <p className="text-gray-600">
          당신의 사진을 업로드하면 <span className="font-medium text-blue-600">{personalityName}</span> 성향에 맞는 
          스타일로 AI가 새롭게 만들어 드립니다.
        </p>
      </div>

      {/* 파일 업로드 영역 */}
      {!selectedFile && (
        <Card>
          <CardContent className="p-6">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                이미지 업로드
              </h4>
              <p className="text-gray-600 mb-4">
                파일을 드래그하거나 클릭하여 선택하세요
              </p>
              <p className="text-sm text-gray-500">
                JPG, PNG 파일 (최대 5MB)
              </p>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 선택된 이미지 미리보기 */}
      {selectedFile && previewUrl && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                업로드된 이미지
              </h4>
              <div className="relative inline-block">
                <Image
                  src={previewUrl}
                  alt="업로드된 이미지"
                  width={200}
                  height={200}
                  className="rounded-lg object-cover"
                />
              </div>
              <div className="mt-4 space-x-2">
                <Button
                  onClick={handleGenerateImage}
                  disabled={generation.status === 'processing' || generation.status === 'uploading'}
                  className="inline-flex items-center"
                >
                  {generation.status === 'processing' || generation.status === 'uploading' ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  AI 이미지 생성
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                    setGeneration({
                      status: 'idle',
                      progress: 0,
                      message: '이미지를 업로드하여 시작하세요'
                    })
                  }}
                >
                  다시 선택
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 생성 진행 상황 */}
      {(generation.status === 'uploading' || generation.status === 'processing') && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h4 className="text-lg font-medium text-gray-900">
                AI 이미지 생성 중...
              </h4>
              <div className="space-y-2">
                <Progress value={generation.progress} className="w-full" />
                <p className="text-sm text-gray-600">
                  {generation.message}
                </p>
                <p className="text-xs text-gray-500">
                  {generation.progress}% 완료
                </p>
              </div>
              <div className="animate-pulse">
                <Wand2 className="mx-auto h-8 w-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 생성된 이미지 결과 */}
      {generation.status === 'completed' && generation.imageUrl && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h4 className="text-lg font-medium text-gray-900">
                AI 이미지 생성 완료!
              </h4>
              <div className="relative inline-block">
                <Image
                  src={generation.imageUrl}
                  alt="AI 생성 이미지"
                  width={300}
                  height={300}
                  className="rounded-lg object-cover"
                />
              </div>
              
              {/* 평점 */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">결과가 만족스러우신가요?</p>
                <div className="flex justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      className={`p-1 ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleDownload} className="inline-flex items-center">
                <Download className="mr-2 h-4 w-4" />
                이미지 다운로드
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 실패 상태 */}
      {generation.status === 'failed' && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h4 className="text-lg font-medium text-red-600">
                생성 실패
              </h4>
              <p className="text-gray-600">
                {generation.error || '이미지 생성 중 오류가 발생했습니다.'}
              </p>
              <Button
                onClick={() => {
                  setGeneration({
                    status: 'idle',
                    progress: 0,
                    message: '다시 시도해주세요'
                  })
                }}
                variant="outline"
              >
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}