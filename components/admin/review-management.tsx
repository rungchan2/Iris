"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateReviewLink } from "@/lib/actions/reviews";
import { 
  Copy, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { StarDisplay } from "@/components/review/star-rating";

interface Inquiry {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  status: string;
}

interface Review {
  id: string;
  rating: number | null;
  comment: string | null;
  is_submitted: boolean;
  review_token: string;
  expires_at: string | null;
  created_at: string;
}

interface ReviewManagementProps {
  inquiries: Inquiry[];
  reviews: Record<string, Review[]>;
}

export function ReviewManagement({ inquiries, reviews }: ReviewManagementProps) {
  const [generatingLinks, setGeneratingLinks] = useState<Set<string>>(new Set());
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, string>>({});
  const [copiedLinks, setCopiedLinks] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGenerateLink = async (inquiryId: string) => {
    try {
      setGeneratingLinks(prev => new Set(prev).add(inquiryId));
      setErrors(prev => ({ ...prev, [inquiryId]: "" }));

      const result = await generateReviewLink(inquiryId);

      if (result.error) {
        setErrors(prev => ({ ...prev, [inquiryId]: result.error! }));
        return;
      }

      if (result.data) {
        setGeneratedLinks(prev => ({ 
          ...prev, 
          [inquiryId]: result.data!.review_url 
        }));
      }
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        [inquiryId]: "링크 생성 중 오류가 발생했습니다." 
      }));
    } finally {
      setGeneratingLinks(prev => {
        const next = new Set(prev);
        next.delete(inquiryId);
        return next;
      });
    }
  };

  const handleCopyLink = async (inquiryId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinks(prev => new Set(prev).add(inquiryId));
      
      // Remove copied state after 2 seconds
      setTimeout(() => {
        setCopiedLinks(prev => {
          const next = new Set(prev);
          next.delete(inquiryId);
          return next;
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const getInquiryReviews = (inquiryId: string): Review[] => {
    return reviews[inquiryId] || [];
  };

  const getReviewStatus = (inquiryId: string) => {
    const inquiryReviews = getInquiryReviews(inquiryId);
    
    if (inquiryReviews.length === 0) {
      return { status: "none", label: "리뷰 없음", color: "gray" };
    }

    const submittedReviews = inquiryReviews.filter(r => r.is_submitted);
    const pendingReviews = inquiryReviews.filter(r => !r.is_submitted);

    if (submittedReviews.length > 0) {
      return { 
        status: "submitted", 
        label: `리뷰 완료 (${submittedReviews.length}개)`, 
        color: "green",
        reviews: submittedReviews
      };
    }

    if (pendingReviews.length > 0) {
      const hasExpired = pendingReviews.some(r => 
        r.expires_at && new Date(r.expires_at) < new Date()
      );
      
      if (hasExpired) {
        return { 
          status: "expired", 
          label: "링크 만료", 
          color: "red" 
        };
      }
      
      return { 
        status: "pending", 
        label: "리뷰 대기중", 
        color: "yellow" 
      };
    }

    return { status: "none", label: "리뷰 없음", color: "gray" };
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {inquiries.map((inquiry) => {
          const reviewStatus = getReviewStatus(inquiry.id);
          const hasGeneratedLink = generatedLinks[inquiry.id];
          const isGenerating = generatingLinks.has(inquiry.id);
          const error = errors[inquiry.id];
          const isCopied = copiedLinks.has(inquiry.id);

          return (
            <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {inquiry.name}
                  </CardTitle>
                  <Badge 
                    variant={reviewStatus.color === "green" ? "default" : "secondary"}
                    className={`
                      ${reviewStatus.color === "green" ? "bg-green-100 text-green-800" : ""}
                      ${reviewStatus.color === "yellow" ? "bg-yellow-100 text-yellow-800" : ""}
                      ${reviewStatus.color === "red" ? "bg-red-100 text-red-800" : ""}
                      ${reviewStatus.color === "gray" ? "bg-gray-100 text-gray-800" : ""}
                    `}
                  >
                    {reviewStatus.status === "submitted" && <CheckCircle className="w-3 h-3 mr-1" />}
                    {reviewStatus.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                    {reviewStatus.status === "expired" && <AlertCircle className="w-3 h-3 mr-1" />}
                    {reviewStatus.label}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <p>연락처: {inquiry.phone}</p>
                  <p>예약일: {new Date(inquiry.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Show submitted reviews */}
                {reviewStatus.status === "submitted" && reviewStatus.reviews && (
                  <div className="space-y-3">
                    {reviewStatus.reviews.map((review) => (
                      <div key={review.id} className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <StarDisplay rating={review.rating || 0} size="sm" />
                          <span className="text-sm text-gray-600">
                            {new Date(review.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-700 bg-white p-3 rounded">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Review link generation */}
                {reviewStatus.status !== "submitted" && (
                  <div className="space-y-3">
                    {!hasGeneratedLink ? (
                      <Button
                        onClick={() => handleGenerateLink(inquiry.id)}
                        disabled={isGenerating}
                        className="w-full"
                        variant="outline"
                      >
                        {isGenerating ? (
                          "링크 생성 중..."
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            리뷰 링크 생성
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={hasGeneratedLink}
                            readOnly
                            className="flex-1 text-sm"
                          />
                          <Button
                            onClick={() => handleCopyLink(inquiry.id, hasGeneratedLink)}
                            size="sm"
                            variant="outline"
                          >
                            {isCopied ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => window.open(hasGeneratedLink, '_blank')}
                            size="sm"
                            variant="outline"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              const message = `안녕하세요! Photo4You에서 촬영해주셔서 감사합니다. 촬영 후기를 남겨주시면 큰 도움이 됩니다. 링크: ${hasGeneratedLink}`;
                              window.open(`sms:${inquiry.phone}?body=${encodeURIComponent(message)}`, '_blank');
                            }}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            SMS 보내기
                          </Button>
                          <Button
                            onClick={() => {
                              const subject = "Photo4You 촬영 후기 부탁드립니다";
                              const body = `안녕하세요, ${inquiry.name}님!\n\nPhoto4You에서 촬영해주셔서 감사합니다.\n촬영은 만족스러우셨나요?\n\n아래 링크를 통해 간단한 후기를 남겨주시면 다른 고객들에게 큰 도움이 됩니다.\n\n후기 작성하기: ${hasGeneratedLink}\n\n감사합니다!`;
                              window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                            }}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            이메일 보내기
                          </Button>
                        </div>
                      </div>
                    )}

                    {error && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {inquiries.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">아직 예약이 없습니다.</p>
            <p className="text-sm text-gray-500 mt-2">
              고객의 예약이 완료되면 여기서 리뷰 링크를 생성할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}