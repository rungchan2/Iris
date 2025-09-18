import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Inquiry } from "@/types/inquiry.types";
import { InquiryDetailClient } from "@/components/admin/inquiry-detail-client";

export default async function PhotographerInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Get inquiry with category, only if it belongs to this photographer
  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .select(
      `
      *,
      categories (
        id,
        name,
        path,
        representative_image_url
      ),
      selected_slot_id (
        id,
        date,
        start_time,
        end_time
      )
    `
    )
    .eq("id", (await params).id)
    .eq("photographer_id", user.id) // Much faster direct FK filtering
    .single();

  console.log("photographer inquiry", inquiry);

  const currentMoodkeywordId = inquiry?.current_mood_keywords;
  const desiredMoodkeywordId = inquiry?.desired_mood_keywords;

  const { data: keywords } = await supabase
    .from("keywords")
    .select("id, name")
    .in("id", [
      ...(currentMoodkeywordId || []),
      ...(desiredMoodkeywordId || []),
    ]);

  const transformedInquiry = {
    ...inquiry,
    current_mood_keywords:
      keywords?.filter((keyword) =>
        currentMoodkeywordId?.includes(keyword.id)
      ) || [],
    desired_mood_keywords:
      keywords?.filter((keyword) =>
        desiredMoodkeywordId?.includes(keyword.id)
      ) || [],
  };

  if (error || !inquiry) {
    console.error("Error fetching inquiry or unauthorized:", error);
    notFound();
  }

  // Get photos for selected category if available
  let photos: any[] = [];
  if (inquiry.selected_category_id) {
    const { data: photoData } = await supabase
      .from("photos")
      .select(
        `
      *,
      photo_categories!inner (
        category_id
      )
    `
      )
      .eq("photo_categories.category_id", inquiry.selected_category_id || "")
      .eq("is_active", true);

    photos = photoData || [];
  }

  return (
    <div className="space-y-6">
      <InquiryDetailClient
        inquiry={transformedInquiry as Inquiry}
        photos={photos}
      />
    </div>
  );
}