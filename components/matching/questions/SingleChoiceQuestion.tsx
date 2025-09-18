'use client'

import { SurveyChoice } from '@/types/matching.types'
import { Check } from 'lucide-react'

interface SingleChoiceQuestionProps {
  choices: SurveyChoice[]
  value: string | null
  onChange: (value: string) => void
}

export default function SingleChoiceQuestion({ 
  choices, 
  value, 
  onChange 
}: SingleChoiceQuestionProps) {
  const sortedChoices = choices.sort((a, b) => a.choice_order - b.choice_order)
  
  // Check if this is a keyword/tag type question (many short choices)
  const isKeywordType = sortedChoices.length > 6 && 
    sortedChoices.every(choice => choice.choice_label.length < 20)

  if (isKeywordType) {
    // 3-column grid layout for keyword selections
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedChoices.map(choice => (
          <button
            key={choice.id}
            onClick={() => onChange(choice.choice_key)}
            className={`
              p-3 rounded-lg border-2 transition-all duration-200
              text-center text-sm font-medium group relative
              ${value === choice.choice_key
                ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-md'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700'
              }
            `}
          >
            {choice.choice_label}
            
            {/* Small check icon for selected state */}
            {value === choice.choice_key && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    )
  }

  // Default vertical layout for regular choices
  return (
    <div className="space-y-3">
      {sortedChoices.map(choice => (
        <button
          key={choice.id}
          onClick={() => onChange(choice.choice_key)}
          className={`
            w-full p-4 rounded-xl border-2 transition-all duration-200
            flex items-center justify-between group
            ${value === choice.choice_key
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }
          `}
        >
          <span className={`
            text-left flex-1
            ${value === choice.choice_key 
              ? 'text-blue-900 font-medium' 
              : 'text-gray-700'
            }
          `}>
            {choice.choice_label}
          </span>
          
          <div className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center
            transition-all duration-200 ml-4 flex-shrink-0
            ${value === choice.choice_key
              ? 'border-blue-500 bg-blue-500'
              : 'border-gray-300 group-hover:border-blue-400'
            }
          `}>
            {value === choice.choice_key && (
              <Check className="w-4 h-4 text-white" />
            )}
          </div>
        </button>
      ))}
    </div>
  )
}