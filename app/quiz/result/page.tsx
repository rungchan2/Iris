"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QuizResult } from "@/components/quiz/quiz-result";
import { personalityTypes, type PersonalityType } from "@/lib/quiz-data";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";

function QuizResultComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [personalityType, setPersonalityType] = useState<PersonalityType | null>(null);
  const [scores, setScores] = useState<Record<PersonalityType, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // URL에서 결과 데이터 추출
    const type = searchParams.get('type') as PersonalityType;
    const scoresData = searchParams.get('scores');

    if (type && personalityTypes[type] && scoresData) {
      try {
        const parsedScores = JSON.parse(decodeURIComponent(scoresData));
        setPersonalityType(type);
        setScores(parsedScores);
      } catch (error) {
        console.error('Error parsing scores:', error);
        router.push('/quiz');
        return;
      }
    } else {
      router.push('/quiz');
      return;
    }

    // 로딩 애니메이션
    setTimeout(() => setIsLoading(false), 1500);
  }, [searchParams, router]);

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
              성향 분석 중...
            </h1>
            <p className="text-gray-600">
              당신만의 특별한 결과를 준비하고 있어요
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

  if (!personalityType || !scores) {
    return null;
  }

  return <QuizResult personalityType={personalityType} scores={scores} sessionId="legacy" />;
}

export default function QuizResultPage() {
  return (
    <Suspense fallback={
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
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            성향 분석 결과 로딩 중...
          </h1>
          <p className="text-gray-600">
            잠시만 기다려주세요
          </p>
        </motion.div>
      </div>
    }>
      <QuizResultComponent />
    </Suspense>
  );
}