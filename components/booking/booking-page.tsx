import { createClient } from "@/lib/supabase/server"
import { BookingForm } from "@/components/booking/booking-form"
import { HeroSection } from "@/components/booking/hero-section"
import { NoticeSection } from "@/components/booking/notice-section"
import { FAQWidget } from "@/components/ui/faq-widget"
import type { Category, MoodKeyword } from "@/types/inquiry.types"

export default async function BookingPage() {
  const supabase = await createClient()

  // Fetch root categories (depth = 1)
  const { data: rootCategories } = await supabase
    .from("categories")
    .select("*")
    .eq("depth", 1)
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  // Fetch all categories for the tournament
  const { data: allCategories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  // Fetch mood keywords
  const { data: moodKeywords } = await supabase
    .from("keywords")
    .select("*")
    .order("display_order", { ascending: true })

  // Fetch available dates
  const currentDate = new Date()
  const threeMonthsLater = new Date()
  threeMonthsLater.setMonth(currentDate.getMonth() + 3)

  const { data: availableSlots } = await supabase
    .from("available_slots")
    .select("date")
    .eq("is_available", true)
    .gte("date", currentDate.toISOString().split("T")[0])
    .lte("date", threeMonthsLater.toISOString().split("T")[0])
    .order("date")

  // Extract unique available dates
  const availableDates = availableSlots ? [...new Set(availableSlots.map((slot) => slot.date))] : []

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <NoticeSection />
      <div id="inquiry-form">
        <BookingForm
          rootCategories={(rootCategories as Category[]) || []}
          allCategories={(allCategories as Category[]) || []}
          moodKeywords={(moodKeywords as MoodKeyword[]) || []}
          availableDates={availableDates}
        />
      </div>
      <FAQWidget />
    </div>
  )
}