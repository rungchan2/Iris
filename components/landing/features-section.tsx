"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, Users, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "성향 진단 시스템",
    description: "21가지 질문으로 당신만의 사진 성향을 정확하게 분석합니다.",
    gradient: "from-blue-500 to-purple-600"
  },
  {
    icon: Sparkles,
    title: "AI 이미지 미리보기",
    description: "AI가 생성하는 당신의 사진 스타일 미리보기로 결과를 먼저 확인하세요.",
    gradient: "from-purple-500 to-pink-600"
  },
  {
    icon: Users,
    title: "맞춤형 작가 매칭",
    description: "성향 분석 결과를 바탕으로 가장 잘 맞는 전문 작가를 추천해드립니다.",
    gradient: "from-orange-500 to-red-600"
  },
  {
    icon: Calendar,
    title: "간편한 예약 시스템",
    description: "마음에 드는 작가를 찾았다면 바로 예약까지 한 번에 완료하세요.",
    gradient: "from-green-500 to-teal-600"
  }
];

export function FeaturesSection() {
  return (
    <section id="features-section" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            당신만을 위한 특별한 경험
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            더 이상 어떤 사진을 찍을지 고민하지 마세요. 
            <br className="hidden md:block" />
            AI와 데이터가 당신에게 딱 맞는 스타일을 찾아드립니다.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Process Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            간단한 4단계로 완성되는 여정
          </h3>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {[
              { step: "01", title: "성향 진단", description: "21개 질문에 답하기" },
              { step: "02", title: "AI 미리보기", description: "나만의 스타일 확인" },
              { step: "03", title: "작가 매칭", description: "완벽한 작가 추천" },
              { step: "04", title: "예약 완료", description: "바로 예약하고 촬영" }
            ].map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row items-center">
                <div className="text-center mb-4 md:mb-0">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                
                {index < 3 && (
                  <div className="hidden md:block mx-6">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-orange-300 to-orange-400"></div>
                  </div>
                )}
                
                {index < 3 && (
                  <div className="md:hidden my-4">
                    <div className="w-0.5 h-8 mx-auto bg-gradient-to-b from-orange-300 to-orange-400"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}