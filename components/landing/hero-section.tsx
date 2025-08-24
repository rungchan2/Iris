"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Camera, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Marquee from "react-fast-marquee";

export function LandingHeroSection() {
  const [isScrolled, setIsScrolled] = useState(false);

  const marqueeTexts = [
    "오랜만에 혼자 떠나는 여행이에요.",
    "지금의 나를 꼭 남기고 싶었어요.",
    "퇴사를 앞두고, 새로운 시작을 앞두고 있어서",
    "나만의 의식을 만들고 싶었어요.",
    "연애 중인데, 일상의 소소한 순간을",
    "우리 둘만의 방식으로 기록하고 싶었어요."
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToFeatures = () => {
    const featuresElement = document.getElementById("features-section");
    if (featuresElement) {
      featuresElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100">

      {/* Iris Logo */}
      <div className="absolute top-8 left-8 z-20">
        <span className="text-2xl font-bold text-orange-600">Iris</span>
      </div>

      {/* Navigation Links */}
      <div className="absolute top-8 right-8 z-20 flex flex-col md:flex-row items-end md:items-center space-y-2 md:space-y-0 md:space-x-6">
        {/* <Link
          href="/gallery"
          className="text-gray-700 text-sm hover:text-orange-600 hover:underline hover:underline-offset-4 transition-all duration-200"
        >
          Gallery
        </Link> */}
        <Link
          href="/photographers"
          className="text-gray-700 text-sm hover:text-orange-600 hover:underline hover:underline-offset-4 transition-all duration-200"
        >
          작가 목록
        </Link>
        
        <a
          href="https://www.instagram.com/sunset_cinematic/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-700 text-sm hover:text-orange-600 hover:underline hover:underline-offset-4 transition-all duration-200"
        >
          Instagram
        </a>
      </div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex-1 flex items-center justify-center">
        <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
          맞춤형 촬영 예약 플랫폼
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-20">
            촬영 전부터 확신이 드는,
            <br />
            <span className="text-orange-600">나만의 사진 작가를 추천합니다</span>
          </h1>
        </motion.div>

        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
        >
          All-In-One
          <br className="hidden md:block" />
          나에게 가장 잘 어울리는 작가를 추천합니다
        </motion.div> */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/quiz">
            <Button
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
            >
              <Camera className="mr-2 h-5 w-5" />
              성향 진단 시작하기
            </Button>
          </Link>
          <Link href="/style-match">
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg font-semibold rounded-lg border-2 border-orange-200 text-orange-600 hover:bg-orange-50 transition-all duration-200"
            >
              바로 예약하기
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-wrap justify-center gap-6 md:gap-12 mt-16 text-sm text-gray-500"
        >
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">All-In-One</div>
            <div>예약부터 촬영까지</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">Friendly</div>
            <div>걱정없이 손쉽게</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">1:1</div>
            <div>맞춤 작가 매칭</div>
          </div>
          
        </motion.div>
        </div>
      </div>

      {/* Bottom Marquee */}
      <div className="relative z-10 w-full py-3 bg-gradient-to-r backdrop-blur-sm">
        <Marquee
          gradient={false}
          speed={30}
          className="flex items-center"
        >
          {marqueeTexts.map((text, index) => (
            <span
              key={index}
              className="text-2xl md:text-3xl font-medium text-orange-600/60 mx-8 whitespace-nowrap"
            >
              {text}
            </span>
          ))}
        </Marquee>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isScrolled ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollToFeatures}
          className="text-gray-400 hover:text-orange-600 animate-bounce"
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
}