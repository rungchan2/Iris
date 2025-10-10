import { PhotographerCarousel } from "@/components/landing/photographer-carousel"
import { FAQWidget } from "@/components/ui/faq-widget"
import { Footer } from "@/components/footer"
import { HomeHeader } from "@/components/home-header"
import { getFeaturedPhotographers } from "@/lib/actions/photographers"
import { getUserCookie } from "@/lib/auth/cookie"

export default async function LandingPage() {
  // Fetch featured photographers from database
  const result = await getFeaturedPhotographers(3)
  const featuredPhotographers = result.success ? result.data : []

  // Get current user for header
  const user = await getUserCookie()

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <HomeHeader serverUser={user} />

      {/* New Minimal Landing Page */}
      <PhotographerCarousel photographers={featuredPhotographers} />

      {/* Keep FAQ and Footer */}
      {/* <FAQWidget /> */}
      <Footer />
    </div>
  )
}