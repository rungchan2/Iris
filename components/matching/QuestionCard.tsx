'use client'

import { SurveyQuestion } from '@/types/matching.types'
import SingleChoiceQuestion from './questions/SingleChoiceQuestion'
import ImageChoiceQuestion from './questions/ImageChoiceQuestion'
import TextAreaQuestion from './questions/TextAreaQuestion'

interface QuestionCardProps {
  question: SurveyQuestion
  value: any
  onChange: (value: any) => void
}

export default function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const renderQuestion = () => {
    switch (question.question_type) {
      case 'single_choice':
        return (
          <SingleChoiceQuestion
            choices={question.survey_choices || []}
            value={value}
            onChange={onChange}
          />
        )
      
      case 'image_choice':
        return (
          <ImageChoiceQuestion
            images={question.survey_images || []}
            value={value}
            onChange={onChange}
          />
        )
      
      case 'textarea':
        return (
          <TextAreaQuestion
            value={value}
            onChange={onChange}
            placeholder="자유롭게 작성해주세요..."
          />
        )
      
      default:
        return (
          <div className="text-center text-gray-500">
            지원하지 않는 질문 유형입니다.
          </div>
        )
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {question.question_title}
      </h2>
      
      {renderQuestion()}
    </div>
  )
}