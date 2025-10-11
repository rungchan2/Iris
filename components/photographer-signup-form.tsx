"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { signUpNewUser, login } from "@/app/actions/auth"
import { validateInvitationCode } from "@/lib/actions/code"
import { createPhotographerProfileAction, uploadPortfolioImagesAction } from "@/lib/actions/photographer-signup"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  photographerSignupFormSchema,
  mapFormDataToPhotographerInsert,
  type PhotographerSignupFormData,
} from "@/types"

import { useState, useCallback } from "react"
import { Eye, EyeOff, Upload, X, ChevronRight, ChevronLeft, Camera, User, MapPin, DollarSign, FileImage, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast, Toaster } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const STEPS = [
  { id: 1, title: '기본 정보', icon: User },
  { id: 2, title: '연락처 정보', icon: Camera },
  { id: 3, title: '전문 분야', icon: MapPin },
  { id: 4, title: '가격 정보', icon: DollarSign },
  { id: 5, title: '포트폴리오', icon: FileImage },
];

const SPECIALTIES = [
  '인물 사진', '웨딩 사진', '가족 사진', '반려동물 사진',
  '상품 사진', '이벤트 사진', '졸업 사진', '프로필 사진',
  '패션 사진', '아이 사진', '커플 사진', '야외 촬영'
];

const AGE_RANGES = ['20대', '30대', '40대', '50대 이상'];

const KOREAN_CITIES = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시',
  '울산광역시', '세종특별자치시', '경기도', '강원도', '충청북도', '충청남도',
  '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
];

interface SignupFormProps extends React.ComponentPropsWithoutRef<"div"> {
  className?: string;
  props?: React.ComponentPropsWithoutRef<"div">;
}

