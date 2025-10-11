"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { useSlotCounts } from "@/lib/hooks/use-slots";

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
import { useProducts } from "@/lib/hooks/use-products";
import { Card } from "@/components/ui/card";
import {
  isDateAvailable,
  getDateModifiers,
  calendarModifiersStyles
} from "@/lib/utils/booking-form.utils";
import { usePhoneFormatter } from "@/lib/hooks/use-phone-formatter";

interface PersonalInfoFormProps {
  onSubmit: (data: InquiryFormValues) => void;
  // Removed moodKeywords prop
  availableDates: string[];
  onFormChange?: () => void; // Add this prop
  photographerId?: string; // Add photographer ID prop
  photographer?: {
    id: string;
    name: string | null;
  }; // Add photographer info
  userProfile?: {
    name: string | null;
    phone: string | null;
  } | null;
}

export function PersonalInfoForm({
  onSubmit,
  // Removed moodKeywords
  availableDates,
  onFormChange,
  photographerId,
  photographer,
  userProfile,
}: PersonalInfoFormProps) {
  const [activeSection, setActiveSection] = useState<
    "personal" | "additional" | "product" | "payment"
  >("personal");

  // Fetch slot counts using React Query hook
  const { data: dateSlotCounts = {} } = useSlotCounts(
    availableDates,
    photographerId
  );

  // Fetch products for this photographer
  const { products, isProductsLoading } = useProducts();

  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      name: userProfile?.name || "",
      instagram_id: "",
      gender: "male",
      phone: userProfile?.phone || "",
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
      selected_product_id: "",
    },
  });

  // Form change subscription
  useEffect(() => {
    const subscription = form.watch(() => {
      onFormChange?.();
    });
    return () => subscription.unsubscribe();
  }, [form, onFormChange]);

  // Phone number auto-formatting (using custom hook)
  usePhoneFormatter(form);

  const handleSubmit = (data: InquiryFormValues) => {
    onSubmit(data);
  };

  const handlePaymentSuccess = (paymentKey: string, orderId: string) => {
    // Add payment info to form data and submit
    const formDataWithPayment = {
      ...form.getValues(),
      paymentKey,
      orderId,
    };
    onSubmit(formDataWithPayment);
    toast.success("결제가 완료되었습니다!");
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
      setActiveSection("product");
    } else if (activeSection === "product") {
      // Validate product selection
      const isValid = await form.trigger(["selected_product_id"]);
      if (isValid) {
        setActiveSection("payment");
      }
    }
  };

  const prevSection = () => {
    if (activeSection === "additional") {
      setActiveSection("personal");
    } else if (activeSection === "product") {
      setActiveSection("additional");
    } else if (activeSection === "payment") {
      setActiveSection("product");
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
                activeSection === "product" ? "bg-primary" : "bg-primary/30"
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
              {/* 1단계 : Personal Information Section */}
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
                      : activeSection === "additional"
                      ? -20
                      : activeSection === "product"
                      ? -40
                      : activeSection === "payment"
                      ? -60
                      : 0,
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
                              date < new Date() ||
                              !isDateAvailable(date, availableDates)
                          }
                          modifiers={{
                            available: (date) => {
                              const modifiers = getDateModifiers(date, dateSlotCounts);
                              return modifiers.available === true;
                            },
                            partiallyBooked: (date) => {
                              const modifiers = getDateModifiers(date, dateSlotCounts);
                              return modifiers.partiallyBooked === true;
                            },
                            fullyBooked: (date) => {
                              const modifiers = getDateModifiers(date, dateSlotCounts);
                              return modifiers.fullyBooked === true;
                            },
                          }}
                          modifiersStyles={calendarModifiersStyles}
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

              {/* 2단계 Additional Information Section (통합: 기존 2단계 + 3단계) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{
                  opacity: activeSection === "additional" ? 1 : 0,
                  x: activeSection === "additional" ? 0 : 20,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "space-y-6",
                  activeSection !== "additional" && "hidden"
                )}
              >
                <div>
                  <h3 className="text-xl font-semibold">추가 정보</h3>
                  <p className="text-sm text-muted-foreground">
                    작가와의 더 나은 소통을 위해 알려주세요!
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="special_request"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>요청 사항 (선택사항)</FormLabel>
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
                      <FormLabel>촬영 관련 우려사항 (선택사항)</FormLabel>
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

                <FormField
                  control={form.control}
                  name="conversation_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        처음 보는 사람과 대화는 많이 or 적게?
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="많이"
                              id="conversation_much"
                            />
                            <label
                              htmlFor="conversation_much"
                              className="text-sm"
                            >
                              많이 (대화를 즐기는 편)
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="적게"
                              id="conversation_little"
                            />
                            <label
                              htmlFor="conversation_little"
                              className="text-sm"
                            >
                              적게 (조용한 편)
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="보통"
                              id="conversation_normal"
                            />
                            <label
                              htmlFor="conversation_normal"
                              className="text-sm"
                            >
                              보통 (상황에 따라)
                            </label>
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
                      <FormLabel>
                        이번 촬영은 본인에게 어떤 의미인가요?
                      </FormLabel>
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

              {/* 3단계 Product Selection Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{
                  opacity: activeSection === "product" ? 1 : 0,
                  x: activeSection === "product" ? 0 : 20,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "space-y-4",
                  activeSection !== "product" && "hidden"
                )}
              >
                <h3 className="text-xl font-semibold">상품 선택</h3>
                <p className="text-sm text-muted-foreground">
                  원하시는 촬영 상품을 선택해주세요.
                </p>

                <FormField
                  control={form.control}
                  name="selected_product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>촬영 상품</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {isProductsLoading ? (
                            <div className="text-center py-8 text-muted-foreground">
                              상품을 불러오는 중...
                            </div>
                          ) : products.filter(
                              (p) =>
                                p.photographer_id === photographerId &&
                                p.status === "approved"
                            ).length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              등록된 상품이 없습니다.
                            </div>
                          ) : (
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="space-y-3"
                            >
                              {products
                                .filter(
                                  (p) =>
                                    p.photographer_id === photographerId &&
                                    p.status === "approved"
                                )
                                .map((product) => (
                                  <Card
                                    key={product.id}
                                    className={cn(
                                      "p-4 cursor-pointer transition-all",
                                      field.value === product.id
                                        ? "border-primary bg-primary/5"
                                        : "hover:border-primary/50"
                                    )}
                                    onClick={() => field.onChange(product.id)}
                                  >
                                    <div className="flex items-start gap-4">
                                      <RadioGroupItem
                                        value={product.id}
                                        id={product.id}
                                        className="mt-1"
                                      />
                                      <div className="flex-1 space-y-2">
                                        <label
                                          htmlFor={product.id}
                                          className="text-base font-semibold cursor-pointer"
                                        >
                                          {product.name}
                                        </label>
                                        {product.description && (
                                          <p className="text-sm text-muted-foreground">
                                            {product.description}
                                          </p>
                                        )}
                                        <div className="flex items-baseline gap-2">
                                          <span className="text-2xl font-bold">
                                            {product.price?.toLocaleString()}원
                                          </span>
                                          {product.shooting_duration && (
                                            <span className="text-sm text-muted-foreground">
                                              / {product.shooting_duration}분
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                            </RadioGroup>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4 items-center">
                  <Button type="button" variant="outline" onClick={prevSection}>
                    뒤로가기
                  </Button>
                  <Button
                    type="button"
                    onClick={nextSection}
                    disabled={!form.watch("selected_product_id")}
                  >
                    다음 <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>

              {/* 4단계 Payment Section */}
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
                    {(() => {
                      const selectedProduct = products.find(
                        (p) => p.id === form.watch("selected_product_id")
                      );
                      return selectedProduct ? (
                        <>
                          <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="font-medium">선택 상품:</span>
                            <span className="font-medium">
                              {selectedProduct.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>금액:</span>
                            <span className="text-lg font-bold text-primary">
                              {selectedProduct.price?.toLocaleString()}원
                            </span>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>
                </div>

                {(() => {
                  const selectedProduct = products.find(
                    (p) => p.id === form.watch("selected_product_id")
                  );
                  const desiredDate = form.watch("desired_date");
                  return selectedProduct ? (
                    <TossPaymentForm
                      inquiryData={{
                        name: form.watch("name") || "",
                        phone: form.watch("phone") || "",
                        email: undefined,
                        gender: form.watch("gender") || "male",
                        desired_date: desiredDate ? format(desiredDate, "yyyy-MM-dd") : "",
                        selected_slot_id: form.watch("selected_slot_id") || undefined,
                        people_count: form.watch("people_count") || 1,
                        relationship: form.watch("relationship") || undefined,
                        special_request: form.watch("special_request") || undefined,
                        difficulty_note: form.watch("difficulty_note") || undefined,
                        conversation_preference: form.watch("conversation_preference") || undefined,
                        conversation_topics: form.watch("conversation_topics") || undefined,
                        favorite_music: form.watch("favorite_music") || undefined,
                        shooting_meaning: form.watch("shooting_meaning") || undefined,
                      }}
                      product={{
                        id: selectedProduct.id,
                        name: selectedProduct.name,
                        price: selectedProduct.price || 0,
                        photographer_id: photographerId || "",
                      }}
                      photographer={{
                        id: photographerId || "",
                        name: photographer?.name || "작가",
                      }}
                      onPaymentComplete={handlePaymentSuccess}
                      onPaymentError={(error: string) => {
                        toast.error(`결제 중 오류가 발생했습니다: ${error}`);
                      }}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      상품 정보를 불러오는 중...
                    </div>
                  );
                })()}

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
