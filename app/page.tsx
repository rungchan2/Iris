import { LandingHeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { PhotographersSection } from "@/components/landing/personality-types-section"
import { GalleryShowcase } from "@/components/landing/gallery-showcase"
import { FinalCTASection } from "@/components/landing/final-cta-section"
import { FAQWidget } from "@/components/ui/faq-widget"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeroSection />
      <FeaturesSection />
      <PhotographersSection />
      <GalleryShowcase />
      <FinalCTASection />
      <FAQWidget />
    </div>
  )
}