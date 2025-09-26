'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowRight, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const photographers = [
  {
    id: 1,
    name: '김민수',
    title: 'Natural Light Specialist',
    description: '자연광을 활용한 감성적인 포트레이트를 추구합니다. 10년간의 경험으로 당신의 가장 자연스러운 순간을 담아드립니다.',
    images: [
      'https://picsum.photos/seed/photographer1a/800/1200',
      'https://picsum.photos/seed/photographer1b/800/1200',
      'https://picsum.photos/seed/photographer1c/800/1200',
      'https://picsum.photos/seed/photographer1d/800/1200',
    ],
    rating: 4.9,
    reviews: 127,
    specialties: ['포트레이트', '웨딩', '프로필'],
    yearsOfExperience: 10,
    profileUrl: '/photographers/kim-minsu',
    bookingUrl: '/booking/kim-minsu',
  },
  {
    id: 2,
    name: '이서연',
    title: 'Lifestyle & Portrait',
    description: '일상 속 특별한 순간들을 발견하고 기록합니다. 편안하고 친근한 분위기에서 진정한 당신을 표현해보세요.',
    images: [
      'https://picsum.photos/seed/photographer2a/800/1200',
      'https://picsum.photos/seed/photographer2b/800/1200',
      'https://picsum.photos/seed/photographer2c/800/1200',
      'https://picsum.photos/seed/photographer2d/800/1200',
    ],
    rating: 4.8,
    reviews: 98,
    specialties: ['라이프스타일', '가족사진', '개인화보'],
    yearsOfExperience: 7,
    profileUrl: '/photographers/lee-seoyeon',
    bookingUrl: '/booking/lee-seoyeon',
  },
  {
    id: 3,
    name: '박준영',
    title: 'Creative Director',
    description: '독창적인 컨셉과 감각적인 연출로 특별한 작품을 만듭니다. 당신만의 스토리를 예술로 승화시켜드립니다.',
    images: [
      'https://picsum.photos/seed/photographer3a/800/1200',
      'https://picsum.photos/seed/photographer3b/800/1200',
      'https://picsum.photos/seed/photographer3c/800/1200',
      'https://picsum.photos/seed/photographer3d/800/1200',
    ],
    rating: 5.0,
    reviews: 156,
    specialties: ['컨셉촬영', '패션', '광고'],
    yearsOfExperience: 12,
    profileUrl: '/photographers/park-junyoung',
    bookingUrl: '/booking/park-junyoung',
  },
];

export function PhotographerCarousel() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState<{[key: number]: number}>({});

  const nextImage = (photographerId: number, totalImages: number) => {
    setImageIndex(prev => ({
      ...prev,
      [photographerId]: ((prev[photographerId] || 0) + 1) % totalImages
    }));
  };

  const prevImage = (photographerId: number, totalImages: number) => {
    setImageIndex(prev => ({
      ...prev,
      [photographerId]: ((prev[photographerId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  return (
    <section className="relative w-full h-[100dvh] bg-white flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white opacity-30" />
      
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 h-full items-center">
          {photographers.map((photographer) => {
            const currentImageIndex = imageIndex[photographer.id] || 0;
            const currentImage = photographer.images[currentImageIndex];
            
            return (
              <div
                key={photographer.id}
                className="group relative cursor-pointer"
                onMouseEnter={() => setHoveredId(photographer.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Card Container */}
                <div className="relative bg-white rounded-xl overflow-hidden shadow-xl transform transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl">
                  {/* Overlay Animation */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                  
                  {/* Card Layout - 가로 세로 비율 조정 */}
                  <div className="flex flex-col lg:flex-row">
                    {/* Image Section with Carousel */}
                    <div className="relative w-full lg:w-3/5 h-[40vh] lg:h-[50vh] bg-gray-100 overflow-hidden">
                      <Image
                        src={currentImage}
                        alt={`${photographer.name} - ${currentImageIndex + 1}`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        unoptimized
                      />
                      
                      {/* Image Navigation Arrows */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage(photographer.id, photographer.images.length);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 hover:bg-white transition-all duration-300 z-30"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-3 h-3 text-gray-900" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage(photographer.id, photographer.images.length);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 hover:bg-white transition-all duration-300 z-30"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-3 h-3 text-gray-900" />
                      </button>

                      {/* Image Dots */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                        {photographer.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageIndex(prev => ({
                                ...prev,
                                [photographer.id]: index
                              }));
                            }}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              index === currentImageIndex
                                ? 'bg-white'
                                : 'bg-white/50 hover:bg-white/80'
                            }`}
                            aria-label={`View image ${index + 1}`}
                          />
                        ))}
                      </div>
                      
                      {/* Floating Info on Hover */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500 z-20">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                          <User className="w-4 h-4 text-gray-900" />
                        </div>
                      </div>

                      {/* Rating Float */}
                      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all duration-500 delay-75 z-20">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center space-x-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-gray-900">{photographer.rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Section - 컴팩트하게 */}
                    <div className="w-full lg:w-2/5 p-4 lg:p-5 flex flex-col justify-between relative z-20">
                      <div className="space-y-3">
                        {/* Name & Title */}
                        <div className="transform transition-transform duration-500 group-hover:-translate-y-1">
                          <h2 className="text-xl lg:text-2xl font-light text-gray-900 group-hover:text-black transition-colors leading-tight">
                            {photographer.name}
                          </h2>
                          <p className="text-xs lg:text-sm text-gray-600 font-light mt-1">
                            {photographer.title}
                          </p>
                        </div>

                        {/* Experience & Reviews */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>경력 {photographer.yearsOfExperience}년</span>
                          <span>{photographer.reviews} 리뷰</span>
                        </div>

                        {/* Specialties */}
                        <div className="flex flex-wrap gap-1">
                          {photographer.specialties.map((specialty) => (
                            <span
                              key={specialty}
                              className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 group-hover:bg-gray-200 rounded-full transition-colors duration-300"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Hover-only Content with Absolute Positioning */}
                      <div className="absolute inset-x-4 lg:inset-x-5 bottom-4 lg:bottom-5 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                        {/* Description */}
                        <p className="text-xs lg:text-sm text-gray-700 leading-relaxed mb-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                          {photographer.description}
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                          <Link href={photographer.profileUrl} className="flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 text-xs h-8"
                            >
                              <span className="mr-1">프로필</span>
                              <User className="w-3 h-3" />
                            </Button>
                          </Link>
                          <Link href={photographer.bookingUrl} className="flex-1">
                            <Button
                              size="sm"
                              className="w-full bg-gray-900 text-white hover:bg-black transition-all duration-300 text-xs h-8"
                            >
                              <span className="mr-1">예약</span>
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Glow Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-300 to-gray-100 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10" />
                </div>

                {/* Background Blur Effect */}
                <div 
                  className="absolute inset-0 bg-white/5 backdrop-blur-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-20 scale-110"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}