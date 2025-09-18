'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMatchingResults, trackMatchingInteraction } from '@/lib/matching'
import { MatchingResult } from '@/types/matching.types'
import MatchingResults from '@/components/matching/MatchingResults'
import { Loader2 } from 'lucide-react'

export default function MatchingResultsPage() {
  const [results, setResults] = useState<MatchingResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      setLoading(true)
      
      // Get session ID from localStorage
      const storedSessionId = localStorage.getItem('matching_session_id')
      
      if (!storedSessionId) {
        setError('매칭 세션을 찾을 수 없습니다. 다시 시작해주세요.')
        return
      }
      
      setSessionId(storedSessionId)
      
      const { data, error } = await getMatchingResults(storedSessionId)
      
      if (error) {
        console.error('Error loading results:', error)
        setError('결과를 불러오는 중 오류가 발생했습니다.')
        return
      }
      
      if (!data || data.length === 0) {
        setError('매칭 결과를 찾을 수 없습니다.')
        return
      }
      
      setResults(data)
      
      // Track that results were viewed
      for (const result of data) {
        await trackMatchingInteraction(storedSessionId, result.photographer_id, 'viewed')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('예상치 못한 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotographerClick = async (photographerId: string) => {
    if (sessionId) {
      await trackMatchingInteraction(sessionId, photographerId, 'clicked')
    }
    // Navigate to photographer detail page
    router.push(`/photographers/${photographerId}`)
  }

  const handleContactClick = async (photographerId: string) => {
    if (sessionId) {
      await trackMatchingInteraction(sessionId, photographerId, 'contacted')
    }
    // Navigate to photographer booking page
    router.push(`/photographers/${photographerId}/booking`)
  }

  const handleRetakeQuiz = () => {
    localStorage.removeItem('matching_session_id')
    localStorage.removeItem('matching_session_token')
    router.push('/matching')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">매칭 결과를 분석하고 있습니다...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={handleRetakeQuiz}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시작하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MatchingResults 
        results={results}
        onPhotographerClick={handlePhotographerClick}
        onContactClick={handleContactClick}
        onRetakeQuiz={handleRetakeQuiz}
      />
    </div>
  )
}