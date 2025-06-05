"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export function HeroSection() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToForm = (id: string) => {
    const formElement = document.getElementById(id)
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 z-10" />
        <Image
          src="/sunset.jpg"
          alt="Photography Studio"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold text-white mb-6"
        >
          Sunset Cinema
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xl text-white/90 mb-8"
        >
          일상을 영화처럼
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Button size="lg" onClick={() => scrollToForm("notice-section")} className="bg-white text-black hover:bg-white/90">
            예약하기
          </Button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isScrolled ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <Button variant="ghost" size="icon" onClick={() => scrollToForm("notice-section")} className="text-white animate-bounce">
          <ChevronDown className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  )
}
