"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Share2, 
  Copy, 
  Check, 
  Download,
  Link2,
  MessageCircle
} from "lucide-react";
import { PersonalityType, personalityTypes } from "@/lib/quiz-data";
import { toast } from "sonner";
import html2canvas from "html2canvas-pro";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareResultProps {
  personalityType: PersonalityType;
  sessionId: string;
}

export function ShareResult({ personalityType, sessionId }: ShareResultProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const result = personalityTypes[personalityType];
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/quiz/result/${sessionId}`;
  
  const shareText = `나의 사진 성향은 "${result.name}"입니다! 🎨\n\n${result.description}\n\n나만의 사진 성향을 알아보세요 👉`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("링크가 복사되었습니다!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("링크 복사에 실패했습니다");
    }
  };

  const handleShareKakao = () => {
    // Kakao SDK should be initialized in app layout
    if (typeof window !== 'undefined' && (window as any).Kakao) {
      const Kakao = (window as any).Kakao;
      
      if (!Kakao.isInitialized()) {
        // Initialize with your Kakao app key if needed
        // Kakao.init('YOUR_KAKAO_APP_KEY');
        toast.error("카카오톡 공유 기능을 사용할 수 없습니다");
        return;
      }

      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `나의 사진 성향: ${result.name}`,
          description: result.description,
          imageUrl: `${window.location.origin}/og-image.jpg`, // Use default for now
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: '나도 진단하기',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      });
    } else {
      // Fallback to web share
      handleWebShare();
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `나의 사진 성향: ${result.name}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error("공유하기에 실패했습니다");
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadImage = async () => {
    setIsGenerating(true);
    
    try {
      // Create a temporary element for capture
      const resultCard = document.getElementById('result-card-for-capture');
      
      if (!resultCard) {
        toast.error("결과 카드를 찾을 수 없습니다");
        return;
      }

      const canvas = await html2canvas(resultCard, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `kindt-result-${personalityType}-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success("이미지가 다운로드되었습니다!");
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error("이미지 생성에 실패했습니다");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Share2 className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              결과 공유하기
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              친구들과 당신의 사진 성향을 공유하고,<br />
              함께 진단해보세요!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Share dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Share2 className="mr-2 h-5 w-5" />
                    공유하기
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem onClick={handleShareKakao}>
                    <MessageCircle className="mr-2 h-4 w-4 text-yellow-600" />
                    카카오톡으로 공유
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleWebShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    다른 앱으로 공유
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Copy link button */}
              <Button
                variant="outline"
                size="lg"
                onClick={handleCopyLink}
                className="min-w-[140px]"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-5 w-5 text-green-600" />
                    복사 완료!
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-5 w-5" />
                    링크 복사
                  </>
                )}
              </Button>

              {/* Download image button */}
              <Button
                variant="outline"
                size="lg"
                onClick={handleDownloadImage}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    이미지 저장
                  </>
                )}
              </Button>
            </div>

            {/* Share preview */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left">
              <p className="text-xs text-gray-500 mb-2">공유 미리보기</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {shareText}
              </p>
              <p className="text-xs text-blue-600 mt-2 truncate">
                {shareUrl}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden card for image generation */}
      <div className="fixed -left-[9999px] top-0">
        <div 
          id="result-card-for-capture" 
          className="w-[800px] bg-white p-12"
        >
          <div className={`w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-r ${result.color} flex items-center justify-center shadow-lg`}>
            <span className="text-white font-bold text-5xl">{result.code}</span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            나의 사진 성향
          </h1>
          
          <h2 className="text-5xl font-bold text-orange-600 mb-6 text-center">
            {result.name}
          </h2>
          
          <p className="text-xl text-gray-600 text-center mb-8 leading-relaxed">
            {result.description}
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {result.styleKeywords.map((keyword, index) => (
              <span 
                key={index} 
                className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-lg font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>

          <div className="text-center pt-8 border-t border-gray-200">
            <p className="text-gray-500 mb-2">나만의 사진 성향을 알아보세요</p>
            <p className="text-2xl font-bold text-orange-600">kindt</p>
          </div>
        </div>
      </div>
    </>
  );
}