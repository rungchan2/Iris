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
import { sendEmail } from "@/lib/send-email";
import { getSlot } from "@/lib/available-slots";

const EMAIL_TO = [
  "chajimmy1214@gmail.com",
  "mingoyoung809@gmail.com"
]

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

          const { data: getSlotData, error: slotError } = await getSlot(formData.selected_slot_id || "");


            
          if (error || slotError) {
            insertError = error;
            console.log(`Insert attempt ${retryCount + 1} failed:`, error);

            if (error && error.code === "42501") {
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

          const emailBody = `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>새로운 촬영 문의</title>
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f8f9fa;
                }
                .container {
                  background-color: white;
                  border-radius: 12px;
                  padding: 30px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                  text-align: center;
                  border-bottom: 3px solid #e74c3c;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
                }
                .header h1 {
                  color: #2c3e50;
                  margin: 0;
                  font-size: 28px;
                  font-weight: 600;
                }
                .header p {
                  color: #7f8c8d;
                  margin: 5px 0 0 0;
                  font-size: 16px;
                }
                .section {
                  margin-bottom: 25px;
                  padding: 20px;
                  background-color: #f8f9fa;
                  border-radius: 8px;
                  border-left: 4px solid #3498db;
                }
                .section h2 {
                  color: #2c3e50;
                  margin: 0 0 15px 0;
                  font-size: 20px;
                  font-weight: 600;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  margin-bottom: 15px;
                }
                .info-item {
                  background-color: white;
                  padding: 12px;
                  border-radius: 6px;
                  border: 1px solid #e9ecef;
                }
                .info-label {
                  font-weight: 600;
                  color: #495057;
                  font-size: 14px;
                  margin-bottom: 4px;
                }
                .info-value {
                  color: #2c3e50;
                  font-size: 16px;
                }
                .full-width {
                  grid-column: 1 / -1;
                }
                .mood-keywords {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 8px;
                  margin-top: 8px;
                }
                .keyword-tag {
                  background-color: #e3f2fd;
                  color: #1976d2;
                  padding: 6px 12px;
                  border-radius: 20px;
                  font-size: 14px;
                  font-weight: 500;
                }
                .category-path {
                  background-color: #fff3cd;
                  border: 1px solid #ffeaa7;
                  padding: 12px;
                  border-radius: 6px;
                  font-weight: 500;
                  color: #856404;
                }
                .category-path .arrow {
                  color: #6c757d;
                  margin: 0 8px;
                }
                .status-badge {
                  display: inline-block;
                  background-color: #d4edda;
                  color: #155724;
                  padding: 8px 16px;
                  border-radius: 20px;
                  font-weight: 600;
                  font-size: 14px;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #dee2e6;
                  color: #6c757d;
                  font-size: 14px;
                }
                @media (max-width: 480px) {
                  .info-grid {
                    grid-template-columns: 1fr;
                  }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📸 새로운 촬영 문의</h1>
                  <p>새로운 문의가 접수되었습니다</p>
                </div>

                <div class="section">
                  <h2>👤 기본 정보</h2>
                  <div class="info-grid">
                    <div class="info-item">
                      <div class="info-label">이름</div>
                      <div class="info-value">${formData.name}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">전화번호</div>
                      <div class="info-value">${formData.phone}</div>
                    </div>
                    ${formData.instagram_id ? `
                    <div class="info-item">
                      <div class="info-label">인스타그램</div>
                      <div class="info-value">@${formData.instagram_id}</div>
                    </div>` : ''}
                    <div class="info-item">
                      <div class="info-label">성별</div>
                      <div class="info-value">${formData.gender === 'male' ? '남성' : formData.gender === 'female' ? '여성' : '기타'}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">인원수</div>
                      <div class="info-value">${formData.people_count}명</div>
                    </div>
                    ${formData.relationship ? `
                    <div class="info-item">
                      <div class="info-label">관계</div>
                      <div class="info-value">${formData.relationship}</div>
                    </div>` : ''}
                  </div>
                </div>

                <div class="section">
                  <h2>📅 예약 정보</h2>
                  <div class="info-grid">
                    <div class="info-item">
                      <div class="info-label">희망 날짜</div>
                      <div class="info-value">${formData.desired_date.toLocaleDateString('ko-KR')}</div>
                    </div>
                    ${formData.selected_slot_id ? `
                    <div class="info-item">
                      <div class="info-label">선택한 시간대</div>
                      <div class="info-value">${getSlotData?.start_time} - ${getSlotData?.end_time}</div>
                    </div>` : ''}
                  </div>
                </div>

                <div class="section">
                  <h2>🎨 선택한 카테고리</h2>
                  <div class="category-path">
                    ${path.map(item => item).join(' <span class="arrow">▶</span> ')}
                  </div>
                </div>

                ${formData.special_request || formData.difficulty_note ? `
                <div class="section">
                  <h2>📝 추가 정보</h2>
                  ${formData.special_request ? `
                  <div class="info-item full-width">
                    <div class="info-label">특별 요청사항</div>
                    <div class="info-value">${formData.special_request}</div>
                  </div>` : ''}
                  ${formData.difficulty_note ? `
                  <div class="info-item full-width" style="margin-top: 15px;">
                    <div class="info-label">촬영 시 어려운 점</div>
                    <div class="info-value">${formData.difficulty_note}</div>
                  </div>` : ''}
                </div>` : ''}

                <div class="section">
                  <h2>📊 문의 상태</h2>
                  <div class="info-item">
                    <div class="info-label">상태</div>
                    <div class="info-value">
                      <span class="status-badge">신규 문의</span>
                    </div>
                  </div>
                </div>

                <div class="footer">
                  <p>이 문의는 ${new Date().toLocaleString('ko-KR')}에 접수되었습니다.</p>
                  <p>빠른 시일 내에 연락드리겠습니다. 감사합니다! 🎉</p>
                </div>
              </div>
            </body>
            </html>
          `;

          sendEmail(EMAIL_TO, "[sunset-cinema] 새로운 문의가 접수되었습니다.", emailBody);

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

      // Note: 슬롯 예약은 데이터베이스 트리거에서 자동으로 처리됩니다

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

        setTimeout(() => {
          window.location.reload();
        }, 3000);
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
