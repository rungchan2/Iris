"use client";

import React from "react";

import { useState } from "react";
import { PersonalInfoForm } from "@/components/inquiry/personal-info-form";
import { CategoryTournament } from "@/components/inquiry/category-tournament";
import { SuccessScreen } from "@/components/inquiry/success-screen";
import { createClient } from "@/lib/supabase/client";
import { Toaster, toast } from "sonner";
import type {
  InquiryFormValues,
  Category,
  MoodKeyword,
  SelectionHistoryStep,
  Inquiry,
} from "@/types/inquiry.types";

interface InquiryFormProps {
  rootCategories: Category[];
  allCategories: Category[];
  moodKeywords: MoodKeyword[];
  availableDates: string[];
}

export function InquiryForm({
  rootCategories,
  allCategories,
  moodKeywords,
  availableDates,
}: InquiryFormProps) {
  const [step, setStep] = useState<
    "personal-info" | "category-selection" | "success"
  >("personal-info");
  const [formData, setFormData] = useState<InquiryFormValues | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectionPath, setSelectionPath] = useState<string[]>([]);
  const [selectionHistory, setSelectionHistory] = useState<
    SelectionHistoryStep[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [newInquiry, setNewInquiry] = useState<Inquiry | null>(null);

  const supabase = createClient();

  const handlePersonalInfoSubmit = (data: InquiryFormValues) => {
    setFormData(data);
    setStep("category-selection");
    setIsDirty(false); // Reset dirty state when moving to next step

    // Scroll to top for category selection
    // window.scrollTo({ top: 0, behavior: "smooth" })
  };

  const handleCategoryComplete = (
    category: Category,
    path: string[],
    history: SelectionHistoryStep[]
  ) => {
    setSelectedCategory(category);
    setSelectionPath(path);
    setSelectionHistory(history);
    handleSubmitInquiry(category, path, history);
  };

  const handleSubmitInquiry = async (
    category: Category,
    path: string[],
    history: SelectionHistoryStep[]
  ) => {
    if (!formData) return;

    setIsSubmitting(true);

    try {
      // 데이터 삽입 - 재시도 로직 포함
      let retryCount = 0;
      let insertResult = null;
      let insertError = null;

      while (retryCount < 3) {
        try {
          const { data: newInquiry, error } = await supabase
            .from("inquiries")
            .insert({
              name: formData.name,
              instagram_id: formData.instagram_id || null,
              gender: formData.gender,
              phone: formData.phone,
              desired_date: formData.desired_date.toISOString().split("T")[0],
              selected_slot_id: formData.selected_slot_id || null,
              people_count: formData.people_count,
              relationship: formData.relationship || null,
              current_mood_keywords: formData.current_mood_keywords,
              desired_mood_keywords: formData.desired_mood_keywords,
              special_request: formData.special_request || null,
              difficulty_note: formData.difficulty_note || null,
              selected_category_id: category.id,
              selection_path: path,
              selection_history: {
                steps: history,
                completed_at: new Date().toISOString(),
              },
              status: "new",
            } as any)
            .select()
            .single();

          if (error) {
            insertError = error;
            console.log(`Insert attempt ${retryCount + 1} failed:`, error);

            if (error.code === "42501") {
              // RLS 오류의 경우 잠시 대기 후 재시도
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * (retryCount + 1))
              );
              retryCount++;
              continue;
            } else {
              throw error;
            }
          }

          // 추가 데이터 조회하여 완전한 Inquiry 객체 구성
          let slotData = null;
          if (formData.selected_slot_id) {
            const { data: slot } = await supabase
              .from("available_slots")
              .select("id, date, start_time, end_time")
              .eq("id", formData.selected_slot_id)
              .single();
            slotData = slot;
          }

          insertResult = {
            ...newInquiry,
            selected_slot_id: slotData,
            current_mood_keywords: [],
            desired_mood_keywords: [],
            selection_history: {
              steps: history,
              completed_at: new Date().toISOString(),
            } as any,
          } as Inquiry;
          break;
        } catch (error) {
          insertError = error;
          retryCount++;
          if (retryCount >= 3) break;
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          );
        }
      }

      if (insertError && !insertResult) {
        throw insertError;
      }

      setNewInquiry(insertResult);

      // If a slot was selected, mark it as booked
      if (formData.selected_slot_id) {
        const { error: slotError } = await supabase
          .from("available_slots")
          .update({ is_available: false })
          .eq("id", formData.selected_slot_id);

        if (slotError) {
          console.error("Error booking slot:", slotError);
          toast.error(
            "슬롯 예약 중 오류가 발생했지만 문의는 정상적으로 접수되었습니다."
          );
        }
      }

      setStep("success");
      setIsDirty(false); // Reset dirty state after successful submission
      toast.success("문의가 성공적으로 접수되었습니다!");
    } catch (error: any) {
      console.error("Error submitting inquiry:", error);
      console.dir(error, { depth: null });

      // RLS 오류 또는 권한 관련 오류 체크
      if (
        error?.code === "42501" ||
        error?.message?.includes("row-level security")
      ) {
        console.error("RLS Policy violation detected on mobile browser");
        toast.error(
          "알 수 없는 오류가 발생하였습니다. 페이지를 새로고침합니다."
        );

        // 3초 후 강제 리프레시
        // setTimeout(() => {
        //   window.location.reload();
        // }, 3000);
      } else {
        toast.error("문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.");
      }

      setNewInquiry(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    setStep("personal-info");
    setFormData(null);
    setSelectedCategory(null);
    setSelectionPath([]);
    setSelectionHistory([]);
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
      if (isDirty && !isSubmitting) {
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
  }, [isDirty, isSubmitting]);

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
                moodKeywords={moodKeywords}
                availableDates={availableDates}
              />
            </div>
          </div>
        )}

        {step === "category-selection" && (
          <div className="min-h-[100dvh] flex flex-col">
            <CategoryTournament
              rootCategories={rootCategories}
              allCategories={allCategories}
              onComplete={handleCategoryComplete}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {step === "success" && formData && selectedCategory && (
          <div className="min-h-[100dvh] flex items-center justify-center">
            <SuccessScreen
              formData={newInquiry as Inquiry}
              category={selectedCategory}
              onStartOver={handleStartOver}
            />
          </div>
        )}
      </div>
    </>
  );
}
