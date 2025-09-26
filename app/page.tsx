// import { LandingHeroSection } from "@/components/landing/hero-section"
// import { ReviewsSection } from "@/components/landing/reviews-section"
// import { BrandValuesSection } from "@/components/landing/brand-values-section"
// import { PhotographersSection } from "@/components/landing/photographers-section"
// import { FinalCTASection } from "@/components/landing/final-cta-section"
import { PhotographerCarousel } from "@/components/landing/photographer-carousel"
import { FAQWidget } from "@/components/ui/faq-widget"
import { Footer } from "@/components/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* New Minimal Landing Page */}
      <PhotographerCarousel />
      
      {/* Existing sections - commented out for now */}
      {/* <LandingHeroSection /> */}
      {/* <ReviewsSection /> */}
      {/* <BrandValuesSection /> */}
      {/* <FeaturesSection /> */}
      {/* <PhotographersSection /> */}
      {/* <GalleryShowcase /> */}
      {/* <FinalCTASection /> */}
      
      {/* Keep FAQ and Footer */}
      <FAQWidget />
      <Footer />
    </div>
  )
}