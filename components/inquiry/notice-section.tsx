"use client"

import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function NoticeSection() {
  const scrollToForm = () => {
    document.getElementById("inquiry-form")?.scrollIntoView({
      behavior: "smooth",
    })
  }

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center bg-black text-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">촬영 안내사항</h2>

        <div className="space-y-6 text-lg md:text-xl text-gray-200 mb-12">
          <p>
            시네마틱 프로필 촬영은 단순한 사진 촬영이 아닌,
            <br />
            당신의 이야기를 담아내는 특별한 경험입니다.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold">촬영 시간</h3>
              <p className="text-base text-gray-300">45분 동안 진행되며, 충분한 상담 시간이 포함됩니다</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-semibold">준비사항</h3>
              <p className="text-base text-gray-300">편안한 마음과 자신을 표현하고 싶은 의상을 준비해주세요</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-semibold">결과물</h3>
              <p className="text-base text-gray-300">보정된 사진 15-20장을 일주일 내 전달드립니다</p>
            </div>
          </div>
        </div>

        <Button onClick={scrollToForm} size="lg" className="bg-white text-black hover:bg-gray-100 transition-colors">
          촬영 예약하기
          <ChevronDown className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-8 w-8 text-white/50" />
      </div>
    </section>
  )
}
