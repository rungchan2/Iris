"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const showcaseImages = [
  {
    src: "/og-image.jpg",
    alt: "시네마틱 프로필 예시 1",
    personality: "C1 - 시네마틱 몽상가"
  },
  {
    src: "/hero-mobile-image.jpg", 
    alt: "시네마틱 프로필 예시 2",
    personality: "E1 - 도시의 드리머"
  },
  {
    src: "/sunset.JPG",
    alt: "시네마틱 프로필 예시 3", 
    personality: "A2 - 따뜻한 동행자"
  }
];

export function GalleryShowcase() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            실제 촬영 결과물들
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            다양한 성격유형별로 촬영된 실제 사진들을 확인해보세요.
            <br className="hidden md:block" />
            당신만의 스타일도 이처럼 아름답게 담아낼 수 있습니다.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {showcaseImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                  <p className="text-white font-medium text-sm">
                    {image.personality}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/gallery">
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg font-semibold rounded-lg border-2 border-orange-200 text-orange-600 hover:bg-orange-50 transition-all duration-200"
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              전체 갤러리 보기
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}