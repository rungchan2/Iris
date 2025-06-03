import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { InquiryDetails } from "@/components/admin/inquiry-details"
import { PhotoGallery } from "@/components/admin/photo-gallery"

export default async function InquiryDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Get inquiry with category
  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .select(`
      *,
      categories (
        id,
        name,
        path,
        representative_image_url
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !inquiry) {
    console.error("Error fetching inquiry:", error)
    notFound()
  }

  // Get photos for selected category if available
  let photos = []
  if (inquiry.selected_category_id) {
    const { data: photoData } = await supabase
      .from("photos")
      .select(`
        *,
        photo_categories!inner (
          category_id
        )
      `)
      .eq("photo_categories.category_id", inquiry.selected_category_id)
      .eq("is_active", true)

    photos = photoData || []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mr-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Inquiry Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <InquiryDetails inquiry={inquiry} />
        </div>
        <div className="lg:col-span-2">
          <PhotoGallery photos={photos} />
        </div>
      </div>
    </div>
  )
}
