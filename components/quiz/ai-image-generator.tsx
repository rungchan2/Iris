"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  Camera, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Download, 
  Star,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { PersonalityType } from "@/lib/quiz-data";
import { 
  generatePersonalityImage, 
  editGeneratedImage,
  getAIGenerationStatus,
  rateAIGeneration,
  fileToBase64,
  type AIImageGeneration 
} from "@/lib/actions/ai";
import { toast } from "sonner";
import Image from "next/image";

interface AIImageGeneratorProps {
  sessionId: string;
  personalityCode: PersonalityType;
}

type GenerationStatus = 'idle' | 'uploading' | 'generating' | 'completed' | 'failed' | 'editing';

interface GenerationState {
  status: GenerationStatus;
  progress: number;
  generation?: AIImageGeneration;
  error?: string;
}

export function AIImageGenerator({ sessionId, personalityCode }: AIImageGeneratorProps) {
  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    progress: 0
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [editPrompt, setEditPrompt] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setState(prev => ({ ...prev, status: 'idle', error: undefined }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleGenerate = async () => {
    if (!uploadedFile) {
      toast.error("먼저 사진을 업로드해주세요");
      return;
    }

    try {
      // Convert file to Base64
      setState({ status: 'uploading', progress: 20 });
      const imageBase64 = await fileToBase64(uploadedFile);
      
      setState(prev => ({ ...prev, progress: 50, status: 'generating' }));

      // Generate AI image with OpenAI
      const result = await generatePersonalityImage(
        sessionId,
        personalityCode,
        imageBase64
      );

      if (result.success && result.generation) {
        setState({
          status: 'completed',
          progress: 100,
          generation: result.generation
        });
        
        toast.success("AI 이미지 생성이 완료되었습니다!");
      } else {
        throw new Error(result.error || "AI 이미지 생성에 실패했습니다");
      }

    } catch (error: any) {
      setState({
        status: 'failed',
        progress: 0,
        error: error.message
      });
      toast.error(error.message);
    }
  };

  const handleRating = async (newRating: number) => {
    if (!state.generation) return;

    setRating(newRating);
    
    const result = await rateAIGeneration(state.generation.id, newRating);
    if (result.success) {
      toast.success("평가가 저장되었습니다!");
    } else {
      toast.error("평가 저장에 실패했습니다");
    }
  };

  const handleDownload = () => {
    if (!state.generation?.generated_image_url) return;
    
    const link = document.createElement('a');
    link.href = state.generation.generated_image_url;
    link.download = `ai-generated-${personalityCode}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setState({ status: 'idle', progress: 0 });
    setUploadedFile(null);
    setRating(0);
    setEditPrompt('');
  };

  const handleEdit = async () => {
    if (!state.generation || !editPrompt.trim()) {
      toast.error("편집할 내용을 입력해주세요");
      return;
    }

    try {
      setState(prev => ({ ...prev, status: 'editing', progress: 30 }));

      const result = await editGeneratedImage(state.generation.id, editPrompt);

      if (result.success && result.generation) {
        setState({
          status: 'completed',
          progress: 100,
          generation: result.generation
        });
        
        setEditPrompt('');
        toast.success("이미지 편집이 완료되었습니다!");
      } else {
        throw new Error(result.error || "이미지 편집에 실패했습니다");
      }

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        status: 'completed', // Keep showing the original image
        error: error.message
      }));
      toast.error(error.message);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">AI 이미지 미리보기</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            당신의 사진을 업로드하고 {personalityCode} 성향에 맞는 AI 생성 이미지를 미리 체험해보세요.
          </p>
        </div>

        {state.status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Upload Area */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200
                ${isDragActive 
                  ? 'border-purple-400 bg-purple-50' 
                  : uploadedFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                }
              `}
            >
              <input {...getInputProps()} />
              
              {uploadedFile ? (
                <div className="space-y-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-green-800">
                      파일이 준비되었습니다
                    </p>
                    <p className="text-sm text-green-600">
                      {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)}MB)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                    }}
                  >
                    다른 파일 선택
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      {isDragActive ? "파일을 여기에 놓아주세요" : "사진을 업로드하세요"}
                    </p>
                    <p className="text-sm text-gray-500">
                      JPG, PNG, WebP 파일 (최대 10MB)
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Camera className="mr-2 h-4 w-4" />
                    파일 선택
                  </Button>
                </div>
              )}
            </div>

            {uploadedFile && (
              <div className="text-center">
                <Button
                  onClick={handleGenerate}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 px-8 py-3"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  AI 이미지 생성하기
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {(state.status === 'uploading' || state.status === 'generating' || state.status === 'editing') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {state.status === 'uploading' ? '이미지 업로드 중...' : 
                 state.status === 'editing' ? 'AI 이미지 편집 중...' : 
                 'AI 이미지 생성 중...'}
              </h3>
              <p className="text-gray-600">
                {state.status === 'uploading' 
                  ? '파일을 서버에 업로드하고 있습니다' 
                  : state.status === 'editing'
                  ? '요청사항에 따라 이미지를 편집하고 있습니다'
                  : '당신의 성향에 맞는 이미지를 생성하고 있습니다'
                }
              </p>
            </div>

            <div className="w-full max-w-md mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div 
                  className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${state.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{state.progress}% 완료</p>
            </div>
          </motion.div>
        )}

        {state.status === 'completed' && state.generation?.generated_image_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI 이미지 생성 완료!
              </h3>
              <p className="text-gray-600">
                {personalityCode} 성향에 맞는 이미지가 생성되었습니다
              </p>
            </div>

            {/* Generated Image */}
            <div className="relative max-w-md mx-auto">
              <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={state.generation.generated_image_url}
                  alt="AI Generated Image"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Rating Section */}
            <div className="text-center space-y-4">
              <h4 className="text-lg font-medium text-gray-900">
                결과가 마음에 드시나요?
              </h4>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {rating === 5 ? '완벽해요!' : 
                   rating === 4 ? '좋아요!' :
                   rating === 3 ? '괜찮아요!' :
                   rating === 2 ? '아쉬워요' : '별로예요'}
                </Badge>
              )}
            </div>

            {/* Iterative Editing Section */}
            <div className="space-y-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  더 수정하고 싶나요?
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  추가 요청사항을 입력하면 이미지를 더 편집할 수 있습니다
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="예: 배경을 더 밝게 만들어주세요, 색감을 따뜻하게 해주세요"
                  className="flex-1"
                  maxLength={100}
                />
                <Button
                  onClick={handleEdit}
                  disabled={!editPrompt.trim() || state.status !== 'completed'}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 whitespace-nowrap"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  이미지 편집
                </Button>
              </div>
              
              {editPrompt && (
                <p className="text-xs text-gray-500 text-center">
                  {editPrompt.length}/100자
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleDownload}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
              >
                <Download className="mr-2 h-5 w-5" />
                이미지 다운로드
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                다시 생성하기
              </Button>
            </div>
          </motion.div>
        )}

        {state.status === 'failed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                생성에 실패했습니다
              </h3>
              <p className="text-gray-600 mb-4">
                {state.error || "알 수 없는 오류가 발생했습니다"}
              </p>
              
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                다시 시도하기
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}