export function PhotographerSignupForm({
  className,
  ...props
}: SignupFormProps) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, setError, watch, control, setValue, trigger } = useForm<PhotographerSignupFormData>({
    resolver: zodResolver(photographerSignupFormSchema),
    mode: 'onChange',
    defaultValues: {
      step3_specialties: [],
      step5_portfolioFiles: [],
      step5_portfolioDescriptions: [],
      step5_agreeToTerms: false,
      step5_agreeToPrivacy: false
    }
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);
  const [submissionStep, setSubmissionStep] = useState<'idle' | 'signup' | 'profile' | 'upload' | 'complete'>('idle');
  const [submissionMessage, setSubmissionMessage] = useState('');

  const password = watch("step1_password");
  const watchedSpecialties = watch("step3_specialties");
  const watchedPortfolioFiles = watch("step5_portfolioFiles");
  const watchedAgreeToTerms = watch("step5_agreeToTerms");
  const watchedAgreeToPrivacy = watch("step5_agreeToPrivacy");

  // 파일 업로드 핸들러
  const handleFileUpload = useCallback((files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      toast.error('일부 파일이 제외되었습니다. 이미지 파일만 업로드 가능하며, 파일 크기는 10MB 이하여야 합니다.');
    }

    // 기존 파일들과 합쳐서 최대 10개까지만 허용
    const currentFiles = watchedPortfolioFiles || [];
    const newFiles = [...currentFiles, ...validFiles].slice(0, 10);
    
    setValue('step5_portfolioFiles', newFiles);
    
    // 미리보기 생성
    const newPreviews: string[] = [];
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === newFiles.length) {
            setPortfolioPreviews(newPreviews);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }, [watchedPortfolioFiles, setValue]);

  // 파일 제거 핸들러
  const removeFile = useCallback((index: number) => {
    const currentFiles = watchedPortfolioFiles || [];
    const newFiles = currentFiles.filter((_file: File, i: number) => i !== index);
    setValue('step5_portfolioFiles', newFiles);

    const newPreviews = portfolioPreviews.filter((_preview: string, i: number) => i !== index);
    setPortfolioPreviews(newPreviews);
  }, [watchedPortfolioFiles, portfolioPreviews, setValue]);

  // 단계별 validation (Zod 기반)
  const validateCurrentStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await trigger(fieldsToValidate as any)

    if (!isValid) {
      const errorMessages = Object.values(errors)
        .filter((error): error is { message?: string } => error !== undefined)
        .map(error => error.message)
        .filter((message): message is string => typeof message === 'string')

      if (errorMessages.length > 0) {
        toast.error(errorMessages[0])
      }
    }

    return isValid
  }

  // 각 단계별 검증할 필드 반환
  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1:
        return ['step1_email', 'step1_name', 'step1_password', 'step1_passwordConfirm', 'step1_code']
      case 2:
        return ['step2_phone', 'step2_gender', 'step2_ageRange', 'step2_instagramHandle', 'step2_websiteUrl']
      case 3:
        return ['step3_yearsExperience', 'step3_specialties', 'step3_studioLocation', 'step3_equipmentInfo', 'step3_bio']
      case 4:
        return ['step4_priceRangeMin', 'step4_priceRangeMax', 'step4_priceDescription']
      case 5:
        return ['step5_portfolioFiles', 'step5_portfolioDescriptions', 'step5_agreeToTerms', 'step5_agreeToPrivacy']
      default:
        return []
    }
  }

  // 다음 단계로 이동
  const nextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      return;
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  // 이전 단계로 이동
  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // 전문 분야 토글
  const toggleSpecialty = useCallback((specialty: string) => {
    const current = watchedSpecialties || [];
    const newSpecialties = current.includes(specialty)
      ? current.filter((s: string) => s !== specialty)
      : [...current, specialty];
    setValue('step3_specialties', newSpecialties);
  }, [watchedSpecialties, setValue]);

  const onSubmit = async (data: PhotographerSignupFormData) => {
    setIsLoading(true);
    setSubmissionStep('signup');
    setSubmissionMessage('회원가입을 진행하고 있습니다...');

    try {
      // 1. 가입 코드 검증
      const isCodeValid = await validateInvitationCode(data.step1_code);
      if (!isCodeValid) {
        setError("step1_code", { message: "유효하지 않은 가입 코드입니다." });
        setIsLoading(false);
        setSubmissionStep('idle');
        return;
      }

      // 2. Supabase 회원가입 (users 테이블 레코드 포함)
      const signupResult = await signUpNewUser(
        data.step1_email,
        data.step1_password,
        data.step1_name,
        'photographer'
      );

      if (!signupResult.success || signupResult.error) {
        toast.error(signupResult.error || "회원가입에 실패했습니다. 다시 시도해주세요.");
        setIsLoading(false);
        setSubmissionStep('idle');
        return;
      }

      if (!signupResult.data?.user) {
        toast.error("회원가입 데이터를 받아올 수 없습니다.");
        setIsLoading(false);
        setSubmissionStep('idle');
        return;
      }

      const userId = signupResult.data.user.id;

      // 3. 로그인 준비 단계
      setSubmissionStep('profile');
      setSubmissionMessage('로그인 준비 중입니다...');

      // 4. 로그인 수행
      setSubmissionMessage('로그인을 수행하고 있습니다...');
      const { data: loginData, error: loginError } = await login(data.step1_email, data.step1_password);

      if (loginError || !loginData?.user) {
        toast.error("자동 로그인에 실패했습니다. 수동으로 로그인해주세요.");
        router.push("/login?message=application-submitted");
        return;
      }

      // 로그인 성공 후 잠시 대기 (세션 안정화)
      setSubmissionMessage('세션을 설정하고 있습니다...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 5. 작가 프로필 생성 (Server Action)
      setSubmissionMessage('작가 프로필을 생성하고 있습니다...');

      const photographerData = mapFormDataToPhotographerInsert(data, userId);
      const profileResult = await createPhotographerProfileAction(photographerData);

      if (!profileResult.success) {
        toast.error(profileResult.error || "작가 프로필 생성에 실패했습니다.");
        router.push("/login?message=profile-creation-failed");
        return;
      }

      // 6. 포트폴리오 이미지 업로드 (Server Action)
      setSubmissionStep('upload');
      setSubmissionMessage(`포트폴리오 이미지를 업로드하고 있습니다... (0/${data.step5_portfolioFiles.length})`);

      const formData = new FormData();
      data.step5_portfolioFiles.forEach((file: File, index: number) => {
        formData.append(`file_${index}`, file);
      });

      const uploadResult = await uploadPortfolioImagesAction(formData);

      if (!uploadResult.success) {
        toast.error(uploadResult.error || "포트폴리오 업로드에 실패했습니다.");
        router.push("/login?message=portfolio-upload-failed");
        return;
      }

      // 7. 성공 처리
      setSubmissionStep('complete');
      setSubmissionMessage('회원가입이 완료되었습니다!');

      toast.success("작가 지원서가 성공적으로 제출되었습니다! 검토 후 연락드리겠습니다.");

      // 지연 후 승인 상태 페이지로 이동
      setTimeout(() => {
        router.push("/photographer/approval-status");
      }, 2000);

    } catch (error) {
      toast.error("예상치 못한 오류가 발생했습니다. 다시 시도해주세요.");
      setSubmissionStep('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    const formData = watch();
    
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4" key="step-1">
            <div className="grid gap-2">
              <Label htmlFor="step1-email">이메일 *</Label>
              <Input
                key={`step1-email-${currentStep}`}
                id="step1-email"
                type="email"
                placeholder="photographer@example.com"
                {...register("step1_email", {
                  required: "이메일을 입력해주세요.",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "유효한 이메일 주소를 입력해주세요."
                  }
                })}
              />
              {errors.step1_email && <p className="text-sm text-red-600">{errors.step1_email.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="step1-name">이름 *</Label>
              <Input
                id="step1-name"
                type="text"
                placeholder="김작가"
                {...register("step1_name", {
                  required: "이름을 입력해주세요.",
                  minLength: {
                    value: 2,
                    message: "이름은 최소 2글자 이상이어야 합니다."
                  }
                })}
              />
              {errors.step1_name && <p className="text-sm text-red-600">{errors.step1_name.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="step1-password">비밀번호 *</Label>
              <div className="relative">
                <Input 
                  id="step1-password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="최소 6자 이상"
                  {...register("step1_password", {
                    required: "비밀번호를 입력해주세요.",
                    minLength: {
                      value: 6,
                      message: "비밀번호는 최소 6글자 이상이어야 합니다."
                    }
                  })} 
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
              {errors.step1_password && <p className="text-sm text-red-600">{errors.step1_password.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="step1-passwordConfirm">비밀번호 확인 *</Label>
              <div className="relative">
                <Input 
                  id="step1-passwordConfirm" 
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력해주세요"
                  {...register("step1_passwordConfirm", {
                    required: "비밀번호 확인을 입력해주세요.",
                    validate: (value) => value === password || "비밀번호가 일치하지 않습니다."
                  })} 
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                >
                  {showPasswordConfirm ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
              {errors.step1_passwordConfirm && <p className="text-sm text-red-600">{errors.step1_passwordConfirm.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="step1-code">작가 가입 코드 *</Label>
              <Input 
                id="step1-code" 
                type="text" 
                placeholder="작가 가입 코드를 입력해주세요" 
                {...register("step1_code", {
                  required: "가입 코드를 입력해주세요."
                })} 
              />
              {errors.step1_code && <p className="text-sm text-red-600">{errors.step1_code.message}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4" key="step-2-container">
            <div className="grid gap-2">
              <Label htmlFor="step2-phone">전화번호 *</Label>
              <Input
                key="step2-phone-input"
                id="step2-phone"
                type="tel"
                placeholder="010-1234-5678"
                {...register("step2_phone", {
                  required: "전화번호를 입력해주세요.",
                  pattern: {
                    value: /^[0-9-]+$/,
                    message: "올바른 전화번호 형식을 입력해주세요."
                  }
                })}
              />
              {errors.step2_phone && <p className="text-sm text-red-600">{errors.step2_phone.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label>성별</Label>
              <Controller
                name="step2_gender"
                control={control}
                render={({ field }) => (
                  <Select key="step2-gender-select" value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="성별을 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">남성</SelectItem>
                      <SelectItem value="female">여성</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label>연령대</Label>
              <Controller
                name="step2_ageRange"
                control={control}
                render={({ field }) => (
                  <Select key="step2-ageRange-select" value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="연령대를 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_RANGES.map((range) => (
                        <SelectItem key={range} value={range}>{range}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="step2-instagramHandle">인스타그램 핸들</Label>
              <Input
                key="step2-instagramHandle-input"
                id="step2-instagramHandle"
                type="text"
                placeholder="@photographer_name"
                {...register("step2_instagramHandle")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="step2-websiteUrl">웹사이트</Label>
              <Input
                key="step2-websiteUrl-input"
                id="step2-websiteUrl"
                type="url"
                placeholder="https://photographer.com"
                {...register("step2_websiteUrl")}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4" key="step-3-container">
            <div className="grid gap-2">
              <Label htmlFor="step3-yearsExperience">사진 경력 (년) *</Label>
              <Input
                key="step3-yearsExperience-input"
                id="step3-yearsExperience"
                type="number"
                min="0"
                max="50"
                placeholder="3"
                {...register("step3_yearsExperience", {
                  required: "경력을 입력해주세요.",
                  valueAsNumber: true,
                  min: { value: 0, message: "0년 이상을 입력해주세요." }
                })}
              />
              {errors.step3_yearsExperience && <p className="text-sm text-red-600">{errors.step3_yearsExperience.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label>전문 분야 * (복수 선택 가능)</Label>
              <div className="grid grid-cols-2 gap-2">
                {SPECIALTIES.map((specialty) => (
                  <div key={specialty} className="flex items-center space-x-2">
                    <Checkbox
                      id={specialty}
                      checked={watchedSpecialties?.includes(specialty) || false}
                      onCheckedChange={() => toggleSpecialty(specialty)}
                    />
                    <Label htmlFor={specialty} className="text-sm font-normal">{specialty}</Label>
                  </div>
                ))}
              </div>
              {(!watchedSpecialties || watchedSpecialties.length === 0) && (
                <p className="text-sm text-red-600">최소 하나의 전문 분야를 선택해주세요.</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>활동 지역 *</Label>
              <Controller
                name="step3_studioLocation"
                control={control}
                rules={{ required: "활동 지역을 선택해주세요." }}
                render={({ field }) => (
                  <Select key="step3-studioLocation-select" value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="주요 활동 지역을 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {KOREAN_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.step3_studioLocation && <p className="text-sm text-red-600">{errors.step3_studioLocation.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="step3-equipmentInfo">보유 장비</Label>
              <Textarea
                key="step3-equipmentInfo-textarea"
                id="step3-equipmentInfo"
                placeholder="주요 보유 장비를 입력해주세요 (카메라, 렌즈 등)"
                {...register("step3_equipmentInfo")}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="step3-bio">자기소개 및 작업 스타일 *</Label>
              <Textarea
                key="step3-bio-textarea"
                id="step3-bio"
                placeholder="본인의 작업 스타일, 철학, 특장점 등을 소개해주세요"
                {...register("step3_bio", {
                  required: "자기소개를 입력해주세요.",
                  minLength: {
                    value: 50,
                    message: "최소 50자 이상 입력해주세요."
                  }
                })}
                rows={4}
              />
              {errors.step3_bio && <p className="text-sm text-red-600">{errors.step3_bio.message}</p>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4" key="step-4-container">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="step4-priceRangeMin">최소 가격 (원)</Label>
                <Input
                  key="step4-priceRangeMin-input"
                  id="step4-priceRangeMin"
                  type="number"
                  min="0"
                  step="10000"
                  placeholder="100000"
                  {...register("step4_priceRangeMin", { valueAsNumber: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="step4-priceRangeMax">최대 가격 (원)</Label>
                <Input
                  key="step4-priceRangeMax-input"
                  id="step4-priceRangeMax"
                  type="number"
                  min="0"
                  step="10000"
                  placeholder="500000"
                  {...register("step4_priceRangeMax", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="step4-priceDescription">가격 정책 설명</Label>
              <Textarea
                key="step4-priceDescription-textarea"
                id="step4-priceDescription"
                placeholder="촬영 시간, 포함 서비스, 추가 옵션 등 가격 정책을 상세히 설명해주세요"
                {...register("step4_priceDescription")}
                rows={4}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4" key="step-5-container">
            <div className="grid gap-2">
              <Label>포트폴리오 이미지 * (최소 3장, 최대 10장)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="text-sm text-gray-600 mb-2">
                  이미지를 드래그해서 놓거나 클릭하여 업로드
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="portfolioUpload"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    handleFileUpload(files);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('portfolioUpload')?.click()}
                >
                  파일 선택
                </Button>
              </div>
              
              {portfolioPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {portfolioPreviews.map((preview, index) => (
                    <div key={index} className="relative w-full h-32">
                      <Image
                        src={preview}
                        alt={`Portfolio ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                        sizes="(max-width: 768px) 33vw, 25vw"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {(!watchedPortfolioFiles || watchedPortfolioFiles.length < 3) && (
                <p className="text-sm text-red-600">최소 3장의 포트폴리오 이미지를 업로드해주세요.</p>
              )}
            </div>

            <div className="space-y-4">
              <Label>이용약관 및 개인정보처리방침 동의 *</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="step5_agreeToTerms"
                    control={control}
                    rules={{ required: "이용약관에 동의해주세요." }}
                    render={({ field }) => (
                      <Checkbox
                        key="step5-agreeToTerms-checkbox"
                        id="step5-agreeToTerms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="step5-agreeToTerms" className="text-sm">
                    이용약관에 동의합니다.
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="step5_agreeToPrivacy"
                    control={control}
                    rules={{ required: "개인정보처리방침에 동의해주세요." }}
                    render={({ field }) => (
                      <Checkbox
                        key="step5-agreeToPrivacy-checkbox"
                        id="step5-agreeToPrivacy"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="step5-agreeToPrivacy" className="text-sm">
                    개인정보처리방침에 동의합니다.
                  </Label>
                </div>
              </div>
              {(errors.step5_agreeToTerms || errors.step5_agreeToPrivacy) && (
                <p className="text-sm text-red-600">모든 약관에 동의해주세요.</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* 제출 중 모달 */}
      <AlertDialog open={submissionStep !== 'idle'} onOpenChange={() => {}}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            회원가입 진행 중
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">{submissionMessage}</div>
                
                {/* 진행 상태 표시 */}
                <div className="flex justify-between items-center mt-6 space-x-2">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium",
                    submissionStep === 'signup' || submissionStep === 'profile' || submissionStep === 'upload' || submissionStep === 'complete'
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 text-gray-500"
                  )}>
                    1
                  </div>
                  <div className={cn(
                    "flex-1 h-0.5",
                    submissionStep === 'profile' || submissionStep === 'upload' || submissionStep === 'complete'
                      ? "bg-blue-500" 
                      : "bg-gray-200"
                  )} />
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium",
                    submissionStep === 'profile' || submissionStep === 'upload' || submissionStep === 'complete'
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 text-gray-500"
                  )}>
                    2
                  </div>
                  <div className={cn(
                    "flex-1 h-0.5",
                    submissionStep === 'upload' || submissionStep === 'complete'
                      ? "bg-blue-500" 
                      : "bg-gray-200"
                  )} />
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium",
                    submissionStep === 'upload' || submissionStep === 'complete'
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 text-gray-500"
                  )}>
                    3
                  </div>
                  <div className={cn(
                    "flex-1 h-0.5",
                    submissionStep === 'complete'
                      ? "bg-green-500" 
                      : "bg-gray-200"
                  )} />
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium",
                    submissionStep === 'complete'
                      ? "bg-green-500 text-white" 
                      : "bg-gray-200 text-gray-500"
                  )}>
                    ✓
                  </div>
                </div>
                
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>회원가입</span>
                  <span>프로필</span>
                  <span>업로드</span>
                  <span>완료</span>
                </div>
              </div>
              
              <div className="text-center text-xs text-muted-foreground">
                잠시만 기다려주세요. 페이지를 새로고침하거나 뒤로가기를 하지 마세요.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>

      <div className={cn("flex flex-col gap-6 items-center justify-center", className)} {...props}>
        <Card className="min-w-[700px] w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl">작가 회원가입</CardTitle>
          <CardDescription>
            kindt 플랫폼에 작가로 등록하여 고객들과 만나보세요.
          </CardDescription>
          
          {/* 진행바 */}
          <div className="flex items-center justify-between mt-4">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                    isActive && "border-blue-500 bg-blue-500 text-white",
                    isCompleted && "border-green-500 bg-green-500 text-white",
                    !isActive && !isCompleted && "border-gray-300 text-gray-400"
                  )}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <div className={cn(
                    "ml-2 text-xs font-medium",
                    isActive && "text-blue-600",
                    isCompleted && "text-green-600",
                    !isActive && !isCompleted && "text-gray-400"
                  )}>
                    {step.title}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-4 transition-colors",
                      isCompleted && "bg-green-500",
                      !isCompleted && "bg-gray-300"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent()}
            
            {/* 네비게이션 버튼 */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                이전
              </Button>
              
              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center"
                >
                  다음
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center"
                >
                  {isLoading ? "제출 중..." : "지원서 제출"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
        </Card>
      </div>
      <Toaster richColors position="top-right" />
    </>
  )
}

