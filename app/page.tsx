import { LandingHeroSection } from "@/components/landing/hero-section"
import { ReviewsSection } from "@/components/landing/reviews-section"
import { BrandValuesSection } from "@/components/landing/brand-values-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { PhotographersSection } from "@/components/landing/photographers-section"
import { GalleryShowcase } from "@/components/landing/gallery-showcase"
import { FinalCTASection } from "@/components/landing/final-cta-section"
import { FAQWidget } from "@/components/ui/faq-widget"
import { Footer } from "@/components/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeroSection />
      <ReviewsSection />
      <BrandValuesSection />
      {/* <FeaturesSection /> */}
      <PhotographersSection />
      {/* <GalleryShowcase /> */}
      <FinalCTASection />
      <FAQWidget />
      <Footer />
    </div>
  )
}