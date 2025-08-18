"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Camera, Users, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getPhotographers, type PhotographerData } from "@/lib/actions/photographers";
import { getReviewStats } from "@/lib/actions/reviews";

interface PhotographerWithReviews extends PhotographerData {
  averageRating?: number;
  totalReviews?: number;
}

export function PhotographersSection() {
  const [photographers, setPhotographers] = useState<PhotographerWithReviews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPhotographers() {
      try {
        const result = await getPhotographers({ sortBy: 'portfolio' });
        if (result.data) {
          // Get review stats for each photographer
          const photographersWithReviews = await Promise.all(
            result.data.slice(0, 3).map(async (photographer) => {
              try {
                const reviewStats = await getReviewStats(photographer.id);
                return {
                  ...photographer,
                  averageRating: reviewStats.data?.average_rating || 0,
                  totalReviews: reviewStats.data?.total_reviews || 0,
                };
              } catch (error) {
                return {
                  ...photographer,
                  averageRating: 0,
                  totalReviews: 0,
                };
              }
            })
          );
          setPhotographers(photographersWithReviews);
        }
      } catch (error) {
        console.error('Failed to fetch photographers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPhotographers();
  }, []);

  // Mock portfolio images for demonstration
  const mockPortfolioImages = [
    "https://picsum.photos/seed/portfolio1/400/300",
    "https://picsum.photos/seed/portfolio2/400/300",
    "https://picsum.photos/seed/portfolio3/400/300",
    "https://picsum.photos/seed/portfolio4/400/300",
    "https://picsum.photos/seed/portfolio5/400/300",
  ];

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-orange-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Users className="w-4 h-4" />
            전문 작가진
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            우리 작가들을 
            <br />
            <span className="text-orange-600">소개합니다</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            각각의 독특한 스타일과 전문성을 가진 작가들이 
            <br className="hidden md:block" />
            당신만의 완벽한 순간을 포착해드립니다.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {photographers.map((photographer, index) => (
            <motion.div
              key={photographer.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group">
                <CardContent className="p-0">
                  {/* Portfolio Carousel */}
                  <div className="relative h-64 bg-gray-100">
                    <Carousel className="w-full h-full">
                      <CarouselContent>
                        {mockPortfolioImages.slice(0, 3).map((imageUrl, imgIndex) => (
                          <CarouselItem key={imgIndex}>
                            <div className="relative w-full h-64">
                              <Image
                                src={imageUrl}
                                alt={`${photographer.name} 포트폴리오 ${imgIndex + 1}`}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>
                    
                    {/* Portfolio count badge */}
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                      <Camera className="w-4 h-4 inline mr-1" />
                      {photographer.portfolioCount}장
                    </div>
                  </div>

                  {/* Photographer Info */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900">
                        {photographer.name}
                      </h3>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm text-gray-600">
                          {photographer.averageRating ? photographer.averageRating.toFixed(1) : "-"}
                        </span>
                        {photographer.totalReviews ? (
                          <span className="text-xs text-gray-500">({photographer.totalReviews})</span>
                        ) : null}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 text-sm">
                      전문적인 촬영 경험과 독특한 감성으로 
                      당신만의 특별한 순간을 만들어드립니다.
                    </p>
                    
                    {/* Specialty badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        감성 포트레이트
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        도시적 스타일
                      </Badge>
                    </div>

                    {/* View portfolio button */}
                    <Link href={`/photographers/${photographer.id}`}>
                      <Button 
                        variant="default" 
                        className="w-full bg-orange-500 text-white hover:bg-orange-600 border border-orange-500 shine-effect"
                      >
                        1분 자기소개 영상 보기
                      </Button>
                    </Link>
                    <Link href={`/photographers/${photographer.id}`}>
                      <Button 
                        variant="outline" 
                        className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        포트폴리오 보기
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-6">
            더 많은 전문 작가들을 만나보세요!
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/photographers"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
            >
              모든 작가 보기
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}