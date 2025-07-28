"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Camera, ArrowRight, Sparkles, Clock } from "lucide-react";

export function FinalCTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            지금 시작하면 특별한 혜택!
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-6">
            지금 바로 나의 사진 성향
            <br />
            알아보기
          </h2>
          
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            21개의 간단한 질문으로 시작하는 특별한 여정.
            <br className="hidden md:block" />
            당신만의 완벽한 사진 스타일과 작가를 찾아보세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/quiz">
                <Button
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  성향 진단 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/booking">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200"
                >
                  바로 예약하기
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Features highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 text-white/90">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">5분이면 완료</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white/90">
              <Sparkles className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">AI 미리보기 제공</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white/90">
              <Camera className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">전문 작가 매칭</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}