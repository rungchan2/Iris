"use client";

import Marquee from "react-fast-marquee";

export function BottomMarquee() {
  const marqueeTexts = [
    "오랜만에 혼자 떠나는 여행이에요.",
    "지금의 나를 꼭 남기고 싶었어요.",
    "퇴사를 앞두고, 새로운 시작을 앞두고 있어서",
    "나만의 의식을 만들고 싶었어요.",
    "연애 중인데, 일상의 소소한 순간을",
    "우리 둘만의 방식으로 기록하고 싶었어요."
  ];

  return (
    <div className="w-full py-4 bg-gradient-to-r from-orange-50 to-orange-100 overflow-hidden">
      <Marquee
        gradient={false}
        speed={30}
        className="flex items-center"
      >
        {marqueeTexts.map((text, index) => (
          <span
            key={index}
            className="text-xl md:text-2xl font-medium text-orange-600/70 mx-8 whitespace-nowrap"
          >
            {text}
          </span>
        ))}
      </Marquee>
    </div>
  );
}