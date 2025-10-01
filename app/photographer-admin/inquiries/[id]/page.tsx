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

  // Get inquiry (categories removed), only if it belongs to this photographer
  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .select(
      `
      *,
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

  // Keywords and mood keywords removed - no longer used
  const transformedInquiry = {
    ...inquiry,
    // Removed mood keyword transformation
  };

  if (error || !inquiry) {
    console.error("Error fetching inquiry or unauthorized:", error);
    notFound();
  }

  // Category photos removed - no longer using categories
  const photos: any[] = [];

  return (
    <div className="space-y-6">
      <InquiryDetailClient
        inquiry={transformedInquiry as Inquiry}
        photos={photos}
      />
    </div>
  );
}