'use client'

import { useEffect, useState } from 'react'
import { Star, X, Camera, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// 더미 리뷰 데이터 (실제로는 Supabase에서 가져와야 함)
const REVIEWS = [
  {
    id: 1,
    content: "성격 진단 결과에 정말 맞는 컨셉으로 촬영해주셔서 너무 만족했어요!",
    fullContent: "성격 진단을 통해 제가 '감성 기록자' 타입이라는 걸 알았고, 그에 맞는 컨셉으로 촬영을 진행했는데 정말 대만족이었어요. 작가님이 제 성향을 완벽하게 이해하고 자연스러운 감정이 드러나는 순간들을 포착해주셨어요.",
    rating: 5,
    author: "김**",
    personality: "감성 기록자",
    photographer: {
      id: "1",
      name: "김민준 작가",
      specialty: "감성 포트레이트",
      experience: "5년차",
      image: "/images/photographer-sample.jpg"
    }
  },
  {
    id: 2,
    content: "AI 미리보기와 실제 결과물이 거의 비슷해서 놀랐습니다. 완전 추천해요!",
    fullContent: "AI 이미지 생성으로 미리 보여주신 결과물과 실제 촬영 결과가 정말 비슷해서 깜짝 놀랐어요. 시네마틱한 무드가 정확히 제가 원하던 스타일이었고, 작가님의 디렉팅도 완벽했습니다.",
    rating: 5,
    author: "박**",
    personality: "시네마틱 몽상가",
    photographer: {
      id: "2",
      name: "이소영 작가",
      specialty: "시네마틱 포트레이트",
      experience: "7년차",
      image: "/images/photographer-sample.jpg"
    }
  },
  {
    id: 3,
    content: "내 성향을 이렇게까지 잘 이해해주신 작가님 만나기 정말 힘든데... 감사해요",
    fullContent: "평소에 조용하고 내성적인 성격이라 촬영이 부담스러웠는데, 작가님이 제 성향을 완전히 이해하고 편안한 분위기를 만들어주셨어요. 자연스러운 모습을 찍어주셔서 너무 만족해요.",
    rating: 5,
    author: "이**",
    personality: "고요한 관찰자",
    photographer: {
      id: "3",
      name: "박준혁 작가",
      specialty: "자연스러운 일상",
      experience: "4년차",
      image: "/images/photographer-sample.jpg"
    }
  },
  {
    id: 4,
    content: "진단받은 성격 유형이 정말 저랑 딱 맞아떨어져서 신기했어요!",
    fullContent: "활력 가득 리더 타입으로 나왔는데 정말 저와 딱 맞는 결과였어요! 역동적이고 에너지 넘치는 컨셉으로 촬영했는데 제 성격이 그대로 드러나는 사진들이 나와서 너무 만족합니다.",
    rating: 5,
    author: "최**",
    personality: "활력 가득 리더",
    photographer: {
      id: "4",
      name: "정다은 작가",
      specialty: "역동적 포트레이트",
      experience: "6년차",
      image: "/images/photographer-sample.jpg"
    }
  },
  {
    id: 5,
    content: "성향에 맞는 소품과 배경까지 완벽하게 준비해주셔서 감동받았습니다",
    fullContent: "자유로운 탐험가 타입에 맞게 여행 관련 소품들과 자연스러운 배경까지 세심하게 준비해주셔서 정말 감동받았어요. 제가 좋아하는 스타일로 완벽하게 촬영해주셨습니다.",
    rating: 4,
    author: "정**",
    personality: "자유로운 탐험가",
    photographer: {
      id: "5",
      name: "최현우 작가",
      specialty: "여행/라이프스타일",
      experience: "8년차",
      image: "/images/photographer-sample.jpg"
    }
  },
  {
    id: 6,
    content: "21문항 진단이 생각보다 정확해서 깜짝 놀랐어요. 결과물도 대만족!",
    fullContent: "처음엔 간단한 설문으로 성격을 정확히 알 수 있을까 의심했는데, 21문항 진단 결과가 정말 정확해서 놀랐어요. 도시적이고 세련된 스타일로 촬영한 결과물도 완전 제 취향이에요!",
    rating: 5,
    author: "한**",
    personality: "도시의 드리머",
    photographer: {
      id: "6",
      name: "김서진 작가",
      specialty: "도시적 포트레이트",
      experience: "5년차",
      image: "/images/photographer-sample.jpg"
    }
  }
]

function FloatingReview({ review, delay, duration, startX, startY, onClick }: {
  review: typeof REVIEWS[0]
  delay: number
  duration: number
  startX: string
  startY: string
  onClick: () => void
}) {
  return (
    <motion.div 
      className="absolute animate-bounce opacity-0 hover:opacity-100 transition-opacity animate-fade-in pointer-events-auto cursor-pointer"
      style={{
        left: startX,
        top: startY,
        animationDelay: `${delay}s, ${delay * 0.2}s`,
        animationDuration: `${duration}s, 0.6s`,
        animationIterationCount: 'infinite, 1',
        animationDirection: 'alternate, normal',
        animationFillMode: 'both, forwards'
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className="bg-white rounded-2xl shadow-lg p-4 max-w-xs border border-gray-100 hover:shadow-xl transition-shadow">
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-700 mb-2 leading-relaxed">
          "{review.content}"
        </p>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{review.author}</span>
          <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
            {review.personality}
          </span>
        </div>
        <div className="text-xs text-orange-500 mt-2 font-medium">
          클릭해서 자세히 보기 →
        </div>
      </div>
    </motion.div>
  )
}

// 리뷰 상세 모달 컴포넌트
function ReviewModal({ review, isOpen, onClose }: {
  review: typeof REVIEWS[0] | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!review) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            {/* 모달 컨텐츠 */}
            <motion.div
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center rounded-t-2xl">
                <h3 className="text-xl font-bold text-gray-900">고객 리뷰</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 리뷰 내용 */}
              <div className="p-6 space-y-6">
                {/* 평점 및 성격유형 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="font-semibold text-lg ml-2">{review.rating}/5</span>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {review.personality}
                  </span>
                </div>

                {/* 리뷰 전문 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed">
                    "{review.fullContent}"
                  </p>
                  <div className="mt-3 text-sm text-gray-500">
                    - {review.author}
                  </div>
                </div>

                {/* 작가 정보 */}
                <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">{review.photographer.name}</h4>
                      <p className="text-gray-600">{review.photographer.specialty}</p>
                      <p className="text-sm text-gray-500">{review.photographer.experience}</p>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/photographers/${review.photographer.id}/booking`}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                  >
                    이 작가와 촬영하기
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function ReviewsSection() {
  const [mounted, setMounted] = useState(false)
  const [selectedReview, setSelectedReview] = useState<typeof REVIEWS[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleReviewClick = (review: typeof REVIEWS[0]) => {
    setSelectedReview(review)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedReview(null)
  }

  if (!mounted) return null

  return (
    <section className="relative py-32 min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden flex items-center">
      {/* 배경 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20" />
      
      {/* 떠다니는 리뷰들 - 중앙 박스 영역 피해서 겹치지 않게 배치 */}
      <div className="absolute inset-0 pointer-events-none">
        {REVIEWS.map((review, index) => {
          // 고정된 위치로 배치하여 겹침 방지
          const positions = [
            { x: '8%', y: '15%' },   // 왼쪽 위
            { x: '82%', y: '20%' },  // 오른쪽 위
            { x: '5%', y: '45%' },   // 왼쪽 중간
            { x: '85%', y: '50%' },  // 오른쪽 중간
            { x: '10%', y: '75%' },  // 왼쪽 아래
            { x: '80%', y: '80%' },  // 오른쪽 아래
          ];
          
          const position = positions[index] || positions[index % positions.length];
          
          return (
            <FloatingReview
              key={review.id}
              review={review}
              delay={index * 0.5}
              duration={4 + (index % 3)}
              startX={position.x}
              startY={position.y}
              onClick={() => handleReviewClick(review)}
            />
          );
        })}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full animate-fade-in-up">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-white/50">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            내가 가장
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block sm:inline sm:ml-3">
              푹 빠질 수 있는
            </span>
            <span className="block mt-1">촬영</span>
          </h2>
          
          <p className="text-lg sm:text-xl text-gray-600 mb-6 leading-relaxed">
            성격 진단을 통해 나만의 스타일을 발견하고<br />
            완벽하게 맞는 작가와 함께하는 특별한 경험
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-semibold">4.9/5.0</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <span>실제 고객 {REVIEWS.length}개 리뷰</span>
          </div>
        </div>
      </div>

      {/* 리뷰 상세 모달 */}
      <ReviewModal 
        review={selectedReview}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </section>
  )
}