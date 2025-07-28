"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Download, Camera, Users, ArrowRight, Sparkles } from "lucide-react";
import { personalityTypes, type PersonalityType } from "@/lib/quiz-data";
import Link from "next/link";

interface QuizResultProps {
  personalityType: PersonalityType;
  scores: Record<PersonalityType, number>;
}

export function QuizResult({ personalityType, scores }: QuizResultProps) {
  const result = personalityTypes[personalityType];
  
  // 상위 3개 성격유형 (호환성 분석용)
  const topThree = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([type, score]) => ({ type: type as PersonalityType, score }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <motion.section
        className={`py-20 text-center bg-gradient-to-br ${result.bgColor} relative overflow-hidden`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-10 w-32 h-32 bg-white/20 rounded-full blur-xl" />
          <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-white/20 rounded-full blur-xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${result.color} flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-2xl">{result.code}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              당신은 <span className="text-orange-600">{result.name}</span>입니다
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {result.description}
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 space-y-16">
        {/* Personality Details */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Main Info */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">당신의 특징</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">대표 키워드</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.styleKeywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">추천 촬영 장소</h3>
                    <div className="space-y-2">
                      {result.recommendedLocations.map((location, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                          <span className="text-gray-600">{location}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">추천 소품</h3>
                    <div className="space-y-2">
                      {result.recommendedProps.map((prop, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                          <span className="text-gray-600">{prop}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Compatibility */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">성향 분석</h2>
                
                <div className="space-y-4">
                  {topThree.map(({ type, score }, index) => {
                    const typeInfo = personalityTypes[type];
                    const percentage = Math.round((score / Math.max(...Object.values(scores))) * 100);
                    
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${typeInfo.color} flex items-center justify-center`}>
                              <span className="text-white font-bold text-sm">{type}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">{typeInfo.name}</span>
                              {index === 0 && (
                                <span className="ml-2 text-xs text-orange-600 font-medium">주 성향</span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r ${typeInfo.color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* AI Preview Section (Placeholder) */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">AI 이미지 미리보기</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  당신의 성향에 맞는 AI 생성 이미지 미리보기 기능이 곧 제공됩니다.<br />
                  현재는 전문 작가와의 매칭 서비스를 이용해보세요.
                </p>
                
                <div className="bg-gray-100 rounded-lg p-12 mb-6">
                  <div className="text-gray-400">
                    <Camera className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg font-medium">AI 이미지 생성 예정</p>
                    <p className="text-sm">성향별 맞춤 스타일 미리보기</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Photographer Matching Section (Placeholder) */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">추천 작가 매칭</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  {result.name} 성향에 가장 잘 맞는 전문 작가들을 매칭해드립니다.<br />
                  현재는 직접 예약 시스템을 통해 촬영을 예약해보세요.
                </p>
                
                <div className="bg-gray-100 rounded-lg p-12 mb-6">
                  <div className="text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg font-medium">작가 매칭 시스템 준비 중</p>
                    <p className="text-sm">성향 호환성 기반 추천</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Call to Action */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">이제 당신만의 사진을 촬영해보세요!</h2>
              <p className="text-orange-100 mb-6">
                진단 결과를 바탕으로 완벽한 사진 촬영을 경험해보세요.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/booking">
                  <Button
                    size="lg"
                    className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-3 font-semibold"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    촬영 예약하기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10 px-8 py-3"
                >
                  <Share2 className="mr-2 h-5 w-5" />
                  결과 공유하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Other Actions */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center space-y-4"
        >
          <Link 
            href="/quiz"
            className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            다시 진단하기
          </Link>
          <span className="text-gray-400 mx-4">|</span>
          <Link 
            href="/"
            className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            홈으로 돌아가기
          </Link>
        </motion.section>
      </div>
    </div>
  );
}