"use client"

import React from "react"

import { useState } from "react"
import { PersonalInfoForm } from "@/components/inquiry/personal-info-form"
import { CategoryTournament } from "@/components/inquiry/category-tournament"
import { SuccessScreen } from "@/components/inquiry/success-screen"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { InquiryFormValues, Category, MoodKeyword, SelectionHistoryStep, Inquiry } from "@/types/inquiry.types"

interface InquiryFormProps {
  rootCategories: Category[]
  allCategories: Category[]
  moodKeywords: MoodKeyword[]
  availableDates: string[]
}

export function InquiryForm({ rootCategories, allCategories, moodKeywords, availableDates }: InquiryFormProps) {
  const [step, setStep] = useState<"personal-info" | "category-selection" | "success">("personal-info")
  const [formData, setFormData] = useState<InquiryFormValues | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectionPath, setSelectionPath] = useState<string[]>([])
  const [selectionHistory, setSelectionHistory] = useState<SelectionHistoryStep[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [newInquiry, setNewInquiry] = useState<Inquiry | null>(null)

  const supabase = createClient()

  const handlePersonalInfoSubmit = (data: InquiryFormValues) => {
    setFormData(data)
    setStep("category-selection")
    setIsDirty(false) // Reset dirty state when moving to next step

    // Scroll to top for category selection
    // window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCategoryComplete = (category: Category, path: string[], history: SelectionHistoryStep[]) => {
    setSelectedCategory(category)
    setSelectionPath(path)
    setSelectionHistory(history)
    handleSubmitInquiry(category, path, history)
  }

  const handleSubmitInquiry = async (category: Category, path: string[], history: SelectionHistoryStep[]) => {
    if (!formData) return

    setIsSubmitting(true)

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
        .single()
      setNewInquiry(newInquiry as any)
      if (error) throw error

      // If a slot was selected, mark it as booked
      if (formData.selected_slot_id) {
        const { error: slotError } = await supabase
          .from("available_slots")
          .update({ is_available: false })
          .eq("id", formData.selected_slot_id)

        if (slotError) {
          console.error("Error booking slot:", slotError)
          toast.error("슬롯 예약 중 오류가 발생했지만 문의는 정상적으로 접수되었습니다.")
        }
      }

      setStep("success")
      setIsDirty(false) // Reset dirty state after successful submission
      toast.success("문의가 성공적으로 접수되었습니다!")
    } catch (error) {
      console.error("Error submitting inquiry:", error)
      toast.error("문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.")
      setNewInquiry(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartOver = () => {
    setStep("personal-info")
    setFormData(null)
    setSelectedCategory(null)
    setSelectionPath([])
    setSelectionHistory([])
    setIsDirty(false)
    setNewInquiry(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleFormChange = () => {
    setIsDirty(true)
  }

  // Navigation warning for unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting) {
        const message = "작성중인 내용이 사라질 수 있습니다. 페이지를 떠나시겠습니까?"
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isDirty, isSubmitting])

  return (
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
          <SuccessScreen formData={newInquiry as Inquiry} category={selectedCategory} onStartOver={handleStartOver} />
        </div>
      )}
    </div>
  )
}
