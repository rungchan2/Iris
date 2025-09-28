import { createClient } from "@/lib/supabase/server"
import { BookingForm } from "@/components/booking/booking-form"
import { HeroSection } from "@/components/booking/hero-section"
import { NoticeSection } from "@/components/booking/notice-section"
import { FAQWidget } from "@/components/ui/faq-widget"
// Category import removed - no longer using categories

export default async function BookingPage() {
  const supabase = await createClient()

  // Category fetching removed - no longer using tournament

  // Removed mood keywords fetching - no longer using keywords table

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
          // Category props removed
          availableDates={availableDates}
        />
      </div>
      <FAQWidget />
    </div>
  )
}