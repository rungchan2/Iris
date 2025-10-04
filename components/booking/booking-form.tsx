"use client";

import React from "react";

import { useState } from "react";
import { PersonalInfoForm } from "@/components/booking/personal-info-form";
// CategoryTournament removed - no longer using tournament selection
import { SuccessScreen } from "@/components/booking/success-screen";
import { Toaster, toast } from "sonner";
import type {
  InquiryFormValues,
  Inquiry,
} from "@/types/inquiry.types";
import { useBookingSubmit } from "@/lib/hooks/use-bookings";

interface BookingFormProps {
  // Categories removed - no longer using tournament
  availableDates: string[];
}

export function BookingForm({
  // Categories removed
  availableDates,
}: BookingFormProps) {
  const [step, setStep] = useState<
    "personal-info" | "success"
  >("personal-info");
  const [formData, setFormData] = useState<InquiryFormValues | null>(null);
  // Category tournament state removed - no longer used
  const [isDirty, setIsDirty] = useState(false);
  const [newInquiry, setNewInquiry] = useState<Inquiry | null>(null);

  // Use booking submission hook
  const bookingSubmit = useBookingSubmit();

  const handlePersonalInfoSubmit = async (data: InquiryFormValues) => {
    setFormData(data);
    setIsDirty(false); // Reset dirty state when moving to next step
    // Submit directly without category selection
    await handleSubmitInquiry(data);
  };

  // handleCategoryComplete removed - no longer using category tournament

  const handleSubmitInquiry = async (data: InquiryFormValues) => {
    if (!data) return;

    try {
      // Use server action for booking creation
      const result = await bookingSubmit.mutateAsync(data);

      if (result.success && result.inquiry) {
        setNewInquiry(result.inquiry as Inquiry);
        setStep("success");
        setIsDirty(false);
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error: any) {
      console.error("Error submitting inquiry:", error);

      // Check for RLS or permission errors
      if (
        error?.code === "42501" ||
        error?.message?.includes("row-level security")
      ) {
        console.error("RLS Policy violation detected");
        toast.error(
          "알 수 없는 오류가 발생하였습니다. 페이지를 새로고침합니다."
        );

        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }

      setNewInquiry(null);
    }
  };

  const handleStartOver = () => {
    setStep("personal-info");
    setFormData(null);
    setIsDirty(false);
    setNewInquiry(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormChange = () => {
    setIsDirty(true);
  };


  // Navigation warning for unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !bookingSubmit.isPending) {
        const message =
          "작성중인 내용이 사라질 수 있습니다. 페이지를 떠나시겠습니까?";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, bookingSubmit.isPending]);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="container mx-auto py-16 px-4">
        {step === "personal-info" && (
          <div className="min-h-[100dvh] flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <PersonalInfoForm
                onSubmit={handlePersonalInfoSubmit}
                onFormChange={handleFormChange}
                // moodKeywords prop removed
                availableDates={availableDates}
              />
            </div>
          </div>
        )}

        {/* Category selection step removed - no longer using tournament */}

        {step === "success" && newInquiry && (
          <div className="min-h-[100dvh] flex items-center justify-center">
            <SuccessScreen
              formData={newInquiry as Inquiry}
              category={undefined}
              onStartOver={handleStartOver}
            />
          </div>
        )}
      </div>
    </>
  );
}
