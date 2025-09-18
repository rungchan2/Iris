'use client'

import { MatchingResult } from '@/types/matching.types'
import { User, MapPin, DollarSign, Star, Camera, MessageCircle } from 'lucide-react'
import ScoreVisualization from './ScoreVisualization'

interface PhotographerMatchCardProps {
  result: MatchingResult
  rank: number
  compact?: boolean
  onViewProfile?: () => void
  onContact?: () => void
}

export default function PhotographerMatchCard({ 
  result, 
  rank,
  compact = false,
  onViewProfile,
  onContact
}: PhotographerMatchCardProps) {
  const getRankBadgeColor = () => {
    switch(rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-500'
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-400'
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const photographer = result.photographer
  const profile = result.photographer_profile

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`
              w-8 h-8 rounded-full ${getRankBadgeColor()} 
              text-white font-bold flex items-center justify-center text-sm
            `}>
              {rank}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {photographer?.name || '작가명'}
              </h3>
              <p className="text-sm text-gray-600">
                매칭률 {Math.round(result.total_score)}%
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onViewProfile}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={onContact}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className={`
              w-12 h-12 rounded-full ${getRankBadgeColor()} 
              text-white font-bold flex items-center justify-center text-lg shadow-md
            `}>
              {rank}
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {photographer?.name || '작가명'}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {photographer?.price_range_min && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {(photographer.price_range_min / 10000).toFixed(0)}~
                    {((photographer.price_range_max || 0) / 10000).toFixed(0)}만원
                  </div>
                )}
                {profile?.service_regions && profile.service_regions.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.service_regions.slice(0, 2).join(', ')}
                    {profile.service_regions.length > 2 && ` 외 ${profile.service_regions.length - 2}곳`}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(result.total_score)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">매칭률</div>
          </div>
        </div>

        {/* Bio */}
        {photographer?.bio && (
          <p className="text-gray-600 text-sm mb-6 line-clamp-2">
            {photographer.bio}
          </p>
        )}

        {/* 4D Score Visualization */}
        <div className="mb-6">
          <ScoreVisualization 
            styleEmotion={result.style_emotion_score}
            communicationPsychology={result.communication_psychology_score}
            purposeStory={result.purpose_story_score}
            companion={result.companion_score}
          />
        </div>

        {/* Keywords */}
        {photographer?.photographer_keywords && photographer.photographer_keywords.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {photographer.photographer_keywords.slice(0, 5).map((keyword: any) => (
                <span 
                  key={keyword.keyword}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                >
                  {keyword.keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onViewProfile}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            프로필 보기
          </button>
          <button
            onClick={onContact}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            문의하기
          </button>
        </div>
      </div>
    </div>
  )
}