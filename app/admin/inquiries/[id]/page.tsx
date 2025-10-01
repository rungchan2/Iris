import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Inquiry } from "@/types/inquiry.types";
import { InquiryDetailClient } from "@/components/admin/inquiry-detail-client";

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  // Get inquiry (categories removed)
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
    .single();

  console.log("server inquiry", inquiry);

  // Keywords and mood keywords removed - no longer used
  const transformedInquiry = {
    ...inquiry,
    // Removed mood keyword transformation
  };

  if (error || !inquiry) {
    console.error("Error fetching inquiry:", error);
    notFound();
  }

  // Category photos removed - no longer using categories
  const photos: any[] = [];

  return (
    <InquiryDetailClient
      inquiry={transformedInquiry as Inquiry}
      photos={photos}
    />
  );
}
