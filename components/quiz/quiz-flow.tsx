"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function QuizFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 21;
  
  // Mock 질문 데이터
  const mockQuestions = Array.from({ length: totalSteps }, (_, i) => ({
    id: i + 1,
    question: `샘플 질문 ${i + 1}`,
    choices: ['선택지 A', '선택지 B', '선택지 C', '선택지 D']
  }));

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentQuestion = mockQuestions[currentStep];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 완료 시 홈으로 이동
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              질문 {currentStep + 1} / {totalSteps}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(progress)}% 완료
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentQuestion.question}
                </h2>
                <p className="text-gray-500">
                  이 기능은 현재 준비 중입니다
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {currentQuestion.choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={handleNext}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 text-left"
                  >
                    <div className="font-medium text-gray-900">{choice}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleNext}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {currentStep === totalSteps - 1 ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      완료하기
                    </>
                  ) : (
                    <>
                      다음 질문
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}