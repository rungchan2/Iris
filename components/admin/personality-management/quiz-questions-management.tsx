"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Edit, 
  Plus, 
  Trash2, 
  Search, 
  FileText, 
  Image, 
  Weight,
  Save,
  X,
  Eye,
  BarChart3,
  AlertTriangle
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: "text" | "image";
  image_url?: string;
  part: "emotion" | "photo" | "preference";
  display_order: number;
  is_active: boolean;
  choices: QuizChoice[];
}

interface QuizChoice {
  id: number;
  choice_text: string;
  choice_image_url?: string;
  display_order: number;
  weights: ChoiceWeight[];
}

interface ChoiceWeight {
  personality_code: string;
  weight: number;
}

export function QuizQuestionsManagement() {
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
  const [displayedQuestions, setDisplayedQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPart, setSelectedPart] = useState<string>("all");
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<QuizQuestion | null>(null);
  const [viewingWeights, setViewingWeights] = useState<QuizQuestion | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<QuizQuestion | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  
  const ITEMS_PER_PAGE = 10;

  // Generate mock data for demonstration (50+ questions)
  useEffect(() => {
    const generateMockQuestions = (): QuizQuestion[] => {
      const questions: QuizQuestion[] = [];
      const parts: Array<"emotion" | "photo" | "preference"> = ["emotion", "photo", "preference"];
      const questionTypes: Array<"text" | "image"> = ["text", "image"];
      const personalityCodes = ["A1", "A2", "B1", "C1", "D1", "E1", "E2", "F1", "F2"];
      
      const questionTemplates = {
        emotion: [
          "당신이 가장 편안함을 느끼는 순간은 언제인가요?",
          "친구들과 함께할 때 당신의 모습은?",
          "스트레스를 받을 때 당신의 반응은?",
          "새로운 환경에 적응할 때 어떤 감정을 느끼나요?",
          "혼자 있는 시간에 대해 어떻게 생각하시나요?",
          "감정 표현에 있어 당신의 스타일은?",
          "갈등 상황에서 당신의 대처 방식은?",
          "행복을 느끼는 순간은 언제인가요?",
          "우울할 때 기분 전환 방법은?",
          "타인과의 관계에서 중요하게 생각하는 것은?"
        ],
        photo: [
          "다음 중 가장 매력적으로 느껴지는 사진 스타일은?",
          "인물 사진에서 중요하게 생각하는 요소는?",
          "촬영할 때 선호하는 구도는?",
          "사진의 색감에서 선호하는 톤은?",
          "포트레이트에서 가장 중요한 요소는?",
          "배경 선택 시 고려하는 요소는?",
          "조명에 대한 당신의 선호도는?",
          "사진의 분위기를 결정하는 요소는?",
          "편집 스타일에 대한 선호도는?",
          "사진 촬영 시 중요하게 생각하는 순간은?"
        ],
        preference: [
          "이상적인 촬영 시간대는?",
          "선호하는 촬영 장소는?",
          "촬영 시 입고 싶은 옷 스타일은?",
          "사진에 포함하고 싶은 소품은?",
          "촬영 분위기는 어떤 것을 선호하나요?",
          "사진 결과물에서 중요하게 생각하는 것은?",
          "촬영 과정에서 중요한 것은?",
          "완성된 사진의 용도는?",
          "촬영 시 동반하고 싶은 대상은?",
          "사진을 통해 표현하고 싶은 것은?"
        ]
      };

      const choiceTemplates = {
        emotion: [
          ["혼자만의 조용한 시간을 보낼 때", "가족이나 친구와 함께 있을 때", "새로운 사람들과 만날 때"],
          ["조용히 듣기만 하는 편", "대화를 적극적으로 이끌어감", "상황에 따라 유연하게 대응"],
          ["혼자 시간을 가지며 정리", "친구들과 대화하며 해소", "활동적인 것으로 스트레스 해소"],
          ["설렘과 기대감", "약간의 불안과 걱정", "호기심과 탐구욕"],
          ["꼭 필요한 소중한 시간", "때로는 필요하지만 길게는 힘듦", "가능하면 피하고 싶음"]
        ],
        photo: [
          ["따뜻한 자연광의 부드러운 인물 사진", "대비가 강한 흑백 예술 사진", "생동감 넘치는 컬러풀한 사진"],
          ["자연스러운 표정과 포즈", "독창적이고 예술적인 구도", "화려하고 역동적인 느낌"],
          ["정면을 바라보는 정적인 구도", "측면이나 각도가 있는 동적 구도", "자유로운 움직임이 담긴 구도"],
          ["따뜻하고 부드러운 파스텔 톤", "차가우면서 세련된 쿨톤", "선명하고 대비가 강한 비비드 톤"],
          ["자연스러운 미소와 눈빛", "개성있는 포즈와 제스처", "완벽한 조명과 구도"]
        ],
        preference: [
          ["황금시간대 (일출/일몰)", "밝은 대낮", "블루아워 (저녁 무렵)"],
          ["자연 속 야외 공간", "도시의 세련된 건물", "아늑한 실내 공간"],
          ["편안하고 자연스러운 일상복", "우아하고 단정한 정장 스타일", "개성있고 트렌디한 패션"],
          ["꽃이나 식물 등 자연 소품", "책이나 악기 등 취미 관련 소품", "액세서리나 패션 아이템"],
          ["조용하고 평화로운 분위기", "활기차고 에너지 넘치는 분위기", "신비롭고 드라마틱한 분위기"]
        ]
      };

      let idCounter = 1;
      let choiceIdCounter = 1;

      for (let i = 0; i < 50; i++) {
        const part = parts[i % parts.length];
        const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
        const templateIndex = Math.floor(Math.random() * questionTemplates[part].length);
        const choiceTemplate = choiceTemplates[part][Math.floor(Math.random() * choiceTemplates[part].length)];

        const choices: QuizChoice[] = choiceTemplate.map((choiceText, choiceIndex) => {
          const weights: ChoiceWeight[] = [];
          const numWeights = Math.floor(Math.random() * 3) + 2; // 2-4개의 가중치
          
          for (let w = 0; w < numWeights; w++) {
            const personality = personalityCodes[Math.floor(Math.random() * personalityCodes.length)];
            if (!weights.find(weight => weight.personality_code === personality)) {
              weights.push({
                personality_code: personality,
                weight: Math.floor(Math.random() * 3) + 1 // 1-3 가중치
              });
            }
          }

          return {
            id: choiceIdCounter++,
            choice_text: choiceText,
            choice_image_url: questionType === "image" ? `/quiz-images/choice-${choiceIdCounter}.jpg` : undefined,
            display_order: choiceIndex + 1,
            weights
          };
        });

        questions.push({
          id: idCounter++,
          question_text: questionTemplates[part][templateIndex],
          question_type: questionType,
          image_url: questionType === "image" ? `/quiz-images/question-${idCounter}.jpg` : undefined,
          part,
          display_order: i + 1,
          is_active: Math.random() > 0.1, // 90% 활성화
          choices
        });
      }

      return questions;
    };

    setTimeout(() => {
      const mockQuestions = generateMockQuestions();
      setAllQuestions(mockQuestions);
      setDisplayedQuestions(mockQuestions.slice(0, ITEMS_PER_PAGE));
      setLoading(false);
    }, 1000);
  }, []);

  // 필터링된 질문들
  const filteredQuestions = allQuestions.filter(question => {
    const matchesSearch = question.question_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPart = selectedPart === "all" || question.part === selectedPart;
    return matchesSearch && matchesPart;
  });

  // 무한 스크롤을 위한 표시할 질문들
  const displayQuestions = filteredQuestions.slice(0, currentPage * ITEMS_PER_PAGE);

  // 더 많은 데이터 로드 함수
  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    
    setLoadingMore(true);
    
    // 실제 API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const nextPage = currentPage + 1;
    const totalAvailable = filteredQuestions.length;
    const currentDisplayed = currentPage * ITEMS_PER_PAGE;
    
    if (currentDisplayed >= totalAvailable) {
      setHasMoreData(false);
    } else {
      setCurrentPage(nextPage);
    }
    
    setLoadingMore(false);
  };

  // 검색/필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
    setHasMoreData(true);
  }, [searchTerm, selectedPart]);

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >= 
        document.documentElement.offsetHeight &&
        !loadingMore &&
        hasMoreData
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMoreData, currentPage, filteredQuestions.length]);

  const handleCreateNew = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now(),
      question_text: "",
      question_type: "text",
      part: "emotion",
      display_order: questions.length + 1,
      is_active: true,
      choices: []
    };
    setEditingQuestion(newQuestion);
    setIsCreateMode(true);
  };

  const handleEdit = (question: QuizQuestion) => {
    setEditingQuestion({ ...question });
    setIsCreateMode(false);
  };

  const handleView = (question: QuizQuestion) => {
    setViewingQuestion(question);
  };

  const handleViewWeights = (question: QuizQuestion) => {
    setViewingWeights(question);
  };

  const handleSave = async () => {
    if (!editingQuestion) return;
    
    try {
      if (isCreateMode) {
        setAllQuestions(prev => [...prev, editingQuestion]);
      } else {
        setAllQuestions(prev => 
          prev.map(q => q.id === editingQuestion.id ? editingQuestion : q)
        );
      }
      setEditingQuestion(null);
      setIsCreateMode(false);
    } catch (error) {
      console.error("Error saving question:", error);
    }
  };

  const handleDelete = async (question: QuizQuestion) => {
    try {
      setAllQuestions(prev => prev.filter(q => q.id !== question.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  const updateEditingField = (field: keyof QuizQuestion, value: any) => {
    if (!editingQuestion) return;
    setEditingQuestion({ ...editingQuestion, [field]: value });
  };

  const addChoice = () => {
    if (!editingQuestion) return;
    const newChoice: QuizChoice = {
      id: Date.now(),
      choice_text: "",
      display_order: editingQuestion.choices.length + 1,
      weights: []
    };
    setEditingQuestion({
      ...editingQuestion,
      choices: [...editingQuestion.choices, newChoice]
    });
  };

  const updateChoice = (choiceIndex: number, field: keyof QuizChoice, value: any) => {
    if (!editingQuestion) return;
    const updatedChoices = editingQuestion.choices.map((choice, index) => 
      index === choiceIndex ? { ...choice, [field]: value } : choice
    );
    setEditingQuestion({ ...editingQuestion, choices: updatedChoices });
  };

  const removeChoice = (choiceIndex: number) => {
    if (!editingQuestion) return;
    const updatedChoices = editingQuestion.choices.filter((_, index) => index !== choiceIndex);
    setEditingQuestion({ ...editingQuestion, choices: updatedChoices });
  };

  const addWeight = (choiceIndex: number) => {
    if (!editingQuestion) return;
    const personalityCodes = ["A1", "A2", "B1", "C1", "D1", "E1", "E2", "F1", "F2"];
    const currentChoice = editingQuestion.choices[choiceIndex];
    const usedCodes = currentChoice.weights.map(w => w.personality_code);
    const availableCodes = personalityCodes.filter(code => !usedCodes.includes(code));
    
    if (availableCodes.length > 0) {
      const newWeight: ChoiceWeight = {
        personality_code: availableCodes[0],
        weight: 1
      };
      
      const updatedChoices = editingQuestion.choices.map((choice, index) => 
        index === choiceIndex 
          ? { ...choice, weights: [...choice.weights, newWeight] }
          : choice
      );
      setEditingQuestion({ ...editingQuestion, choices: updatedChoices });
    }
  };

  const updateWeight = (choiceIndex: number, weightIndex: number, field: keyof ChoiceWeight, value: any) => {
    if (!editingQuestion) return;
    const updatedChoices = editingQuestion.choices.map((choice, cIndex) => 
      cIndex === choiceIndex 
        ? {
            ...choice,
            weights: choice.weights.map((weight, wIndex) => 
              wIndex === weightIndex ? { ...weight, [field]: value } : weight
            )
          }
        : choice
    );
    setEditingQuestion({ ...editingQuestion, choices: updatedChoices });
  };

  const removeWeight = (choiceIndex: number, weightIndex: number) => {
    if (!editingQuestion) return;
    const updatedChoices = editingQuestion.choices.map((choice, cIndex) => 
      cIndex === choiceIndex 
        ? { ...choice, weights: choice.weights.filter((_, wIndex) => wIndex !== weightIndex) }
        : choice
    );
    setEditingQuestion({ ...editingQuestion, choices: updatedChoices });
  };

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question);
  };

  const handleSaveQuestion = () => {
    if (editingQuestion) {
      setQuestions(prev => 
        prev.map(q => q.id === editingQuestion.id ? editingQuestion : q)
      );
      setEditingQuestion(null);
    }
  };

  const getPartColor = (part: string) => {
    switch (part) {
      case "emotion": return "bg-blue-100 text-blue-800";
      case "photo": return "bg-green-100 text-green-800";
      case "preference": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPartName = (part: string) => {
    switch (part) {
      case "emotion": return "감정";
      case "photo": return "사진";
      case "preference": return "선호";
      default: return part;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {Array(5).fill(null).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">질문 관리</h3>
          <p className="text-sm text-muted-foreground">
            성향 진단 질문과 선택지를 관리하고 가중치를 설정합니다.
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          새 질문 추가
        </Button>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="질문 내용으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedPart === "all" ? "default" : "outline"}
                onClick={() => setSelectedPart("all")}
                size="sm"
              >
                전체
              </Button>
              <Button
                variant={selectedPart === "emotion" ? "default" : "outline"}
                onClick={() => setSelectedPart("emotion")}
                size="sm"
              >
                감정
              </Button>
              <Button
                variant={selectedPart === "photo" ? "default" : "outline"}
                onClick={() => setSelectedPart("photo")}
                size="sm"
              >
                사진
              </Button>
              <Button
                variant={selectedPart === "preference" ? "default" : "outline"}
                onClick={() => setSelectedPart("preference")}
                size="sm"
              >
                선호
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 질문 목록 */}
      <div className="space-y-4">
        {displayQuestions.map((question) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                    Q{question.display_order}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{question.question_text}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge className={getPartColor(question.part)}>
                        {getPartName(question.part)}
                      </Badge>
                      <Badge variant="outline">
                        {question.question_type === "image" ? (
                          <><Image className="h-3 w-3 mr-1" />이미지</>
                        ) : (
                          <><FileText className="h-3 w-3 mr-1" />텍스트</>
                        )}
                      </Badge>
                      <Badge variant={question.is_active ? "default" : "secondary"}>
                        {question.is_active ? "활성" : "비활성"}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleView(question)}
                    title="상세보기"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEdit(question)}
                    title="편집"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewWeights(question)}
                    title="가중치 보기"
                  >
                    <Weight className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteConfirm(question)}
                    title="삭제"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">선택지 ({question.choices.length}개)</p>
                  <div className="space-y-2">
                    {question.choices.map((choice, index) => (
                      <div key={choice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </div>
                          <span className="text-sm">{choice.choice_text}</span>
                          {choice.choice_image_url && (
                            <Badge variant="outline" className="text-xs">
                              <Image className="h-3 w-3 mr-1" />이미지
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          가중치 {choice.weights.length}개
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* 무한 스크롤 로딩 */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              <span className="text-sm text-muted-foreground">더 많은 질문을 불러오는 중...</span>
            </div>
          </div>
        )}
        
        {/* 더 이상 데이터가 없을 때 */}
        {!hasMoreData && displayQuestions.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">모든 질문을 불러왔습니다.</p>
          </div>
        )}
        
        {/* 필터링 결과가 없을 때 */}
        {displayQuestions.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-lg font-medium text-muted-foreground">질문이 없습니다</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm || selectedPart !== "all" 
                ? "검색 조건을 변경해보세요" 
                : "새 질문을 추가해보세요"}
            </p>
          </div>
        )}
      </div>

      {/* 질문 편집/생성 다이얼로그 */}
      <Dialog open={!!editingQuestion} onOpenChange={() => {setEditingQuestion(null); setIsCreateMode(false);}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? "새 질문 추가" : "질문 편집"}
            </DialogTitle>
            <DialogDescription>
              질문 내용과 선택지를 관리하고 성격유형별 가중치를 설정하세요.
            </DialogDescription>
          </DialogHeader>

          {editingQuestion && (
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">기본 정보</TabsTrigger>
                <TabsTrigger value="choices">선택지 관리</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="question_text">질문 내용</Label>
                  <Textarea
                    id="question_text"
                    value={editingQuestion.question_text}
                    onChange={(e) => updateEditingField('question_text', e.target.value)}
                    placeholder="질문을 입력하세요"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="part">파트</Label>
                    <select 
                      id="part"
                      value={editingQuestion.part}
                      onChange={(e) => updateEditingField('part', e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="emotion">감정</option>
                      <option value="photo">사진</option>
                      <option value="preference">선호</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="question_type">질문 타입</Label>
                    <select 
                      id="question_type"
                      value={editingQuestion.question_type}
                      onChange={(e) => updateEditingField('question_type', e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="text">텍스트</option>
                      <option value="image">이미지</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="display_order">표시 순서</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={editingQuestion.display_order}
                      onChange={(e) => updateEditingField('display_order', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {editingQuestion.question_type === "image" && (
                  <div>
                    <Label htmlFor="image_url">질문 이미지 URL</Label>
                    <Input
                      id="image_url"
                      value={editingQuestion.image_url || ""}
                      onChange={(e) => updateEditingField('image_url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editingQuestion.is_active}
                    onChange={(e) => updateEditingField('is_active', e.target.checked)}
                  />
                  <Label htmlFor="is_active">활성 상태</Label>
                </div>
              </TabsContent>

              <TabsContent value="choices" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">선택지 관리</h4>
                  <Button onClick={addChoice} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    선택지 추가
                  </Button>
                </div>

                <div className="space-y-4">
                  {editingQuestion.choices.map((choice, choiceIndex) => (
                    <Card key={choice.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">선택지 {choiceIndex + 1}</h5>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeChoice(choiceIndex)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div>
                          <Label>선택지 텍스트</Label>
                          <Input
                            value={choice.choice_text}
                            onChange={(e) => updateChoice(choiceIndex, 'choice_text', e.target.value)}
                            placeholder="선택지 내용을 입력하세요"
                          />
                        </div>

                        {editingQuestion.question_type === "image" && (
                          <div>
                            <Label>선택지 이미지 URL</Label>
                            <Input
                              value={choice.choice_image_url || ""}
                              onChange={(e) => updateChoice(choiceIndex, 'choice_image_url', e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <Label>가중치 설정</Label>
                            <Button 
                              onClick={() => addWeight(choiceIndex)} 
                              size="sm" 
                              variant="outline"
                              disabled={choice.weights.length >= 9}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              가중치 추가
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {choice.weights.map((weight, weightIndex) => (
                              <div key={weightIndex} className="flex items-center space-x-2 p-2 border rounded">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                                  {weight.personality_code}
                                </div>
                                <select
                                  value={weight.personality_code}
                                  onChange={(e) => updateWeight(choiceIndex, weightIndex, 'personality_code', e.target.value)}
                                  className="flex-1 p-1 border rounded text-sm"
                                >
                                  {["A1", "A2", "B1", "C1", "D1", "E1", "E2", "F1", "F2"].map(code => (
                                    <option key={code} value={code}>{code}</option>
                                  ))}
                                </select>
                                <select
                                  value={weight.weight}
                                  onChange={(e) => updateWeight(choiceIndex, weightIndex, 'weight', parseInt(e.target.value))}
                                  className="w-16 p-1 border rounded text-sm"
                                >
                                  <option value={1}>1</option>
                                  <option value={2}>2</option>
                                  <option value={3}>3</option>
                                </select>
                                <Button
                                  onClick={() => removeWeight(choiceIndex, weightIndex)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            
                            {choice.weights.length === 0 && (
                              <p className="text-xs text-muted-foreground p-2 border-dashed border rounded">
                                가중치가 설정되지 않았습니다. "가중치 추가" 버튼을 클릭하여 추가하세요.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {setEditingQuestion(null); setIsCreateMode(false);}}>
              취소
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 질문 상세보기 다이얼로그 */}
      <Dialog open={!!viewingQuestion} onOpenChange={() => setViewingQuestion(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                Q{viewingQuestion?.display_order}
              </div>
              <span>질문 상세보기</span>
            </DialogTitle>
            <DialogDescription>
              질문의 상세 정보와 선택지를 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {viewingQuestion && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-medium mb-2">질문 내용</h4>
                <p className="text-sm bg-gray-50 p-3 rounded">{viewingQuestion.question_text}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">파트:</span> {getPartName(viewingQuestion.part)}
                </div>
                <div>
                  <span className="font-medium">타입:</span> {viewingQuestion.question_type === "image" ? "이미지" : "텍스트"}
                </div>
                <div>
                  <span className="font-medium">표시 순서:</span> {viewingQuestion.display_order}
                </div>
                <div>
                  <span className="font-medium">상태:</span> 
                  <Badge className="ml-2" variant={viewingQuestion.is_active ? "default" : "secondary"}>
                    {viewingQuestion.is_active ? "활성" : "비활성"}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">선택지 ({viewingQuestion.choices.length}개)</h4>
                <div className="space-y-2">
                  {viewingQuestion.choices.map((choice, index) => (
                    <div key={choice.id} className="p-3 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </div>
                        <span className="font-medium">{choice.choice_text}</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-8">
                        가중치: {choice.weights.map(w => `${w.personality_code}(${w.weight})`).join(', ') || '설정되지 않음'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingQuestion(null)}>
              닫기
            </Button>
            {viewingQuestion && (
              <Button onClick={() => {
                setViewingQuestion(null);
                handleEdit(viewingQuestion);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                편집
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 가중치 시각화 다이얼로그 */}
      <Dialog open={!!viewingWeights} onOpenChange={() => setViewingWeights(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>가중치 시각화</span>
            </DialogTitle>
            <DialogDescription>
              각 선택지별 성격유형 가중치를 시각적으로 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {viewingWeights && (
            <div className="space-y-6 py-4">
              <div>
                <h4 className="font-medium mb-2">질문</h4>
                <p className="text-sm bg-gray-50 p-3 rounded">{viewingWeights.question_text}</p>
              </div>

              <div>
                <h4 className="font-medium mb-4">선택지별 가중치 분포</h4>
                <div className="space-y-4">
                  {viewingWeights.choices.map((choice, choiceIndex) => (
                    <Card key={choice.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                            {choiceIndex + 1}
                          </div>
                          <span className="font-medium">{choice.choice_text}</span>
                        </div>

                        {choice.weights.length > 0 ? (
                          <div className="space-y-2">
                            {choice.weights.map((weight) => (
                              <div key={weight.personality_code} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                                    {weight.personality_code}
                                  </div>
                                  <span className="text-sm">{weight.personality_code} 유형</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${(weight.weight / 3) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium w-8 text-right">
                                    {weight.weight}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground ml-8">
                            가중치가 설정되지 않았습니다.
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* 전체 가중치 요약 */}
              <div>
                <h4 className="font-medium mb-3">성격유형별 총 가중치</h4>
                <div className="grid grid-cols-3 gap-3">
                  {['A1', 'A2', 'B1', 'C1', 'D1', 'E1', 'E2', 'F1', 'F2'].map(code => {
                    const totalWeight = viewingWeights.choices.reduce((sum, choice) => {
                      const weight = choice.weights.find(w => w.personality_code === code);
                      return sum + (weight ? weight.weight : 0);
                    }, 0);
                    
                    return (
                      <div key={code} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                            {code}
                          </div>
                          <span className="text-sm">{code}</span>
                        </div>
                        <span className="font-medium">{totalWeight}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingWeights(null)}>
              닫기
            </Button>
            {viewingWeights && (
              <Button onClick={() => {
                setViewingWeights(null);
                handleEdit(viewingWeights);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                편집
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>질문 삭제</span>
            </DialogTitle>
            <DialogDescription>
              정말로 이 질문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          
          {deleteConfirm && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Q{deleteConfirm.display_order}: {deleteConfirm.question_text}</strong>를 삭제하면 
                관련된 모든 선택지와 가중치 데이터도 함께 삭제됩니다.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">총 질문 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredQuestions.length}</div>
            <p className="text-xs text-muted-foreground">
              활성 {filteredQuestions.filter(q => q.is_active).length}개
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">표시된 질문</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayQuestions.length}</div>
            <p className="text-xs text-muted-foreground">
              전체 {allQuestions.length}개 중
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">평균 선택지 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredQuestions.length > 0 ? 
                (filteredQuestions.reduce((sum, q) => sum + q.choices.length, 0) / filteredQuestions.length).toFixed(1) : 
                0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              질문당 평균
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">이미지 질문</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredQuestions.filter(q => q.question_type === "image").length}
            </div>
            <p className="text-xs text-muted-foreground">
              전체의 {filteredQuestions.length > 0 ? 
                ((filteredQuestions.filter(q => q.question_type === "image").length / filteredQuestions.length) * 100).toFixed(1) : 
                0
              }%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}