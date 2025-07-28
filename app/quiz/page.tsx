"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Brain, Sparkles, Camera } from "lucide-react";
import { QuizFlow } from "@/components/quiz/quiz-flow";
import { type PersonalityType } from "@/lib/quiz-data";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function QuizPage() {
  const router = useRouter();
  const [hasStarted, setHasStarted] = useState(false);

  const handleQuizComplete = (personalityType: PersonalityType, scores: Record<PersonalityType, number>) => {
    // 결과 페이지로 이동 (URL 파라미터로 데이터 전달)
    const scoresParam = encodeURIComponent(JSON.stringify(scores));
    router.push(`/quiz/result?type=${personalityType}&scores=${scoresParam}`);
  };

  if (hasStarted) {
    return <QuizFlow onComplete={handleQuizComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            성향 진단을 시작합니다
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            21개의 간단한 질문으로 당신만의 사진 성향을 찾아보세요.
            <br className="hidden md:block" />
            약 5분이면 완료됩니다.
          </p>
        </div>

        <Card className="mb-8 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">정확한 분석</h3>
                <p className="text-sm text-gray-600">심리학 기반 검증된 질문으로 정확한 성향 파악</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI 미리보기</h3>
                <p className="text-sm text-gray-600">결과에 따른 AI 생성 이미지 미리보기 제공</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">작가 매칭</h3>
                <p className="text-sm text-gray-600">성향에 맞는 전문 작가 추천 및 바로 예약</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Button
            size="lg"
            onClick={() => setHasStarted(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
          >
            진단 시작하기
          </Button>
          
          <div className="flex justify-center">
            <Link 
              href="/"
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              메인으로 돌아가기
            </Link>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-400">
          ⏱️ 평균 소요시간: 5분 • 🔒 개인정보는 안전하게 보호됩니다
        </div>
      </motion.div>
    </div>
  );
}