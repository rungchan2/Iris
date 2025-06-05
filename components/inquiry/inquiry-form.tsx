"use client"

import { useState } from "react"
import { PersonalInfoForm } from "@/components/inquiry/personal-info-form"
import { CategoryTournament } from "@/components/inquiry/category-tournament"
import { SuccessScreen } from "@/components/inquiry/success-screen"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { InquiryFormValues, Category, MoodKeyword, SelectionHistoryStep } from "@/types/inquiry.types"

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

  const supabase = createClient()

  const handlePersonalInfoSubmit = (data: InquiryFormValues) => {
    setFormData(data)
    setStep("category-selection")

    // Scroll to top for category selection
    window.scrollTo({ top: 0, behavior: "smooth" })
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
      const { error } = await supabase.from("inquiries").insert({
        name: formData.name,
        instagram_id: formData.instagram_id || null,
        gender: formData.gender,
        phone: formData.phone,
        desired_date: formData.desired_date.toISOString().split("T")[0],
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
      })

      if (error) throw error

      setStep("success")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      console.error("Error submitting inquiry:", error)
      toast.error("Failed to submit inquiry. Please try again.")
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
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div id="inquiry-form" className="container mx-auto py-16 px-4">
      {step === "personal-info" && (
        <PersonalInfoForm
          onSubmit={handlePersonalInfoSubmit}
          moodKeywords={moodKeywords}
          availableDates={availableDates}
        />
      )}

      {step === "category-selection" && (
        <CategoryTournament
          rootCategories={rootCategories}
          allCategories={allCategories}
          onComplete={handleCategoryComplete}
          isSubmitting={isSubmitting}
        />
      )}

      {step === "success" && formData && selectedCategory && (
        <SuccessScreen formData={formData} category={selectedCategory} onStartOver={handleStartOver} />
      )}
    </div>
  )
}
