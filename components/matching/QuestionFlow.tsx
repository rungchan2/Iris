'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SurveyQuestion, SurveyResponses } from '@/types/matching.types'
import { createMatchingSession } from '@/lib/matching'
import ProgressBar from './ProgressBar'
import QuestionCard from './QuestionCard'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface QuestionFlowProps {
  questions: SurveyQuestion[]
}

export default function QuestionFlow({ questions }: QuestionFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<SurveyResponses>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const currentQuestion = questions[currentStep]
  const isLastQuestion = currentStep === questions.length - 1
  const isFirstQuestion = currentStep === 0

  const handleAnswer = (questionKey: string, answer: string | string[] | null) => {
    setResponses(prev => ({ ...prev, [questionKey]: answer }))
    setError(null)
  }

  const handleNext = () => {
    const currentAnswer = responses[currentQuestion.question_key]
    
    // Validate required fields
    if (!currentAnswer && currentQuestion.question_type !== 'textarea') {
      setError('이 질문에 답변해주세요.')
      return
    }
    
    if (!isLastQuestion) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentStep(prev => prev - 1)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError(null)
      
      // Extract subjective text from Q10 (assuming it's the last question)
      const subjectiveText = responses['q10'] as string || null
      
      // Create matching session
      const { data, error } = await createMatchingSession(responses, subjectiveText)
      
      if (error) {
        console.error('Error creating session:', error)
        setError('매칭 세션 생성 중 오류가 발생했습니다.')
        return
      }
      
      if (!data) {
        setError('매칭 세션을 생성할 수 없습니다.')
        return
      }
      
      // Trigger matching calculation via API
      const matchingResponse = await fetch('/api/matching/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: data.id })
      })
      
      if (!matchingResponse.ok) {
        throw new Error('Matching calculation failed')
      }
      
      // Navigate to results page
      router.push('/matching/results')
    } catch (err) {
      console.error('Submit error:', err)
      setError('제출 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const canProceed = () => {
    const currentAnswer = responses[currentQuestion.question_key]
    return currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== ''
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          나에게 맞는 작가 찾기
        </h1>
        <p className="text-center text-gray-600">
          10개의 질문으로 당신에게 완벽한 사진작가를 찾아드립니다
        </p>
      </div>

      <ProgressBar 
        current={currentStep + 1} 
        total={questions.length} 
      />

      <div className="mt-8 mb-8">
        <QuestionCard
          question={currentQuestion}
          value={responses[currentQuestion.question_key]}
          onChange={(value) => handleAnswer(currentQuestion.question_key, value)}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={isFirstQuestion || submitting}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-all
            ${isFirstQuestion || submitting
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
            }
          `}
        >
          <ChevronLeft className="h-5 w-5" />
          이전
        </button>

        <span className="text-gray-600">
          {currentStep + 1} / {questions.length}
        </span>

        <button
          onClick={handleNext}
          disabled={!canProceed() || submitting}
          className={`
            flex items-center gap-2 px-6 py-2 rounded-lg transition-all font-medium
            ${!canProceed() || submitting
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              분석 중...
            </>
          ) : isLastQuestion ? (
            '완료'
          ) : (
            <>
              다음
              <ChevronRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          * 모든 정보는 매칭 목적으로만 사용되며 안전하게 보호됩니다.
        </p>
      </div>
    </div>
  )
}