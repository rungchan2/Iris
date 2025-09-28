"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import {
  inquiryFormSchema,
  type InquiryFormValues,
} from "@/types/inquiry.types";
import { TimeSlotSelector } from "@/components/booking/time-slot-selector";
import { TossPaymentForm } from "@/components/payment/toss-payment-form";
import { createPaymentRequest } from "@/lib/actions/toss-payments";
import { toast } from "sonner";

interface PersonalInfoFormProps {
  onSubmit: (data: InquiryFormValues) => void;
  // Removed moodKeywords prop
  availableDates: string[];
  onFormChange?: () => void; // Add this prop
  photographerId?: string; // Add photographer ID prop
  photographer?: {
    id: string;
    name: string;
  }; // Add photographer info
}

export function PersonalInfoForm({
  onSubmit,
  // Removed moodKeywords
  availableDates,
  onFormChange,
  photographerId,
  photographer,
}: PersonalInfoFormProps) {
  const [activeSection, setActiveSection] = useState<
    "personal" | "additional" | "final_questions" | "payment"
  >("personal");
  const [dateSlotCounts, setDateSlotCounts] = useState<
    Record<string, { total: number; available: number }>
  >({});
  const supabase = createClient();

  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      name: "",
      instagram_id: "",
      gender: "male",
      phone: "",
      selected_slot_id: "",
      people_count: 1,
      relationship: "",
      // Removed mood keywords
      special_request: "",
      difficulty_note: "",
      conversation_preference: "",
      conversation_topics: "",
      favorite_music: "",
      shooting_meaning: "",
    },
  });


  // Add this after the form initialization
  useEffect(() => {
    const subscription = form.watch(() => {
      onFormChange?.();
    });
    return () => subscription.unsubscribe();
  }, [form, onFormChange]);

  // Phone number formatting
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "phone" && value.phone) {
        // Remove non-digits
        const digitsOnly = value.phone.replace(/\D/g, "");

        // Format based on length
        let formatted = "";
        if (digitsOnly.length <= 3) {
          formatted = digitsOnly;
        } else if (digitsOnly.length <= 7) {
          formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
        } else {
          formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(
            3,
            7
          )}-${digitsOnly.slice(7, 11)}`;
        }

        // Only update if it's different to avoid cursor jumping
        if (formatted !== value.phone) {
          form.setValue("phone", formatted);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Fetch slot counts for available dates
  useEffect(() => {
    const fetchSlotCounts = async () => {
      if (availableDates.length === 0) return;

      let query = supabase
        .from("available_slots")
        .select("date, is_available")
        .in("date", availableDates);

      // Filter by photographer ID if provided
      if (photographerId) {
        query = query.eq("admin_id", photographerId);
      }

      const { data: slots, error } = await query;

      if (error) {
        console.error("Error fetching slot counts:", error);
        return;
      }

      const counts: Record<string, { total: number; available: number }> = {};

      for (const date of availableDates) {
        const dateSlots = slots?.filter((slot) => slot.date === date) || [];
        counts[date] = {
          total: dateSlots.length,
          available: dateSlots.filter((slot) => slot.is_available).length,
        };
      }

      setDateSlotCounts(counts);
    };

    fetchSlotCounts();
  }, [availableDates, supabase, photographerId]);

  // Removed mood keywords filtering - no longer using keywords

  // 시간대 문제를 방지하기 위해 date-fns format 사용
  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availableDates.includes(dateStr);
  };

  // Get date modifiers for calendar styling
  const getDateModifiers = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const slotCount = dateSlotCounts[dateStr];

    if (!slotCount || slotCount.total === 0) {
      return { available: false, partiallyBooked: false, fullyBooked: false };
    }

    if (slotCount.available === 0) {
      return { available: false, partiallyBooked: false, fullyBooked: true };
    } else if (slotCount.available < slotCount.total) {
      return { available: false, partiallyBooked: true, fullyBooked: false };
    } else {
      return { available: true, partiallyBooked: false, fullyBooked: false };
    }
  };

  const handleSubmit = (data: InquiryFormValues) => {
    onSubmit(data);
  };

  const handlePaymentSuccess = (paymentKey: string, orderId: string) => {
    // Add payment info to form data and submit
    const formDataWithPayment = {
      ...form.getValues(),
      paymentKey,
      orderId
    };
    onSubmit(formDataWithPayment);
    toast.success('결제가 완료되었습니다!');
  };

  const nextSection = async () => {
    if (activeSection === "personal") {
      // Validate personal section fields
      const isValid = await form.trigger([
        "name",
        "phone",
        "gender",
        "desired_date",
        "people_count",
      ]);

      if (isValid) {
        setActiveSection("additional");
      }
    } else if (activeSection === "additional") {
      // Additional section is optional, no validation needed
      setActiveSection("final_questions");
    } else if (activeSection === "final_questions") {
      // Final questions section is optional, no validation needed
      setActiveSection("payment");
    }
  };

  const prevSection = () => {
    if (activeSection === "additional") {
      setActiveSection("personal");
    } else if (activeSection === "final_questions") {
      setActiveSection("additional");
    } else if (activeSection === "payment") {
      setActiveSection("final_questions");
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-4 py-8">
      <div className="max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-center mb-2">
            촬영 예약 문의
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            신청자님에 대해 알려주세요!
          </p>

          {/* Progress Indicator */}
          <div className="flex justify-between mb-8">
            <div
              className={cn(
                "flex-1 h-1 rounded-l-full transition-colors mr-1",
                activeSection === "personal" ? "bg-primary" : "bg-primary/30"
              )}
            />
            <div
              className={cn(
                "flex-1 h-1 transition-colors mx-1",
                activeSection === "additional" ? "bg-primary" : "bg-primary/30"
              )}
            />
            <div
              className={cn(
                "flex-1 h-1 transition-colors mx-1",
                activeSection === "final_questions" ? "bg-primary" : "bg-primary/30"
              )}
            />
            <div
              className={cn(
                "flex-1 h-1 rounded-r-full transition-colors ml-1",
                activeSection === "payment" ? "bg-primary" : "bg-primary/30"
              )}
            />
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8"
            >
              {/* Personal Information Section */}
              <motion.div
                initial={{
                  opacity: 0,
                  x: activeSection === "personal" ? 20 : -20,
                }}
                animate={{
                  opacity: activeSection === "personal" ? 1 : 0,
                  x:
                    activeSection === "personal"
                      ? 0
                      : activeSection === "mood"
                      ? -20
                      : -40,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "space-y-4",
                  activeSection !== "personal" && "hidden"
                )}
              >
                <h3 className="text-xl font-semibold">개인 정보</h3>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이름</FormLabel>
                      <FormControl>
                        <Input placeholder="이름" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>전화번호</FormLabel>
                      <FormControl>
                        <Input placeholder="010-1234-5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instagram_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>인스타그램 ID</FormLabel>
                      <FormControl>
                        <Input placeholder="@yourusername" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>성별</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="male" />
                            </FormControl>
                            <FormLabel className="font-normal">남성</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="female" />
                            </FormControl>
                            <FormLabel className="font-normal">여성</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="other" />
                            </FormControl>
                            <FormLabel className="font-normal">기타</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="desired_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>예약 날짜</FormLabel>

                        <Calendar
                          mode="single"
                          className="w-full"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={
                            (date) =>
                              date < new Date() || // Can't select past dates
                              !isDateAvailable(date) // Only show available dates
                          }
                          modifiers={{
                            available: (date) => {
                              const modifiers = getDateModifiers(date);
                              return modifiers.available === true;
                            },
                            partiallyBooked: (date) => {
                              const modifiers = getDateModifiers(date);
                              return modifiers.partiallyBooked === true;
                            },
                            fullyBooked: (date) => {
                              const modifiers = getDateModifiers(date);
                              return modifiers.fullyBooked === true;
                            },
                          }}
                          modifiersStyles={{
                            available: {
                              backgroundColor: "hsl(142, 76%, 36%)",
                              color: "white",
                              fontWeight: "bold",
                            },
                            partiallyBooked: {
                              backgroundColor: "hsl(48, 96%, 53%)",
                              color: "black",
                              fontWeight: "bold",
                            },
                            fullyBooked: {
                              backgroundColor: "hsl(0, 84%, 60%)",
                              color: "white",
                              fontWeight: "bold",
                            },
                          }}
                        />

                        {/* Calendar Legend */}
                        <div className="flex flex-wrap gap-4 mt-3 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-sm bg-green-600"></div>
                            <span>예약 가능</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
                            <span>일부 예약됨</span>
                          </div>
                        </div>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("desired_date") && (
                    <FormField
                      control={form.control}
                      name="selected_slot_id"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>예약 시간</FormLabel>
                          <FormControl>
                            <TimeSlotSelector
                              date={form.watch("desired_date")}
                              selectedSlotId={field.value}
                              onSelect={field.onChange}
                              photographerId={photographerId}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="people_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>인원 (최대 6명)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={6}
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              Number.parseInt(e.target.value) || ""
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>관계 (선택사항)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 커플, 친구, 가족"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={nextSection}
                    className="w-full"
                    disabled={
                      !form.watch("name") ||
                      !form.watch("phone") ||
                      !form.watch("desired_date") ||
                      !form.watch("selected_slot_id") ||
                      !form.watch("people_count")
                    }
                  >
                    다음 <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>

              {/* Mood Keywords Section Removed - No longer using keywords table */}

              {/* Additional Information Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{
                  opacity: activeSection === "additional" ? 1 : 0,
                  x: activeSection === "additional" ? 0 : 20,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "space-y-4",
                  activeSection !== "additional" && "hidden"
                )}
              >
                <h3 className="text-xl font-semibold">추가 정보</h3>

                <FormField
                  control={form.control}
                  name="special_request"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>1. 요청 사항 (선택사항)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="추가적으로 촬영에 담겼으면 하는 점이나 나누고 싶으신 말씀을 적어주세요. 촬영 시 희망하시는 사항, 궁금하신 사항, 좋아하시는 작품 등 뭐든 좋습니다!"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty_note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>2. 촬영 관련 우려사항 (선택사항)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="촬영과 관련해 걱정되거나 신경쓰이는 부분을 적어주세요."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4 items-center">
                  <Button type="button" variant="outline" onClick={prevSection}>
                    뒤로가기
                  </Button>
                  <Button type="button" onClick={nextSection}>
                    다음
                  </Button>
                </div>
              </motion.div>

              {/* Final Questions Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{
                  opacity: activeSection === "final_questions" ? 1 : 0,
                  x: activeSection === "final_questions" ? 0 : 20,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "space-y-4",
                  activeSection !== "final_questions" && "hidden"
                )}
              >
                <h3 className="text-xl font-semibold">촬영 전 마지막 질문</h3>
                <p className="text-sm text-muted-foreground">작가와의 더 나은 소통을 위해 몇 가지만 더 알려주세요!</p>

                <FormField
                  control={form.control}
                  name="conversation_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>처음 보는 사람과 대화는 많이 or 적게?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="많이" id="conversation_much" />
                            <label htmlFor="conversation_much" className="text-sm">많이 (대화를 즐기는 편)</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="적게" id="conversation_little" />
                            <label htmlFor="conversation_little" className="text-sm">적게 (조용한 편)</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="보통" id="conversation_normal" />
                            <label htmlFor="conversation_normal" className="text-sm">보통 (상황에 따라)</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="conversation_topics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>어떤 주제로 대화하는 걸 좋아하세요?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="관심사, 취미, 좋아하는 것들을 자유롭게 적어주세요. (예: 음악, 영화, 여행, 음식 등)"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="favorite_music"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>좋아하시는 음악이 있으신가요?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="장르, 아티스트, 특정 곡 등 자유롭게 적어주세요. (예: 발라드, IU, 카페 분위기 음악 등)"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shooting_meaning"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이번 촬영은 본인에게 어떤 의미인가요?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="기념일, 새로운 시작, 자신감 회복, 추억 남기기 등 어떤 의미든 좋습니다."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4 items-center">
                  <Button type="button" variant="outline" onClick={prevSection}>
                    뒤로가기
                  </Button>
                  <Button type="button" onClick={nextSection}>
                    다음 <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>

              {/* Payment Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{
                  opacity: activeSection === "payment" ? 1 : 0,
                  x: activeSection === "payment" ? 0 : 20,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "space-y-4",
                  activeSection !== "payment" && "hidden"
                )}
              >
                <h3 className="text-xl font-semibold">결제</h3>
                <p className="text-sm text-muted-foreground">
                  예약을 확정하기 위해 결제를 진행해주세요.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold">예약 정보 확인</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>예약자:</span>
                      <span>{form.watch("name")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>연락처:</span>
                      <span>{form.watch("phone")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>예약 날짜:</span>
                      <span>
                        {form.watch("desired_date")
                          ? format(form.watch("desired_date"), "yyyy년 M월 d일")
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>인원:</span>
                      <span>{form.watch("people_count")}명</span>
                    </div>
                  </div>
                </div>

                <TossPaymentForm
                  inquiry={{
                    id: "temp-inquiry", // This will be generated after form submission
                    name: form.watch("name") || "",
                    phone: form.watch("phone") || "",
                    email: undefined
                  }}
                  product={{
                    id: "photography-session",
                    name: `${photographer?.name || "작가"} 사진 촬영 세션`,
                    price: 150000, // 15만원 기본 가격
                    photographer_id: photographerId || ""
                  }}
                  photographer={{
                    id: photographerId || "",
                    name: photographer?.name || "작가"
                  }}
                  onPaymentComplete={handlePaymentSuccess}
                  onPaymentError={(error: string) => {
                    toast.error(`결제 중 오류가 발생했습니다: ${error}`);
                  }}
                />

                <div className="flex justify-between pt-4 items-center">
                  <Button type="button" variant="outline" onClick={prevSection}>
                    뒤로가기
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    위의 결제 위젯에서 결제를 완료해주세요.
                  </div>
                </div>
              </motion.div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
