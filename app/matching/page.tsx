'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSurveyQuestions, createMatchingSession } from '@/lib/matching'
import { SurveyQuestion, SurveyResponses } from '@/types/matching.types'
import { Loader2, CheckCircle } from 'lucide-react'
import QuestionCard from '@/components/matching/QuestionCard'
import { MatchingStructuredData } from '@/components/seo/matching-structured-data'

export default function MatchingPage() {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responses, setResponses] = useState<SurveyResponses>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const questionRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    loadQuestions()
  }, [])

  // Intersection Observer to detect which question is currently in view
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setupIntersectionObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const questionIndex = questionRefs.current.findIndex(ref => ref === entry.target)
            if (questionIndex !== -1 && questionIndex !== currentQuestion) {
              setCurrentQuestion(questionIndex)
            }
          }
        })
      },
      {
        root: null,
        rootMargin: '-20% 0px -20% 0px', // Only trigger when question is well within viewport
        threshold: 0.6 // Question needs to be 60% visible
      }
    )

    // Observe all question elements
    questionRefs.current.forEach((ref) => {
      if (ref) {
        observerRef.current?.observe(ref)
      }
    })
  }, [currentQuestion])

  useEffect(() => {
    if (questions.length > 0) {
      setupIntersectionObserver()
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [questions, setupIntersectionObserver])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const { data, error } = await getSurveyQuestions()
      
      if (error) {
        console.error('Error loading questions:', error)
        setError('질문을 불러오는 중 오류가 발생했습니다.')
        return
      }
      
      if (!data || data.length === 0) {
        setError('아직 질문이 준비되지 않았습니다.')
        return
      }
      
      setQuestions(data)
      questionRefs.current = new Array(data.length).fill(null)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('예상치 못한 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (questionKey: string, answer: string | string[] | null) => {
    setResponses(prev => ({ ...prev, [questionKey]: answer }))
    
    // Auto-scroll to next question when answered
    const currentQuestionIndex = questions.findIndex(q => q.question_key === questionKey)
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        const nextQuestionRef = questionRefs.current[currentQuestionIndex + 1]
        if (nextQuestionRef) {
          // Temporarily disable observer while auto-scrolling
          if (observerRef.current) {
            observerRef.current.disconnect()
          }
          
          nextQuestionRef.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
          
          // Re-enable observer after scroll animation completes
          setTimeout(() => {
            setCurrentQuestion(currentQuestionIndex + 1)
            setupIntersectionObserver()
          }, 250)
        }
      }, 100)
    }
  }

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredQuestions = questions.filter(q => 
      !responses[q.question_key] && q.question_type !== 'textarea'
    )
    
    if (unansweredQuestions.length > 0) {
      setError('모든 필수 질문에 답변해주세요.')
      // Scroll to first unanswered question
      const firstUnansweredIndex = questions.findIndex(q => 
        q.question_key === unansweredQuestions[0].question_key
      )
      if (firstUnansweredIndex >= 0) {
        // Temporarily disable observer while scrolling to unanswered question
        if (observerRef.current) {
          observerRef.current.disconnect()
        }
        
        questionRefs.current[firstUnansweredIndex]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
        
        // Re-enable observer after scroll animation completes
        setTimeout(() => {
          setCurrentQuestion(firstUnansweredIndex)
          setupIntersectionObserver()
        }, 250)
      }
      return
    }

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

  const isQuestionAnswered = (questionKey: string) => {
    const answer = responses[questionKey]
    return answer !== undefined && answer !== null && answer !== ''
  }

  const getQuestionOpacity = (index: number) => {
    const distance = Math.abs(index - currentQuestion)
    if (distance === 0) return 'opacity-100'
    if (distance === 1) return 'opacity-70'
    if (distance === 2) return 'opacity-50'
    return 'opacity-30'
  }

  const getQuestionBlur = (index: number) => {
    const distance = Math.abs(index - currentQuestion)
    if (distance === 0) return ''
    if (distance === 1) return 'blur-[1px]'
    if (distance === 2) return 'blur-[2px]'
    return 'blur-[3px]'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">질문을 준비하고 있습니다...</p>
        </div>
      </div>
    )
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const answeredCount = questions.filter(q => isQuestionAnswered(q.question_key)).length
  const totalCount = questions.length
  const progressPercentage = (answeredCount / totalCount) * 100

  return (
    <>
      <MatchingStructuredData />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              나에게 맞는 작가 찾기
            </h1>
            <p className="text-gray-600 text-sm">
              10개의 질문으로 당신에게 완벽한 사진작가를 찾아드립니다
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{answeredCount}개 완료</span>
            <span>{totalCount}개 중</span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-12">
          {questions.map((question, index) => (
            <div
              key={question.id}
              ref={(el) => { questionRefs.current[index] = el }}
              className={`
                transition-all duration-500 ease-in-out transform
                ${getQuestionOpacity(index)}
                ${getQuestionBlur(index)}
                ${index === currentQuestion ? 'scale-105' : 'scale-100'}
              `}
              onClick={() => {
                // Temporarily disable observer while manually setting focus
                if (observerRef.current) {
                  observerRef.current.disconnect()
                }
                
                setCurrentQuestion(index)
                
                // Re-enable observer after a short delay
                setTimeout(() => {
                  setupIntersectionObserver()
                }, 100)
              }}
            >
              <div className="relative">
                {/* Question Number & Status */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${isQuestionAnswered(question.question_key)
                      ? 'bg-green-100 text-green-700'
                      : index === currentQuestion
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                    }
                  `}>
                    {isQuestionAnswered(question.question_key) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        Q{index + 1}. {question.question_title}
                      </h3>
                      {isQuestionAnswered(question.question_key) && (
                        <span className="text-xs text-green-600 font-medium">
                          ✓ 완료
                        </span>
                      )}
                    </div>
                    {question.question_description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {question.question_description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Question Card */}
                <div className={`
                  border-2 rounded-xl p-6 transition-all duration-300
                  ${index === currentQuestion
                    ? 'border-blue-200 bg-blue-50/50 shadow-lg'
                    : isQuestionAnswered(question.question_key)
                      ? 'border-green-200 bg-green-50/30'
                      : 'border-gray-200 bg-white'
                  }
                `}>
                  <QuestionCard
                    question={question}
                    value={responses[question.question_key]}
                    onChange={(value) => handleAnswer(question.question_key, value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 mt-12 py-6">
          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={submitting || answeredCount < totalCount}
              className={`
                px-8 py-3 rounded-xl font-medium transition-all transform
                ${submitting || answeredCount < totalCount
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-lg'
                }
              `}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  분석 중...
                </>
              ) : (
                '매칭 결과 확인하기'
              )}
            </button>
            
            {answeredCount < totalCount && (
              <p className="text-sm text-gray-500 mt-2">
                {totalCount - answeredCount}개 질문이 남았습니다
              </p>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  )
}