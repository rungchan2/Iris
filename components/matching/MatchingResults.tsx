'use client'

import { MatchingResult } from '@/types/matching.types'
import PhotographerMatchCard from './PhotographerMatchCard'
import { RotateCcw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MatchingResultsProps {
  results: MatchingResult[]
  onPhotographerClick?: (photographerId: string) => void
  onContactClick?: (photographerId: string) => void
  onRetakeQuiz?: () => void
}

export default function MatchingResults({ 
  results, 
  onPhotographerClick,
  onContactClick,
  onRetakeQuiz
}: MatchingResultsProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            당신을 위한 맞춤 작가를 찾았습니다! 🎉
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI가 분석한 4차원 매칭 시스템으로 당신의 스타일과 성향에 
            가장 잘 맞는 작가들을 추천합니다.
          </p>
        </div>

        {/* Top 3 Results Highlight */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              베스트 매칭 TOP {Math.min(3, results.length)}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={onRetakeQuiz}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                다시 매칭하기
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                홈으로
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="space-y-6">
            {results.slice(0, 3).map((result, index) => (
              <div
                key={result.photographer_id}
                className={`
                  transform transition-all duration-300 hover:scale-[1.02]
                  ${index === 0 ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}
                `}
              >
                <PhotographerMatchCard
                  result={result}
                  rank={result.rank_position}
                  onViewProfile={() => onPhotographerClick?.(result.photographer_id)}
                  onContact={() => onContactClick?.(result.photographer_id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Additional Results */}
        {results.length > 3 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-gray-700 mb-6">
              추가 추천 작가
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.slice(3, 10).map(result => (
                <div
                  key={result.photographer_id}
                  className="transform transition-all duration-300 hover:scale-[1.02]"
                >
                  <PhotographerMatchCard
                    result={result}
                    rank={result.rank_position}
                    compact
                    onViewProfile={() => onPhotographerClick?.(result.photographer_id)}
                    onContact={() => onContactClick?.(result.photographer_id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600 mb-4">
              조건에 맞는 작가를 찾지 못했습니다.
            </p>
            <button
              onClick={onRetakeQuiz}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도하기
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 p-6 bg-gray-50 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-3">
            💡 매칭 시스템 안내
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                4차원 매칭: 스타일/감성 (40%), 소통/심리 (30%), 
                목적/스토리 (20%), 동반자 (10%) 기준으로 분석합니다.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                AI가 작가의 포트폴리오와 프로필을 분석하여 
                당신의 답변과 가장 잘 맞는 작가를 찾아드립니다.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>
                매칭 점수가 높을수록 당신의 니즈와 작가의 스타일이 잘 맞습니다.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}