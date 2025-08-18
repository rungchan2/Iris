import { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingConfirmation } from "@/components/booking/booking-confirmation";
import { getInquiryById } from "@/lib/actions/code";

interface BookingConfirmationPageProps {
  params: Promise<{
    inquiryId: string;
  }>;
}

export async function generateMetadata({ params }: BookingConfirmationPageProps): Promise<Metadata> {
  const { inquiryId } = await params;
  return {
    title: `예약 확인 #${inquiryId} - Iris`,
    description: "예약 상세 정보를 확인하고 촬영 준비 사항을 안내받으세요.",
  };
}

export default async function BookingConfirmationPage({ params }: BookingConfirmationPageProps) {
  const { inquiryId } = await params;
  const inquiryResult = await getInquiryById(inquiryId);
  
  if (!inquiryResult.success || !inquiryResult.inquiry) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <BookingConfirmation inquiry={inquiryResult.inquiry} />
      </div>
    </div>
  );
}