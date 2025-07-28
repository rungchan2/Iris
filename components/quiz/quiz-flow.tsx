"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, Brain } from "lucide-react";
import { quizQuestions, calculatePersonalityType, calculateAllScores, type PersonalityType } from "@/lib/quiz-data";
import { useRouter } from "next/navigation";

interface QuizFlowProps {
  onComplete: (result: PersonalityType, scores: Record<PersonalityType, number>) => void;
}

export function QuizFlow({ onComplete }: QuizFlowProps) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedChoice, setSelectedChoice] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const question = quizQuestions[currentQuestion];

  // 현재 질문의 답변이 있는지 확인
  useEffect(() => {
    const currentAnswer = answers[question.id];
    setSelectedChoice(currentAnswer || "");
  }, [currentQuestion, answers, question.id]);

  const handleChoiceSelect = (choiceId: string) => {
    setSelectedChoice(choiceId);
    setAnswers(prev => ({
      ...prev,
      [question.id]: choiceId
    }));
  };

  const handleNext = async () => {
    if (!selectedChoice) return;
    
    setIsAnimating(true);
    setDirection('forward');
    
    // 애니메이션 시간
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // 마지막 질문이면 결과 계산
      const finalAnswers = {
        ...answers,
        [question.id]: selectedChoice
      };
      const personalityType = calculatePersonalityType(finalAnswers);
      const allScores = calculateAllScores(finalAnswers);
      onComplete(personalityType, allScores);
    }
    
    setIsAnimating(false);
  };

  const handlePrevious = async () => {
    if (currentQuestion === 0) return;
    
    setIsAnimating(true);
    setDirection('backward');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setCurrentQuestion(prev => prev - 1);
    setIsAnimating(false);
  };

  const handleBack = () => {
    if (currentQuestion === 0) {
      router.push('/quiz');
    } else {
      handlePrevious();
    }
  };

  // 애니메이션 variants
  const slideVariants = {
    enter: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'forward' | 'backward') => ({
      zIndex: 0,
      x: direction === 'forward' ? -300 : 300,
      opacity: 0,
    }),
  };

  const choiceVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1 + 0.2,
        duration: 0.3,
        ease: "easeOut"
      }
    }),
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentQuestion === 0 ? '처음으로' : '이전'}
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Brain className="w-4 h-4" />
              성향 진단 중
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">진행률</span>
              <span className="text-gray-500">
                {currentQuestion + 1} / {quizQuestions.length}
              </span>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-3" />
              <motion.div
                className="absolute top-0 left-0 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Question Card */}
        <div className="relative h-[600px] md:h-[500px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0"
            >
              <Card className="h-full border-0 shadow-xl">
                <CardContent className="p-8 h-full flex flex-col justify-between">
                  <div>
                    {/* Question Header */}
                    <motion.div 
                      className="text-center mb-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-6">
                        {question.part} 파트
                        <div className="w-1 h-1 rounded-full bg-orange-600"></div>
                        <span className="text-orange-600">
                          {question.part === '감정' ? '1-10번' : '11-21번'}
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">
                        {question.question}
                      </h2>
                    </motion.div>

                    {/* Choices */}
                    <div className="space-y-3">
                      <AnimatePresence>
                        {question.choices.map((choice, index) => (
                          <motion.div
                            key={choice.id}
                            custom={index}
                            variants={choiceVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            <button
                              onClick={() => handleChoiceSelect(choice.id)}
                              className={`
                                w-full p-4 text-left rounded-xl border-2 transition-all duration-200 
                                ${
                                  selectedChoice === choice.id
                                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20 shadow-md transform scale-[1.02]'
                                    : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 hover:shadow-sm'
                                }
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`
                                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                                  ${
                                    selectedChoice === choice.id
                                      ? 'border-orange-500 bg-orange-500'
                                      : 'border-gray-300'
                                  }
                                `}>
                                  {selectedChoice === choice.id && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <CheckCircle className="w-3 h-3 text-white" />
                                    </motion.div>
                                  )}
                                </div>
                                <span className={`
                                  font-medium transition-colors duration-200
                                  ${
                                    selectedChoice === choice.id
                                      ? 'text-orange-800'
                                      : 'text-gray-700'
                                  }
                                `}>
                                  {choice.text}
                                </span>
                              </div>
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Navigation */}
                  <motion.div 
                    className="flex justify-end mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <Button
                      onClick={handleNext}
                      disabled={!selectedChoice || isAnimating}
                      size="lg"
                      className="px-8 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {currentQuestion === quizQuestions.length - 1 ? '결과 보기' : '다음'}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Question Counter */}
        <motion.div 
          className="mt-6 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            {quizQuestions.map((_, index) => (
              <div
                key={index}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${
                    index === currentQuestion
                      ? 'bg-orange-600 w-8'
                      : index < currentQuestion
                      ? 'bg-orange-300'
                      : 'bg-gray-300'
                  }
                `}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}