'use client'
import { adminLogger } from "@/lib/logger"

/**
 * TODO: MIGRATE TO SERVER ACTIONS AND HOOKS
 *
 * This component manages background embedding job processing.
 * Future migration plan:
 *
 * 1. Create /lib/actions/embedding-jobs.ts with functions:
 *    - getEmbeddingJobs(filters)
 *    - createEmbeddingJob(jobData)
 *    - pauseEmbeddingJob(jobId)
 *    - resumeEmbeddingJob(jobId)
 *    - retryEmbeddingJob(jobId)
 *    - getJobStats()
 *
 * 2. Create /lib/hooks/use-embedding-jobs.ts with:
 *    - useEmbeddingJobs(filters)
 *    - useEmbeddingJobMutations()
 *    - useJobStats()
 *
 * 3. Replace real-time subscriptions with hooks + polling or SSE
 *
 * Current complexity: 471 lines, real-time job monitoring
 * Estimated effort: 3-4 hours
 * Priority: LOW (admin-only background processing)
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Zap,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface EmbeddingJob {
  id: string
  job_type: string
  target_id: string
  job_status: string
  error_message?: string
  created_at: string
  processed_at?: string
}

interface EmbeddingStats {
  totalJobs: number
  pendingJobs: number
  completedJobs: number
  failedJobs: number
  estimatedCost: number
}

interface EmbeddingManagerProps {
  onComplete?: () => void
}

export default function EmbeddingManager({ onComplete }: EmbeddingManagerProps) {
  const [open, setOpen] = useState(false)
  const [jobs, setJobs] = useState<EmbeddingJob[]>([])
  const [stats, setStats] = useState<EmbeddingStats>({
    totalJobs: 0,
    pendingJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    estimatedCost: 0
  })
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      loadJobs()
    }
  }, [open])

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('embedding_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const jobList = data || []
      setJobs(jobList as any)

      // Calculate stats
      const totalJobs = jobList.length
      const pendingJobs = jobList.filter(j => j.job_status === 'pending').length
      const completedJobs = jobList.filter(j => j.job_status === 'completed').length
      const failedJobs = jobList.filter(j => j.job_status === 'failed').length
      
      // Estimate cost (OpenAI text-embedding-3-small: $0.00002 per 1K tokens, ~4 tokens per word)
      const estimatedTokens = pendingJobs * 20 // Rough estimate: 20 tokens per item
      const estimatedCost = (estimatedTokens / 1000) * 0.00002

      setStats({
        totalJobs,
        pendingJobs,
        completedJobs,
        failedJobs,
        estimatedCost
      })
    } catch (error) {
      adminLogger.error('Error loading jobs:', error)
      toast.error('작업 목록을 불러오는 중 오류가 발생했습니다')
    }
  }

  const processAllEmbeddings = async () => {
    try {
      setProcessing(true)
      setProgress(0)

      const response = await fetch('/api/admin/matching/embeddings/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Batch processing failed')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'progress') {
                setProgress(data.progress)
              } else if (data.type === 'complete') {
                setProgress(100)
                toast.success('모든 임베딩 생성이 완료되었습니다')
                loadJobs()
                onComplete?.()
              } else if (data.type === 'error') {
                throw new Error(data.message)
              }
            } catch (parseError) {
              adminLogger.error('Error parsing SSE data:', parseError)
            }
          }
        }
      }
    } catch (error) {
      adminLogger.error('Error processing embeddings:', error)
      toast.error('임베딩 생성 중 오류가 발생했습니다')
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }

  const generateAllEmbeddings = async () => {
    try {
      toast.info('모든 선택지와 이미지에 대한 임베딩 작업을 생성하는 중...')

      const response = await fetch('/api/admin/matching/embeddings/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to generate jobs')

      const result = await response.json()
      
      toast.success(`${result.created}개의 임베딩 작업이 생성되었습니다`)
      loadJobs()
    } catch (error) {
      adminLogger.error('Error generating embedding jobs:', error)
      toast.error('임베딩 작업 생성 중 오류가 발생했습니다')
    }
  }

  const retryFailedJobs = async () => {
    try {
      const { error } = await supabase
        .from('embedding_jobs')
        .update({ job_status: 'pending', error_message: null })
        .eq('job_status', 'failed')

      if (error) throw error

      toast.success('실패한 작업들을 다시 시도합니다')
      loadJobs()
    } catch (error) {
      adminLogger.error('Error retrying failed jobs:', error)
      toast.error('작업 재시도 중 오류가 발생했습니다')
    }
  }

  const generateClipEmbeddings = async () => {
    try {
      toast.info('이미지에 대한 CLIP 임베딩을 생성하는 중...')

      // Get all images that need CLIP embeddings
      const { data: images, error: fetchError } = await supabase
        .from('survey_images')
        .select('id, image_url')
        .or('image_embedding.is.null,embedding_generated_at.is.null')

      if (fetchError) throw fetchError

      if (!images || images.length === 0) {
        toast.info('모든 이미지에 CLIP 임베딩이 이미 생성되어 있습니다')
        return
      }

      const imageIds = images.map(img => img.id)
      
      const response = await fetch('/api/admin/matching/embeddings/clip', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds })
      })

      if (!response.ok) throw new Error('Failed to generate CLIP embeddings')

      const result = await response.json()
      
      toast.success(`${result.successCount}개의 CLIP 임베딩이 생성되었습니다 (${result.errorCount}개 실패)`)
      loadJobs()
      
      if (onComplete) onComplete()
    } catch (error) {
      adminLogger.error('Error generating CLIP embeddings:', error)
      toast.error('CLIP 임베딩 생성 중 오류가 발생했습니다')
    }
  }

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1 text-yellow-600">
          <Clock className="h-3 w-3" />
          대기
        </Badge>
      case 'processing':
        return <Badge variant="outline" className="gap-1 text-blue-600">
          <RefreshCw className="h-3 w-3 animate-spin" />
          처리중
        </Badge>
      case 'completed':
        return <Badge variant="outline" className="gap-1 text-green-600">
          <CheckCircle className="h-3 w-3" />
          완료
        </Badge>
      case 'failed':
        return <Badge variant="outline" className="gap-1 text-red-600">
          <XCircle className="h-3 w-3" />
          실패
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'choice_embedding':
        return '선택지 임베딩'
      case 'image_embedding':
        return '이미지 임베딩'
      case 'photographer_profile':
        return '작가 프로필 임베딩'
      default:
        return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Zap className="h-4 w-4 mr-2" />
          임베딩 관리
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            임베딩 생성 관리
          </DialogTitle>
          <DialogDescription>
            OpenAI(텍스트)와 CLIP(이미지)을 사용하여 임베딩을 생성하고 관리합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pendingJobs}
                </div>
                <p className="text-xs text-muted-foreground">대기 중</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">
                  {stats.completedJobs}
                </div>
                <p className="text-xs text-muted-foreground">완료</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-600">
                  {stats.failedJobs}
                </div>
                <p className="text-xs text-muted-foreground">실패</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">
                  ${stats.estimatedCost.toFixed(4)}
                </div>
                <p className="text-xs text-muted-foreground">예상 비용</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          {processing && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">처리 진행률</span>
                    <span className="text-sm text-muted-foreground">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={processAllEmbeddings}
              disabled={processing || stats.pendingJobs === 0}
              className="flex-1 min-w-0"
            >
              {processing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  대기 중인 작업 처리 ({stats.pendingJobs}개)
                </>
              )}
            </Button>
            
            <Button
              onClick={generateAllEmbeddings}
              variant="outline"
              disabled={processing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              전체 재생성
            </Button>
            
            <Button
              onClick={generateClipEmbeddings}
              variant="outline"
              disabled={processing}
              className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            >
              <Zap className="h-4 w-4 mr-2" />
              CLIP 임베딩 생성
            </Button>
            
            {stats.failedJobs > 0 && (
              <Button
                onClick={retryFailedJobs}
                variant="outline"
                disabled={processing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                실패 작업 재시도
              </Button>
            )}
          </div>

          {/* Cost Warning */}
          {stats.estimatedCost > 0.01 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">비용 알림</h4>
                    <p className="text-sm text-yellow-700">
                      예상 비용이 $0.01를 초과합니다. OpenAI API 요금이 발생할 수 있습니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Jobs List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">최근 작업</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {jobs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    아직 임베딩 작업이 없습니다.
                  </p>
                ) : (
                  jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {getJobTypeLabel(job.job_type)}
                          </span>
                          {getJobStatusBadge(job.job_status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.created_at).toLocaleString()}
                        </p>
                        {job.error_message && (
                          <p className="text-xs text-red-600">
                            {job.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}