"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export function HeroSection() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToForm = (id: string) => {
    const formElement = document.getElementById(id);
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Navigation Links */}
      <div className="absolute top-8 right-8 z-20 flex flex-col items-end space-y-2">
        <a
          href="/gallery"
          className="text-white text-sm hover:underline hover:underline-offset-4 transition-all duration-200"
        >
          Gallery
        </a>
        <a
          href="https://www.instagram.com/sunset_cinematic/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white text-sm hover:underline hover:underline-offset-4 transition-all duration-200"
        >
          Instagram
        </a>
      </div>

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/10 z-10" />
        <Image
          src="/og-image.jpg"
          alt="Sunset Cinema"
          className="w-full h-full object-cover hidden md:block"
          width={1920}
          height={1080}
        />
        <Image
          src="/hero-mobile-image.jpg"
          alt="Sunset Cinema"
          className="w-full h-full object-cover object-top block md:hidden"
          width={1920}
          height={1920}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6"
        >
          <Image
            src="/font2.svg"
            alt="Sunset Cinema"
            width={450}
            height={110}
          />
        </motion.div>
        <motion.div
          style={{ fontWeight: "bold", fontSize: "1.5rem" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xl text-white/90 mb-8 flex justify-center"
        >
          <Image
            src="/side-font.svg"
            alt="Sunset Cinema"
            width={350}
            height={110}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Button
            size="lg"
            onClick={() => scrollToForm("notice-section")}
            className="bg-white text-black hover:bg-white/90"
          >
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scrollToForm("notice-section")}
          className="text-white animate-bounce"
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
}
