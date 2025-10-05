import { PhotographerCarousel } from "@/components/landing/photographer-carousel"
import { FAQWidget } from "@/components/ui/faq-widget"
import { Footer } from "@/components/footer"
import { getFeaturedPhotographers } from "@/lib/actions/photographers"

export default async function LandingPage() {
  // Fetch featured photographers from database
  const result = await getFeaturedPhotographers(3)
  const featuredPhotographers = result.success ? result.data : []

  return (
    <div className="min-h-screen bg-white">
      {/* New Minimal Landing Page */}
      <PhotographerCarousel photographers={featuredPhotographers} />

      {/* Keep FAQ and Footer */}
      <FAQWidget />
      <Footer />
    </div>
  )
}