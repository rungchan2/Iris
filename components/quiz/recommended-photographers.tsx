"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { 
  Users, 
  Star, 
  Calendar, 
  MessageCircle, 
  Camera,
  ChevronRight,
  Heart
} from "lucide-react";
import { PersonalityType } from "@/lib/quiz-data";
import { getRecommendedPhotographers, RecommendedPhotographer } from "@/lib/actions/matching";
import Link from "next/link";

interface RecommendedPhotographersProps {
  personalityCode: PersonalityType;
}

export function RecommendedPhotographers({ personalityCode }: RecommendedPhotographersProps) {
  const [photographers, setPhotographers] = useState<RecommendedPhotographer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPhotographers = async () => {
      try {
        const result = await getRecommendedPhotographers(personalityCode);
        if (result.success && result.photographers) {
          setPhotographers(result.photographers);
        }
      } catch (error) {
        console.error("Error loading recommended photographers:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPhotographers();
  }, [personalityCode]);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">추천 작가 매칭</h2>
            <div className="space-y-4">
              {Array(3).fill(null).map((_, index) => (
                <div 
                  key={index} 
                  className="bg-gray-100 rounded-lg h-24 animate-pulse"
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (photographers.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">추천 작가 매칭</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              {personalityCode} 성향에 가장 잘 맞는 전문 작가들을 매칭해드립니다.<br />
              현재는 직접 예약 시스템을 통해 촬영을 예약해보세요.
            </p>
            
            <div className="bg-gray-100 rounded-lg p-12 mb-6">
              <div className="text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg font-medium">작가 매칭 시스템 준비 중</p>
                <p className="text-sm">성향 호환성 기반 추천</p>
              </div>
            </div>

            <Link href="/booking">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Calendar className="mr-2 h-5 w-5" />
                직접 예약하기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {personalityCode} 성향 추천 작가
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            당신의 성향과 가장 잘 맞는 전문 작가들을 호환성 점수순으로 추천해드립니다.
          </p>
        </div>

        <div className="space-y-6">
          {photographers.map((photographer, index) => (
            <motion.div
              key={photographer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                {photographer.is_primary && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
                      <Star className="w-3 h-3 mr-1" />
                      전문 작가
                    </Badge>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* 작가 기본 정보 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {photographer.name}
                        </h3>
                        
                        {/* 호환성 점수 */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 text-red-500 mr-1" />
                            <span className="text-sm font-medium text-gray-700">
                              호환성
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${photographer.compatibility_score * 10}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-green-600">
                              {photographer.compatibility_score}/10
                            </span>
                          </div>
                        </div>

                        {photographer.notes && (
                          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                            {photographer.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Camera className="w-4 h-4 mr-1" />
                            <span>포트폴리오 {photographer.total_photos}장</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 포트폴리오 미리보기 */}
                    {photographer.portfolio_photos.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">대표 작품</h4>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {photographer.portfolio_photos.slice(0, 6).map((photo, photoIndex) => (
                            <div 
                              key={photo.id}
                              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-pointer"
                            >
                              <Image
                                src={photo.thumbnail_url || photo.photo_url}
                                alt={photo.title || `작품 ${photoIndex + 1}`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {photo.is_representative && (
                                <div className="absolute top-1 right-1">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 액션 버튼들 */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href={`/photographers/${photographer.id}/booking`} className="flex-1">
                        <Button 
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                          size="lg"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          이 작가와 촬영 예약
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      
                      <Link href={`/photographers/${photographer.id}`}>
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="border-green-200 text-green-700 hover:bg-green-50"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          작가 상세보기
                        </Button>
                      </Link>

                      <Button 
                        variant="outline" 
                        size="lg"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        문의하기
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 하단 CTA */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-600 mb-4">
            더 많은 작가들을 확인하고 싶으시나요?
          </p>
          <Link href="/photographers">
            <Button variant="outline" size="lg">
              <Users className="mr-2 h-5 w-5" />
              전체 작가 보기
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}