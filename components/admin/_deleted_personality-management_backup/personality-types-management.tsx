"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Edit, Eye, Settings, Users, Image, Plus, Trash2, Save, X, AlertTriangle } from "lucide-react";
import { getAllPersonalityDetails } from "@/lib/actions/personality";

interface PersonalityType {
  code: string;
  name: string;
  description: string;
  example_person: string;
  style_keywords: string[];
  recommended_locations: string[];
  recommended_props: string[];
  ai_preview_prompt: string;
  representative_image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function PersonalityTypesManagement() {
  const [personalityTypes, setPersonalityTypes] = useState<PersonalityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<PersonalityType | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<PersonalityType | null>(null);
  const [viewType, setViewType] = useState<PersonalityType | null>(null);

  useEffect(() => {
    const loadPersonalityTypes = async () => {
      try {
        const result = await getAllPersonalityDetails();
        if (result.success && result.personalityTypes) {
          setPersonalityTypes(result.personalityTypes.map(type => ({
            code: type.code,
            name: type.name,
            description: type.description || '',
            example_person: type.example_person || '',
            representative_image_url: '/placeholder-personality.jpg', // Use placeholder for now
            style_keywords: [], // Will be populated when database schema is extended
            recommended_locations: [], // Will be populated when database schema is extended
            recommended_props: [], // Will be populated when database schema is extended
            ai_preview_prompt: type.ai_preview_prompt || '',
            display_order: type.display_order || 0,
            is_active: type.is_active ?? true,
            created_at: type.created_at || new Date().toISOString(),
            updated_at: type.updated_at || new Date().toISOString()
          })));
        }
      } catch (error) {
        console.error("Error loading personality types:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPersonalityTypes();
  }, []);

  const handleCreateNew = () => {
    const newType: PersonalityType = {
      code: "",
      name: "",
      description: "",
      example_person: "",
      style_keywords: [],
      recommended_locations: [],
      recommended_props: [],
      ai_preview_prompt: "",
      representative_image_url: "",
      display_order: personalityTypes.length + 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setEditingType(newType);
    setIsCreateMode(true);
  };

  const handleEdit = (type: PersonalityType) => {
    setEditingType({ ...type });
    setIsCreateMode(false);
  };

  const handleView = (type: PersonalityType) => {
    setViewType(type);
  };

  const handleSave = async () => {
    if (!editingType) return;
    
    try {
      if (isCreateMode) {
        // TODO: 새 성격유형 생성 API 호출
        setPersonalityTypes(prev => [...prev, editingType]);
      } else {
        // TODO: 성격유형 업데이트 API 호출
        setPersonalityTypes(prev => 
          prev.map(type => type.code === editingType.code ? editingType : type)
        );
      }
      setEditingType(null);
      setIsCreateMode(false);
    } catch (error) {
      console.error("Error saving personality type:", error);
    }
  };

  const handleDelete = async (type: PersonalityType) => {
    try {
      // TODO: 성격유형 삭제 API 호출
      setPersonalityTypes(prev => prev.filter(t => t.code !== type.code));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting personality type:", error);
    }
  };

  const updateEditingField = (field: keyof PersonalityType, value: any) => {
    if (!editingType) return;
    setEditingType({ ...editingType, [field]: value });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(9).fill(null).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
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
          <h3 className="text-lg font-medium">성격유형 관리</h3>
          <p className="text-sm text-muted-foreground">
            9가지 성격유형의 정보를 관리하고 편집할 수 있습니다.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            새 성격유형 추가
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            전체 설정
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {personalityTypes.map((type) => (
          <Card key={type.code} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                    {type.code}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{type.name}</CardTitle>
                    <CardDescription>{type.code} 유형</CardDescription>
                  </div>
                </div>
                <Badge variant={type.is_active ? "default" : "secondary"}>
                  {type.is_active ? "활성" : "비활성"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">설명</p>
                <p className="text-sm leading-relaxed line-clamp-2">
                  {type.description}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">스타일 키워드</p>
                <div className="flex flex-wrap gap-1">
                  {type.style_keywords?.slice(0, 3).map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                  {type.style_keywords?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{type.style_keywords.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">추천 장소</p>
                <p className="text-xs text-gray-600 line-clamp-1">
                  {type.recommended_locations?.join(", ")}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  표시 순서: {type.display_order}
                </div>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleView(type)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEdit(type)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteConfirm(type)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>성격유형 통계</CardTitle>
          <CardDescription>각 성격유형별 상세 통계 정보</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {personalityTypes.map((type) => (
              <div key={type.code} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                    {type.code}
                  </div>
                  <div>
                    <p className="font-medium">{type.name}</p>
                    <p className="text-sm text-muted-foreground">
                      키워드 {type.style_keywords?.length || 0}개 | 
                      장소 {type.recommended_locations?.length || 0}개 | 
                      소품 {type.recommended_props?.length || 0}개
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm font-medium">진단 결과</p>
                    <p className="text-xs text-muted-foreground">156회</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">매칭 작가</p>
                    <p className="text-xs text-muted-foreground">3명</p>
                  </div>
                  <Badge variant={type.is_active ? "default" : "secondary"}>
                    {type.is_active ? "활성" : "비활성"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 편집/생성 다이얼로그 */}
      <Dialog open={!!editingType} onOpenChange={() => {setEditingType(null); setIsCreateMode(false);}}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? "새 성격유형 추가" : "성격유형 편집"}
            </DialogTitle>
            <DialogDescription>
              성격유형의 상세 정보를 입력하고 관리하세요.
            </DialogDescription>
          </DialogHeader>
          
          {editingType && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">성격유형 코드</Label>
                  <Input
                    id="code"
                    value={editingType.code}
                    onChange={(e) => updateEditingField('code', e.target.value)}
                    placeholder="예: A1, B1, C1"
                    disabled={!isCreateMode}
                  />
                </div>
                <div>
                  <Label htmlFor="name">성격유형 이름</Label>
                  <Input
                    id="name"
                    value={editingType.name}
                    onChange={(e) => updateEditingField('name', e.target.value)}
                    placeholder="예: 고요한 관찰자"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={editingType.description}
                  onChange={(e) => updateEditingField('description', e.target.value)}
                  placeholder="성격유형에 대한 상세 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="example_person">예시 인물</Label>
                <Input
                  id="example_person"
                  value={editingType.example_person}
                  onChange={(e) => updateEditingField('example_person', e.target.value)}
                  placeholder="예: 혜진, 민수"
                />
              </div>

              <div>
                <Label htmlFor="style_keywords">스타일 키워드 (쉼표로 구분)</Label>
                <Input
                  id="style_keywords"
                  value={editingType.style_keywords?.join(', ')}
                  onChange={(e) => updateEditingField('style_keywords', e.target.value.split(',').map(k => k.trim()))}
                  placeholder="예: 자연스러운, 따뜻한, 부드러운"
                />
              </div>

              <div>
                <Label htmlFor="recommended_locations">추천 장소 (쉼표로 구분)</Label>
                <Input
                  id="recommended_locations"
                  value={editingType.recommended_locations?.join(', ')}
                  onChange={(e) => updateEditingField('recommended_locations', e.target.value.split(',').map(l => l.trim()))}
                  placeholder="예: 카페, 공원, 도서관"
                />
              </div>

              <div>
                <Label htmlFor="recommended_props">추천 소품 (쉼표로 구분)</Label>
                <Input
                  id="recommended_props"
                  value={editingType.recommended_props?.join(', ')}
                  onChange={(e) => updateEditingField('recommended_props', e.target.value.split(',').map(p => p.trim()))}
                  placeholder="예: 책, 꽃, 악세서리"
                />
              </div>

              <div>
                <Label htmlFor="ai_preview_prompt">AI 미리보기 프롬프트</Label>
                <Textarea
                  id="ai_preview_prompt"
                  value={editingType.ai_preview_prompt}
                  onChange={(e) => updateEditingField('ai_preview_prompt', e.target.value)}
                  placeholder="AI 이미지 생성을 위한 프롬프트를 입력하세요"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_order">표시 순서</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={editingType.display_order}
                    onChange={(e) => updateEditingField('display_order', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="representative_image_url">대표 이미지 URL</Label>
                  <Input
                    id="representative_image_url"
                    value={editingType.representative_image_url}
                    onChange={(e) => updateEditingField('representative_image_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingType.is_active}
                  onChange={(e) => updateEditingField('is_active', e.target.checked)}
                />
                <Label htmlFor="is_active">활성 상태</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {setEditingType(null); setIsCreateMode(false);}}>
              취소
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 보기 다이얼로그 */}
      <Dialog open={!!viewType} onOpenChange={() => setViewType(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                {viewType?.code}
              </div>
              <span>{viewType?.name}</span>
            </DialogTitle>
            <DialogDescription>
              성격유형 상세 정보
            </DialogDescription>
          </DialogHeader>
          
          {viewType && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-medium mb-2">설명</h4>
                <p className="text-sm text-muted-foreground">{viewType.description}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">예시 인물</h4>
                <p className="text-sm">{viewType.example_person}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">스타일 키워드</h4>
                <div className="flex flex-wrap gap-1">
                  {viewType.style_keywords?.map((keyword, index) => (
                    <Badge key={index} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">추천 장소</h4>
                <p className="text-sm text-muted-foreground">
                  {viewType.recommended_locations?.join(', ')}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">추천 소품</h4>
                <p className="text-sm text-muted-foreground">
                  {viewType.recommended_props?.join(', ')}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">AI 미리보기 프롬프트</h4>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                  {viewType.ai_preview_prompt}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">표시 순서:</span> {viewType.display_order}
                </div>
                <div>
                  <span className="font-medium">상태:</span> 
                  <Badge className="ml-2" variant={viewType.is_active ? "default" : "secondary"}>
                    {viewType.is_active ? "활성" : "비활성"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewType(null)}>
              닫기
            </Button>
            {viewType && (
              <Button onClick={() => {
                setViewType(null);
                handleEdit(viewType);
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
              <span>성격유형 삭제</span>
            </DialogTitle>
            <DialogDescription>
              정말로 이 성격유형을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          
          {deleteConfirm && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{deleteConfirm.code} - {deleteConfirm.name}</strong>을(를) 삭제하면 
                관련된 모든 진단 데이터와 매칭 정보도 함께 삭제됩니다.
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
    </div>
  );
}