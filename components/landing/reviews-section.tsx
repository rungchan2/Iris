'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'

// 더미 리뷰 데이터 (실제로는 Supabase에서 가져와야 함)
const REVIEWS = [
  {
    id: 1,
    content: "성격 진단 결과에 정말 맞는 컨셉으로 촬영해주셔서 너무 만족했어요!",
    rating: 5,
    author: "김**",
    personality: "감성 기록자"
  },
  {
    id: 2,
    content: "AI 미리보기와 실제 결과물이 거의 비슷해서 놀랐습니다. 완전 추천해요!",
    rating: 5,
    author: "박**",
    personality: "시네마틱 몽상가"
  },
  {
    id: 3,
    content: "내 성향을 이렇게까지 잘 이해해주신 작가님 만나기 정말 힘든데... 감사해요",
    rating: 5,
    author: "이**",
    personality: "고요한 관찰자"
  },
  {
    id: 4,
    content: "진단받은 성격 유형이 정말 저랑 딱 맞아떨어져서 신기했어요!",
    rating: 5,
    author: "최**",
    personality: "활력 가득 리더"
  },
  {
    id: 5,
    content: "성향에 맞는 소품과 배경까지 완벽하게 준비해주셔서 감동받았습니다",
    rating: 4,
    author: "정**",
    personality: "자유로운 탐험가"
  },
  {
    id: 6,
    content: "21문항 진단이 생각보다 정확해서 깜짝 놀랐어요. 결과물도 대만족!",
    rating: 5,
    author: "한**",
    personality: "도시의 드리머"
  }
]

function FloatingReview({ review, delay, duration, startX, startY }: {
  review: typeof REVIEWS[0]
  delay: number
  duration: number
  startX: string
  startY: string
}) {
  return (
    <div 
      className="absolute animate-bounce opacity-0 hover:opacity-100 transition-opacity animate-fade-in"
      style={{
        left: startX,
        top: startY,
        animationDelay: `${delay}s, ${delay * 0.2}s`,
        animationDuration: `${duration}s, 0.6s`,
        animationIterationCount: 'infinite, 1',
        animationDirection: 'alternate, normal',
        animationFillMode: 'both, forwards'
      }}
    >
      <div className="bg-white rounded-2xl shadow-lg p-4 max-w-xs border border-gray-100">
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
      </div>
    </div>
  )
}

export function ReviewsSection() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

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
    </section>
  )
}