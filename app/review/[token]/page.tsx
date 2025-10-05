import { getReviewByToken } from "@/lib/actions/reviews";
import { ReviewForm } from "@/components/review/review-form";
import { reviewLogger } from '@/lib/logger';
import { Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface ReviewPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { token } = await params;
  
  const result = await getReviewByToken(token);

  reviewLogger.info("result", result)

  if (result.error || !result.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            
            <div className="space-y-2 text-gray-600">
              {result.error === "Review not found" && (
                <p>유효하지 않은 리뷰 링크입니다.</p>
              )}
              {result.error === "Review link has expired" && (
                <>
                  <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p>리뷰 링크가 만료되었습니다.</p>
                  <p className="text-sm">작가님께 새로운 리뷰 링크를 요청해주세요.</p>
                </>
              )}
              {result.error === "Review has already been submitted" && (
                <>
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-2" />
                  <p>이미 리뷰가 제출되었습니다.</p>
                  <p className="text-sm">소중한 후기를 남겨주셔서 감사합니다!</p>
                </>
              )}
            </div>
            <div className="mt-6">
              <Link 
                href="/"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                홈페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const review = result.data;
  const inquiry = review.inquiries;
  const photographer = inquiry?.photographers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              kindt 리뷰 작성
            </h1>
            <p className="text-gray-600">
              촬영 경험을 공유하고 다른 고객들에게 도움을 주세요
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Photographer Info */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-600">
                  {photographer?.name?.charAt(0) || "P"}
                </span>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {photographer?.name || "작가"}님과의 촬영
            </h2>
            <p className="text-gray-600 mb-4">
              안녕하세요, <span className="font-medium">{inquiry?.name}</span>님! 
              촬영은 만족스러우셨나요?
            </p>
            {photographer?.bio && (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                {photographer.bio}
              </p>
            )}
          </div>
        </div>

        

        {/* Review Form */}
        <ReviewForm
          token={token}
          photographerName={photographer?.name || "작가"}
          customerName={inquiry?.name || ""}
        />

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            리뷰 작성에 문제가 있으시면{" "}
            <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="text-orange-600 hover:underline">
              고객센터
            </a>로 연락해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ReviewPageProps) {
  const { token } = await params;
  
  const result = await getReviewByToken(token);
  
  if (result.error || !result.data) {
    return {
      title: "리뷰 작성 - kindt",
      description: "kindt 촬영 후기를 작성해주세요.",
    };
  }

  const photographer = result.data.inquiries?.photographers;
  
  return {
    title: `${photographer?.name || "작가"}님 촬영 후기 작성 - kindt`,
    description: `${photographer?.name || "작가"}님과의 촬영 경험을 공유하고 다른 고객들에게 도움을 주세요.`,
    robots: {
      index: false, // 개별 리뷰 작성 페이지는 검색 노출하지 않음
      follow: false,
    },
  };
}