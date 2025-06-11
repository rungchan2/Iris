"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { HelpCircle, X, ChevronDown, ChevronUp, Instagram } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "어떤 장소나 시간대로 촬영하나요?",
    answer: "희망하시는 예시 사진을 전달해주시면, 장소와 추천 시간대를 안내드립니다. 그중 마음에 드는 옵션으로 선택해주시면 됩니다. (저희는 답사를 완료한 장소에 한해서만 추천을 드리기 때문에 공유드린 장소들 중 원하는 느낌이 없으실 경우 직접 검색 후 주소를 공유해주셔야 합니다!)"
  },
  {
    question: "의상이나 소품은 어떻게 준비하나요?",
    answer: "구비된 소품(분장용 피, 라이터 등)은 무료로 사용 가능하며, 그 외에는 직접 준비해주셔야 합니다."
  },
  {
    question: "헤어나 메이크업도 포함되나요?",
    answer: "포함되어 있지 않으며, 메이크업 및 특수분장 제휴 업체를 소개해드릴 수 있습니다."
  },
  {
    question: "한 번에 여러 컨셉도 촬영 가능한가요?",
    answer: "네, 타임당 컨셉 수에는 제한이 없습니다. 단, 환복 및 이동 시간도 포함되는 점 참고 부탁드립니다."
  },
  {
    question: "보정본은 추가할 수 있나요?",
    answer: "장당 2만원에 추가 가능하며, SNS 업로드 및 마케팅 활용에 동의해주시면 기본적으로 5장을 추가 제공해드립니다."
  },
  {
    question: "보정본 수정도 가능한가요?",
    answer: "1회 무료 수정이 가능하며, 이후 장당 2만원의 추가 비용이 발생합니다."
  },
  {
    question: "사진은 언제, 어떤 방식으로 전달되나요?",
    answer: "촬영 후 원본을 먼저 전달드리고, 고객님의 셀렉 완료 후 보정본을 보내드립니다. 원본 전달일 기준 2주 이내 셀렉이 완료되지 않을 경우, 임의로 보정 후 전달드립니다."
  },
  {
    question: "원본 사진은 얼마나 보관되나요?",
    answer: "공유일 기준 2주 후 자동 삭제되며, 연장을 원하실 경우 별도 요청해주세요."
  },
  {
    question: "미성년자도 촬영에 참여할 수 있나요?",
    answer: "예약자분이 성인이실 경우 가능합니다."
  },
  {
    question: "스튜디오 촬영도 가능한가요?",
    answer: "스튜디오 촬영을 희망하시는 경우, 직접 검색 및 예약을 진행해주시면 됩니다"
  }
]

function FAQItem({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-gray-50">
          <span className="font-medium text-sm">Q. {item.question}</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="text-sm text-gray-600 leading-relaxed">
          A. {item.answer}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function FAQWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* FAQ Panel - positioned absolutely above the button */}
      <div
        className={cn(
          "absolute bottom-20 right-0 w-96 max-w-[calc(100vw-3rem)] max-h-[70vh] transition-all duration-300 ease-in-out",
          isOpen 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
      >
        <Card className="shadow-lg border-gray-200">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">자주 질문주시는 부분들은 이렇답니다!</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-[50vh] overflow-y-auto space-y-2 p-2 md:p-4">
            {faqData.map((item, index) => (
              <FAQItem key={index} item={item} />
            ))}
            
            {/* Contact Section */}
            <div className="mt-6 pt-4 border-t border-gray-200 p-2 md:p-4">
              <h4 className="font-medium text-sm mb-3">문의하기</h4>
              <p className="text-sm text-gray-600 mb-3">
                추가 문의는 아래 채널로 부탁드립니다.
              </p>
              <a
                href="https://www.instagram.com/sunset_cinematic"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Instagram className="h-4 w-4" />
                인스타그램 DM: @sunset_cinematic
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toggle Button - fixed position */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg bg-orange-400 hover:bg-orange-500 transition-colors duration-300"
      >
        {isOpen ? (
          <X className="h-8 w-8 text-white" />
        ) : (
          <span className="text-black font-bold">FAQ</span>
        )}
      </Button>
    </div>
  )
} 