'use client'

interface ScoreVisualizationProps {
  styleEmotion: number
  communicationPsychology: number
  purposeStory: number
  companion: number
}

export default function ScoreVisualization({
  styleEmotion,
  communicationPsychology,
  purposeStory,
  companion
}: ScoreVisualizationProps) {
  const dimensions = [
    { 
      label: '스타일/감성', 
      score: styleEmotion, 
      color: 'bg-purple-500',
      bgColor: 'bg-purple-100',
      weight: '40%'
    },
    { 
      label: '소통/심리', 
      score: communicationPsychology, 
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      weight: '30%'
    },
    { 
      label: '목적/스토리', 
      score: purposeStory, 
      color: 'bg-green-500',
      bgColor: 'bg-green-100',
      weight: '20%'
    },
    { 
      label: '동반자', 
      score: companion, 
      color: 'bg-orange-500',
      bgColor: 'bg-orange-100',
      weight: '10%'
    }
  ]

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        4차원 매칭 점수
      </h4>
      
      {dimensions.map((dim, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 font-medium">
              {dim.label}
            </span>
            <span className="text-gray-500">
              {Math.round(dim.score)}% ({dim.weight} 가중치)
            </span>
          </div>
          
          <div className={`h-2 ${dim.bgColor} rounded-full overflow-hidden`}>
            <div 
              className={`h-full ${dim.color} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, dim.score)}%` }}
            />
          </div>
        </div>
      ))}

      <div className="pt-2 mt-3 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">
            종합 매칭률
          </span>
          <span className="text-lg font-bold text-blue-600">
            {Math.round(
              styleEmotion * 0.4 + 
              communicationPsychology * 0.3 + 
              purposeStory * 0.2 + 
              companion * 0.1
            )}%
          </span>
        </div>
      </div>
    </div>
  )
}