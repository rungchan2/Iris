"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuizResult } from "@/components/quiz/quiz-result";
import { type PersonalityType } from "@/lib/quiz-data";
import { getQuizSession, getPersonalityType } from "@/lib/actions/quiz";
import { motion } from "framer-motion";
import { Brain, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ResultData {
  personalityType: PersonalityType;
  scores: Record<string, number>;
  sessionId: string;
}

export default function QuizResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResult = async () => {
      try {
        if (!sessionId) {
          setError("올바르지 않은 세션입니다");
          return;
        }

        // Get quiz session
        const sessionResult = await getQuizSession(sessionId);
        
        if (!sessionResult.success || !sessionResult.session) {
          setError("세션을 찾을 수 없습니다");
          return;
        }

        const session = sessionResult.session;
        
        if (!session.is_completed || !session.calculated_personality_code) {
          setError("아직 완료되지 않은 진단입니다");
          return;
        }

        // Get personality type details
        const personalityResult = await getPersonalityType(session.calculated_personality_code);
        
        if (!personalityResult.success) {
          setError("성격유형 정보를 불러올 수 없습니다");
          return;
        }

        setResultData({
          personalityType: session.calculated_personality_code as PersonalityType,
          scores: (session.total_score_data as Record<string, number>) || {},
          sessionId: sessionId
        });

      } catch (error) {
        console.error('Error loading quiz result:', error);
        setError("결과를 불러오는 중 오류가 발생했습니다");
      } finally {
        // 로딩 애니메이션을 위한 최소 시간
        setTimeout(() => setIsLoading(false), 1500);
      }
    };

    loadResult();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              성향 분석 결과 준비 중...
            </h1>
            <p className="text-gray-600">
              당신만의 특별한 결과를 불러오고 있어요
            </p>
          </motion.div>

          {/* Loading dots */}
          <motion.div
            className="flex justify-center items-center space-x-1 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-orange-500 rounded-full"
                animate={{ y: [-4, 4, -4] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            결과를 불러올 수 없습니다
          </h1>
          
          <p className="text-gray-600 mb-8">
            {error}
          </p>
          
          <div className="space-y-4">
            <Link href="/quiz">
              <Button size="lg" className="w-full">
                새로운 진단 시작하기
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="outline" size="lg" className="w-full">
                홈으로 돌아가기
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!resultData) {
    return null;
  }

  return (
    <QuizResult 
      personalityType={resultData.personalityType} 
      scores={resultData.scores} 
      sessionId={resultData.sessionId}
    />
  );
}