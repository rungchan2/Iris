"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface Choice {
  id: string
  label: string
  value: string
  image: string
  description?: string
}

interface Question {
  id: string
  title: string
  choices: Choice[]
}

const questions: Question[] = [
  {
    id: "personality",
    title: "어떤 스타일의 작가를 선호하시나요?",
    choices: [
      {
        id: "friendly",
        label: "털털 친근",
        value: "friendly",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop",
        description: "편안하고 자연스러운 분위기"
      },
      {
        id: "delicate",
        label: "섬세 예민",
        value: "delicate",
        image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&h=500&fit=crop",
        description: "세심하고 감성적인 접근"
      }
    ]
  },
  {
    id: "directing",
    title: "촬영 디렉팅 스타일은?",
    choices: [
      {
        id: "directing",
        label: "포즈 디렉팅 달인",
        value: "directing",
        image: "https://images.unsplash.com/photo-1502945015378-0e284ca1a5be?w=500&h=500&fit=crop",
        description: "완벽한 포즈와 구도 연출"
      },
      {
        id: "natural",
        label: "자유로운 현장 추구",
        value: "natural",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop",
        description: "자연스러운 순간 포착"
      }
    ]
  },
  {
    id: "approach",
    title: "사진의 방향성은?",
    choices: [
      {
        id: "photographer",
        label: "작가의 시선",
        value: "photographer",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop",
        description: "작가의 예술적 해석"
      },
      {
        id: "client",
        label: "내가 추구하는 이미지",
        value: "client",
        image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop",
        description: "고객의 비전 실현"
      }
    ]
  }
]

export default function StyleMatchPage() {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleSelectChoice = (choice: Choice) => {
    if (isProcessing) return

    setIsProcessing(true)
    
    // Record answer
    const newAnswers = { ...answers, [currentQuestion.id]: choice.value }
    setAnswers(newAnswers)

    // Move to next question or complete
    setTimeout(() => {
      if (isLastQuestion) {
        // Navigate to photographers page with filters
        const params = new URLSearchParams({
          personality_type: newAnswers.personality || '',
          directing_style: newAnswers.directing || '',
          photography_approach: newAnswers.approach || ''
        })
        router.push(`/photographers?${params.toString()}`)
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }
      setIsProcessing(false)
    }, 300)
  }

  const handleGoBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else {
      router.back()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col justify-center px-4 py-8">
          <div className="max-w-5xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  나에게 맞는 작가 찾기
                </h1>
                <p className="text-gray-600">
                  간단한 질문으로 당신에게 딱 맞는 작가를 추천해드려요
                </p>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-between mb-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  disabled={isProcessing}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  이전
                </Button>
                
                <div className="flex gap-2">
                  {questions.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-12 rounded-full transition-colors ${
                        index <= currentQuestionIndex
                          ? "bg-orange-500"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                
                <div className="text-sm font-medium text-gray-600">
                  {currentQuestionIndex + 1} / {questions.length}
                </div>
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900">
                    {currentQuestion.title}
                  </h2>

                  {/* Choices */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentQuestion.choices.map((choice) => (
                      <motion.div
                        key={choice.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          className={`group cursor-pointer overflow-hidden transition-all hover:shadow-xl rounded-xl shadow-lg border ${
                            isProcessing ? "pointer-events-none opacity-75" : ""
                          }`}
                          onClick={() => handleSelectChoice(choice)}
                        >
                          <AspectRatio ratio={4 / 3}>
                            <Image
                              src={choice.image}
                              alt={choice.label}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                              <h3 className="text-2xl font-bold mb-2">
                                {choice.label}
                              </h3>
                              {choice.description && (
                                <p className="text-sm opacity-90">
                                  {choice.description}
                                </p>
                              )}
                            </div>
                          </AspectRatio>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Skip button */}
              <div className="text-center pt-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/photographers")}
                  className="text-gray-600 hover:text-gray-900"
                >
                  건너뛰고 모든 작가 보기
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}