"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const personalityTypes = [
  {
    code: "A1",
    name: "고요한 관찰자",
    description: "혼자만의 시선과 조용한 분위기를 선호하는 섬세한 감성",
    keywords: ["차분함", "내성적", "관찰"],
    color: "from-gray-400 to-gray-600",
    bgColor: "from-gray-50 to-gray-100"
  },
  {
    code: "A2", 
    name: "따뜻한 동행자",
    description: "따뜻하고 감정적인 관계를 선호하는 다정한 성격",
    keywords: ["따뜻함", "감성적", "동행"],
    color: "from-amber-400 to-orange-600",
    bgColor: "from-amber-50 to-orange-100"
  },
  {
    code: "B1",
    name: "감성 기록자",
    description: "일상의 감성을 포착하고 편안한 분위기를 추구",
    keywords: ["자연스러움", "힐링", "감성"],
    color: "from-emerald-400 to-green-600", 
    bgColor: "from-emerald-50 to-green-100"
  },
  {
    code: "C1",
    name: "시네마틱 몽상가",
    description: "구조적 아름다움과 도시적 감성을 선호하는 미니멀리스트",
    keywords: ["시크함", "미니멀", "도시적"],
    color: "from-blue-400 to-blue-600",
    bgColor: "from-blue-50 to-blue-100"
  },
  {
    code: "D1",
    name: "활력 가득 리더",
    description: "밝고 에너지 넘치는 구도를 선호하는 낙천주의자",
    keywords: ["활력", "밝음", "리더십"],
    color: "from-red-400 to-red-600",
    bgColor: "from-red-50 to-red-100"
  },
  {
    code: "E1",
    name: "도시의 드리머",
    description: "도시적인 빛과 그림자를 사랑하는 꿈꾸는 영혼",
    keywords: ["도시적", "꿈꾸는", "빛과그림자"],
    color: "from-purple-400 to-purple-600",
    bgColor: "from-purple-50 to-purple-100"
  },
  {
    code: "E2",
    name: "무심한 예술가",
    description: "실험적이고 감성적인 접근을 선호하는 아티스트",
    keywords: ["예술적", "실험적", "무심함"],
    color: "from-indigo-400 to-indigo-600",
    bgColor: "from-indigo-50 to-indigo-100"
  },
  {
    code: "F1",
    name: "자유로운 탐험가",
    description: "틀에 얽매이지 않는 역동적 탐색을 즐기는 모험가",
    keywords: ["자유로움", "탐험", "역동적"],
    color: "from-orange-400 to-orange-600",
    bgColor: "from-orange-50 to-orange-100"
  },
  {
    code: "F2",
    name: "감각적 실험가",
    description: "콘셉트 있고 독특한 시도를 선호하는 실험가",
    keywords: ["감각적", "독특함", "콘셉추얼"],
    color: "from-pink-400 to-pink-600",
    bgColor: "from-pink-50 to-pink-100"
  }
];

export function PersonalityTypesSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-orange-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            9가지 독특한 성격유형
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            당신은 어떤 유형인가요? 각 유형마다 고유한 사진 스타일과 
            <br className="hidden md:block" />
            추천 작가들이 기다리고 있습니다.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personalityTypes.map((type, index) => (
            <motion.div
              key={type.code}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group cursor-pointer">
                <div className={`h-2 bg-gradient-to-r ${type.color}`} />
                <CardContent className={`p-6 bg-gradient-to-br ${type.bgColor} group-hover:from-white group-hover:to-gray-50 transition-all duration-300`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${type.color} flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-lg">{type.code}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {type.name}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {type.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {type.keywords.map((keyword, keyIndex) => (
                      <Badge 
                        key={keyIndex} 
                        variant="secondary" 
                        className="bg-white/70 text-gray-700 hover:bg-white transition-colors"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-6">
            궁금한 당신의 성격유형, 지금 바로 알아보세요!
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <a
              href="/quiz"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
            >
              나의 성격유형 진단하기
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}