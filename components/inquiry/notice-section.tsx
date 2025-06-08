"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function NoticeSection() {
  const scrollToForm = () => {
    document.getElementById("inquiry-form")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <section
      className="relative min-h-[100dvh] flex items-center justify-center bg-black text-white py-20"
      id="notice-section"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-lg md:text-xl text-gray-300 mb-4">
            <em>일상을 영화처럼, </em>
            <strong className="text-white text-2xl md:text-3xl">
              시네마틱 프로필
            </strong>
            <em> 예약 페이지입니다.</em>
          </p>

          <div className="space-y-4 text-gray-200 mt-8">
            <p className="text-lg">안녕하세요!</p>
            <p className="text-lg">
              영화 스틸컷같은 감성의 프로필 사진을 촬영하는{" "}
              <strong className="text-white">선셋시네마 팀</strong>입니다.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mt-8 border border-white/20">
            <h3 className="text-xl font-semibold mb-4">
              본 페이지는 1:1 맞춤 촬영 예약을 위한 공간입니다.
            </h3>
            <p className="text-gray-200">
              아래 내용을 읽어보시고 원하시는 날짜/시간을 확인 후 예약을 신청해
              주세요!
            </p>
          </div>
        </div>

        {/* Service Info */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            촬영서비스 안내
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✔</span>
                <div>
                  <strong>촬영 시간:</strong> 45분
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✔</span>
                <div>
                  <strong>촬영 장소:</strong> 서울, 서울근교 내 야외 촬영지(협의
                  후 확정)
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✔</span>
                <div>
                  <strong>제공 사항:</strong> 원본 A컷 전체 + 보정본 10장 +
                  아이폰 촬영 원본사진 10+장
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✔</span>
                <div>
                  <strong>컨셉:</strong> 개인 맞춤 연출로 아래 구글폼을
                  작성해주시면 구체적인 컨셉 조율을 도와드립니다.
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✔</span>
                <div>
                  <strong>금액:</strong>{" "}
                  <span className="text-yellow-400 text-xl font-bold">
                    180,000원(1인기준)
                  </span>
                  <p className="text-sm text-gray-300 mt-1">
                    2인 이상 인당 2만원 추가(최대6인)(7인이상 별도문의)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✔</span>
                <div>
                  <strong>결제 방식:</strong> 계좌이체, 카드결제(네이버
                  스마트스토어로 예약)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Process */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-8 border border-blue-500/30">
            <h3 className="text-2xl font-semibold mb-6 text-center">
              예약 프로세스
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  신청 후 영업일 기준 2-3일 이내에 예약 연락을 드립니다.
                  (카카오톡 메시지)
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p>
                    예약 확정을 위해 <strong>상담 후</strong> 아래 계좌로 예약금
                    3만원을 입금해 주세요.
                  </p>
                  <div className="bg-black/30 rounded p-3 mt-2">
                    <p className="font-mono text-yellow-400">
                      국민은행 68040100094569 (예금주: 차재영)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-300">
              <p>
                * 예약은 예약금 입금 후 확정되며, 입금 전에는 자동으로 예약되지
                않습니다.
              </p>
              <p>
                * 카카오톡 아이디를 기재해주셔도{" "}
                <strong>"친구추가 허용"</strong>을 하지 않으신 상태라면 연락을
                드릴 수 없습니다. 기재시 카카오톡 친구추가를 허용해주시면
                감사드리겠습니다 😊
              </p>
              <p>
                * 문의량이 많아 <strong>영업일 기준</strong> 순서대로 응대를
                드리고 있어 시간이 조금 걸릴 수 있는 점 양해부탁드립니다!
              </p>
            </div>
          </div>
        </div>

        {/* Refund Policy */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6 text-center">
            환불 및 변경 정책
          </h3>

          <div className="bg-red-900/20 rounded-lg p-6 border border-red-500/30">
            <div className="space-y-4">
              <div>
                <p>
                  <strong className="text-red-300">일정 변경:</strong> 무료 일정
                  변경은 촬영일 기준 2주 전까지, 우천 및 기상 악화로 인한 일정
                  변경은 촬영일 기준 3일전까지 가능합니다. (촬영까지 남은 기간이
                  14일 이하일 경우 변경시 3만원 요금이 추가 발생합니다.)
                </p>
              </div>

              <div>
                <p>
                  <strong className="text-red-300">촬영 취소:</strong> 촬영일
                  기준 15일 이전까지 가능. 이후 취소되는 일정에 있어서는 예약금
                  환급이 어려운 점 양해부탁드리겠습니다.
                </p>
              </div>
            </div>
          </div>
          <div className="text-gray-300 mt-4 text-center">
            <p className="mb-2">
              카드결제를 희망하시는 경우:{" "}
              <strong
                className="text-white cursor-pointer hover:underline hover:text-yellow-400"
                onClick={() =>
                  window.open(
                    "https://smartstore.naver.com/sunsetcinema/products/11343695879",
                    "_blank"
                  )
                }
              >
                네이버 스마트스토어에서 결제하기
              </strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-6 mb-16">
          <div className="space-y-4">
            <Button
              onClick={scrollToForm}
              size="lg"
              className="bg-white text-black hover:bg-gray-100 transition-colors w-full md:w-auto"
            >
              촬영 예약하기
              <ChevronDown className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-8 w-8 text-white/50" />
      </div>
    </section>
  );
}
