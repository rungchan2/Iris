'use client'

interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>진행률</span>
        <span>{current} / {total}</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-3">
        {Array.from({ length: total }).map((_, index) => (
          <div
            key={index}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
              transition-all duration-300
              ${index < current
                ? 'bg-blue-600 text-white'
                : index === current - 1
                ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                : 'bg-gray-200 text-gray-500'
              }
            `}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  )
}