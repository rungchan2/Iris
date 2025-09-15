"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users,
  Target,
  Star,
  Heart,
  Brain,
  Palette,
  Mountain,
  Camera,
  Sparkles,
  Save,
  Edit,
  Plus,
  AlertCircle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Settings
} from "lucide-react";
import { 
  getPersonalityTypes,
  getAdminPersonalityMappings,
  updatePersonalityMapping,
  createPersonalityMapping,
  type PersonalityType,
  type PersonalityMapping 
} from "@/lib/actions/personality-mapping";

export function PersonalityMappingManagement() {
  const [personalityTypes, setPersonalityTypes] = useState<PersonalityType[]>([]);
  const [mappings, setMappings] = useState<PersonalityMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMapping, setEditingMapping] = useState<PersonalityMapping | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 성격유형별 아이콘 매핑
  const getPersonalityIcon = (code: string) => {
    const iconMap: Record<string, any> = {
      'A1': Users,     // 고요한 관찰자
      'A2': Heart,     // 따뜻한 동행자
      'B1': Camera,    // 감성 기록자
      'C1': Sparkles,  // 시네마틱 몽상가
      'D1': Star,      // 활력 가득 리더
      'E1': Mountain,  // 도시의 드리머
      'E2': Palette,   // 무심한 예술가
      'F1': Target,    // 자유로운 탐험가
      'F2': Brain      // 감각적 실험가
    };
    return iconMap[code] || Users;
  };

  // 호환성 점수별 색상
  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 70) return "text-blue-600 bg-blue-50";
    if (score >= 50) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [typesResult, mappingsResult] = await Promise.all([
        getPersonalityTypes(),
        getAdminPersonalityMappings()
      ]);

      if (typesResult.success) {
        setPersonalityTypes(typesResult.personalityTypes || []);
      } else {
        setError(typesResult.error || '성격유형 데이터를 불러오는데 실패했습니다.');
      }

      if (mappingsResult.success) {
        setMappings(mappingsResult.mappings || []);
      } else {
        setError(mappingsResult.error || '매칭 데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 매칭 설정 저장
  const handleSaveMapping = async () => {
    if (!editingMapping) return;
    
    try {
      const result = editingMapping.id 
        ? await updatePersonalityMapping(editingMapping.id, {
            compatibility_score: editingMapping.compatibility_score,
            is_primary: editingMapping.is_primary,
            notes: editingMapping.notes
          })
        : await createPersonalityMapping({
            admin_id: editingMapping.admin_id,
            personality_type_code: editingMapping.personality_type_code,
            compatibility_score: editingMapping.compatibility_score,
            is_primary: editingMapping.is_primary,
            notes: editingMapping.notes
          });

      if (result.success) {
        await loadData();
        setEditingMapping(null);
      } else {
        setError(result.error || '매칭 설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving mapping:', error);
      setError('매칭 설정 저장 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 작가별 매칭 현황 요약
  const adminMappingSummary = mappings.reduce((acc, mapping) => {
    if (!acc[mapping.admin_id]) {
      acc[mapping.admin_id] = {
        admin_name: mapping.admin_name,
        total_mappings: 0,
        primary_types: 0,
        avg_compatibility: 0,
        mappings: []
      };
    }
    
    acc[mapping.admin_id].total_mappings++;
    if (mapping.is_primary) acc[mapping.admin_id].primary_types++;
    acc[mapping.admin_id].mappings.push(mapping);
    
    return acc;
  }, {} as Record<string, {
    admin_name: string;
    total_mappings: number;
    primary_types: number;
    avg_compatibility: number;
    mappings: PersonalityMapping[];
  }>);

  // 평균 호환성 점수 계산
  Object.values(adminMappingSummary).forEach(admin => {
    admin.avg_compatibility = admin.mappings.reduce((sum, m) => sum + m.compatibility_score, 0) / admin.mappings.length;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(null).map((_, index) => (
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

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button onClick={loadData} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 전체 통계 요약 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 작가 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(adminMappingSummary).length}</div>
            <p className="text-xs text-muted-foreground">매칭 설정된 작가</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매칭 수</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mappings.length}</div>
            <p className="text-xs text-muted-foreground">설정된 매칭</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 호환성</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mappings.length > 0 
                ? Math.round(mappings.reduce((sum, m) => sum + m.compatibility_score, 0) / mappings.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">전체 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">주력 유형</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mappings.filter(m => m.is_primary).length}
            </div>
            <p className="text-xs text-muted-foreground">주력 담당 설정</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="by-admin" className="space-y-6">
        <TabsList>
          <TabsTrigger value="by-admin">작가별 관리</TabsTrigger>
          <TabsTrigger value="by-personality">성격유형별 관리</TabsTrigger>
          <TabsTrigger value="analytics">분석 대시보드</TabsTrigger>
        </TabsList>

        {/* 작가별 매칭 관리 */}
        <TabsContent value="by-admin" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(adminMappingSummary).map(([adminId, admin]) => (
              <Card key={adminId} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{admin.admin_name}</CardTitle>
                      <CardDescription>
                        {admin.total_mappings}개 유형 매칭
                      </CardDescription>
                    </div>
                    <Badge variant={admin.primary_types > 0 ? "default" : "secondary"}>
                      주력 {admin.primary_types}개
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>평균 호환성</span>
                      <span className="font-medium">{Math.round(admin.avg_compatibility)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(admin.avg_compatibility, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">담당 성격유형</h4>
                    <div className="flex flex-wrap gap-1">
                      {admin.mappings.map((mapping) => {
                        const Icon = getPersonalityIcon(mapping.personality_type_code);
                        return (
                          <Badge 
                            key={mapping.personality_type_code}
                            variant={mapping.is_primary ? "default" : "outline"}
                            className="text-xs"
                          >
                            <Icon className="h-3 w-3 mr-1" />
                            {mapping.personality_type_code}
                            <span className="ml-1">{mapping.compatibility_score}%</span>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2 border-t">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedAdmin(adminId)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      관리
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        // 새로운 매칭 추가
                        if (mounted) {
                          setEditingMapping({
                            id: '',
                            admin_id: adminId,
                            admin_name: admin.admin_name,
                            personality_type_code: 'A1',
                            compatibility_score: 50,
                            is_primary: false,
                            notes: '',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          });
                        }
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      추가
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 성격유형별 매칭 관리 */}
        <TabsContent value="by-personality" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personalityTypes.map((type) => {
              const Icon = getPersonalityIcon(type.code);
              const typeMappings = mappings.filter(m => m.personality_type_code === type.code);
              const avgCompatibility = typeMappings.length > 0 
                ? typeMappings.reduce((sum, m) => sum + m.compatibility_score, 0) / typeMappings.length
                : 0;

              return (
                <Card key={type.code}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{type.code}</CardTitle>
                        <CardDescription className="text-sm">{type.name}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">담당 작가</p>
                        <p className="font-medium">{typeMappings.length}명</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">평균 호환성</p>
                        <p className="font-medium">{Math.round(avgCompatibility)}%</p>
                      </div>
                    </div>

                    {typeMappings.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">담당 작가 목록</h4>
                        <div className="space-y-1">
                          {typeMappings.map((mapping) => (
                            <div key={mapping.id} className="flex items-center justify-between text-xs">
                              <span>{mapping.admin_name}</span>
                              <div className="flex items-center space-x-1">
                                {mapping.is_primary && <Star className="h-3 w-3 text-yellow-500" />}
                                <Badge variant="outline" className="text-xs">
                                  {mapping.compatibility_score}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 분석 대시보드 */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  성격유형별 작가 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {personalityTypes.map((type) => {
                    const Icon = getPersonalityIcon(type.code);
                    const count = mappings.filter(m => m.personality_type_code === type.code).length;
                    const percentage = mappings.length > 0 ? (count / mappings.length) * 100 : 0;
                    
                    return (
                      <div key={type.code} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{type.code}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  호환성 점수 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: '90% 이상', min: 90, max: 100, color: 'bg-green-500' },
                    { label: '70-89%', min: 70, max: 89, color: 'bg-blue-500' },
                    { label: '50-69%', min: 50, max: 69, color: 'bg-yellow-500' },
                    { label: '50% 미만', min: 0, max: 49, color: 'bg-red-500' }
                  ].map((range) => {
                    const count = mappings.filter(
                      m => m.compatibility_score >= range.min && m.compatibility_score <= range.max
                    ).length;
                    const percentage = mappings.length > 0 ? (count / mappings.length) * 100 : 0;
                    
                    return (
                      <div key={range.label} className="flex items-center justify-between">
                        <span className="text-sm">{range.label}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${range.color} h-2 rounded-full`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 매칭 편집 다이얼로그 */}
      <Dialog open={!!editingMapping} onOpenChange={() => setEditingMapping(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>성격유형 매칭 설정</DialogTitle>
            <DialogDescription>
              {editingMapping?.admin_name}의 성격유형별 호환성을 설정하세요.
            </DialogDescription>
          </DialogHeader>
          
          {editingMapping && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>성격유형</Label>
                <select 
                  className="w-full p-2 border rounded"
                  value={editingMapping.personality_type_code}
                  onChange={(e) => setEditingMapping({
                    ...editingMapping,
                    personality_type_code: e.target.value
                  })}
                >
                  {personalityTypes.map((type) => (
                    <option key={type.code} value={type.code}>
                      {type.code} - {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>호환성 점수: {editingMapping.compatibility_score}%</Label>
                <Slider
                  value={[editingMapping.compatibility_score]}
                  onValueChange={([value]) => setEditingMapping({
                    ...editingMapping,
                    compatibility_score: value
                  })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={editingMapping.is_primary}
                  onChange={(e) => setEditingMapping({
                    ...editingMapping,
                    is_primary: e.target.checked
                  })}
                />
                <Label htmlFor="is_primary">주력 담당 유형으로 설정</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">매칭 노트</Label>
                <Textarea
                  id="notes"
                  value={editingMapping.notes || ''}
                  onChange={(e) => setEditingMapping({
                    ...editingMapping,
                    notes: e.target.value
                  })}
                  placeholder="이 성격유형에 대한 작가의 특별한 경험이나 노하우를 입력하세요..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMapping(null)}>
              취소
            </Button>
            <Button onClick={handleSaveMapping}>
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}