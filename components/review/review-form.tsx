"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { StarRating } from "./star-rating";
import { submitReview } from "@/lib/actions/reviews";
import { Camera, Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const reviewSchema = z.object({
  reviewer_name: z.string().optional(),
  rating: z.number().min(1, "평점을 선택해주세요").max(5),
  comment: z.string().optional(),
  is_public: z.boolean(),
  is_anonymous: z.boolean(),
});

type ReviewFormData = {
  reviewer_name?: string;
  rating: number;
  comment?: string;
  is_public: boolean;
  is_anonymous: boolean;
};

interface ReviewFormProps {
  token: string;
  photographerName: string;
  customerName: string;
  onSuccess?: () => void;
}

export function ReviewForm({
  token,
  photographerName,
  customerName,
  onSuccess,
}: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      reviewer_name: customerName || "",
      rating: 0,
      comment: "",
      is_public: true,
      is_anonymous: false,
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await submitReview(token, {
        ...data,
        photos: photos.length > 0 ? photos : undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setIsSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError("리뷰 제출 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    // Here you would typically upload to your storage service
    // For now, we'll simulate with placeholder URLs
    const newPhotos = Array.from(files).map(
      (file, index) => URL.createObjectURL(file) // In production, replace with actual upload
    );

    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5)); // Limit to 5 photos
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-8 pb-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            리뷰가 성공적으로 제출되었습니다!
          </h2>
          <p className="text-gray-600 mb-6">
            소중한 후기를 남겨주셔서 감사합니다.
            <br />
            {photographerName} 작가님께 큰 도움이 될 것입니다.
          </p>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-800">
              💡 더 많은 작가들의 작품을 보고 싶으시다면
              <br />
              <a
                href="/gallery"
                className="font-medium underline hover:text-orange-600"
              >
                갤러리 페이지
              </a>
              를 방문해보세요!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            촬영은 어떠셨나요?
          </div>
          <div className="text-lg text-gray-600">
            <span className="text-orange-600 font-semibold">
              {photographerName}
            </span>{" "}
            작가님께 솔직한 후기를 남겨주세요
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    전체적인 만족도는 어떠셨나요? *
                  </FormLabel>
                  <FormControl>
                    <div className="flex justify-center py-4">
                      <StarRating
                        value={field.value}
                        onChange={field.onChange}
                        size="lg"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="reviewer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름 (선택사항)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="익명으로 남기려면 비워두세요"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>후기 내용 (선택사항)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="촬영 경험에 대해 자세히 알려주세요. 다른 고객들에게 도움이 될 것입니다."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Settings */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>공개 리뷰로 게시하기</FormLabel>
                      <p className="text-xs text-gray-600">
                        다른 고객들이 이 리뷰를 볼 수 있습니다
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_anonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>익명으로 게시하기</FormLabel>
                      <p className="text-xs text-gray-600">
                        이름 대신 "익명"으로 표시됩니다
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Important Notice */}
            <Alert className="mb-8 border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>안내사항:</strong> 리뷰는 한 번만 작성할 수 있으며, 제출
                후에는 수정이 불가능합니다. 신중하게 작성해주세요.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting || form.watch("rating") === 0}
            >
              {isSubmitting ? "제출 중..." : "리뷰 제출하기"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
