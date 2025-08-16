"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Users, BarChart3, Settings, TrendingUp, FileText } from "lucide-react";
import { PersonalityTypesManagement } from "./personality-types-management";
import { QuizStatsDashboard } from "./quiz-stats-dashboard";
import { QuizQuestionsManagement } from "./quiz-questions-management";

export function PersonalityManagementDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            개요
          </TabsTrigger>
          <TabsTrigger value="personality-types" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            성격유형 관리
          </TabsTrigger>
          <TabsTrigger value="quiz-stats" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            진단 통계
          </TabsTrigger>
          <TabsTrigger value="quiz-questions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            질문 관리
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  총 진단 세션
                </CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% 지난 달 대비
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  완료된 진단
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">987</div>
                <p className="text-xs text-muted-foreground">
                  완료율 79.9%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  활성 성격유형
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">9</div>
                <p className="text-xs text-muted-foreground">
                  A1, A2, B1, C1, D1, E1, E2, F1, F2
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  평균 응답 시간
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2분</div>
                <p className="text-xs text-muted-foreground">
                  -0.3분 개선
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>인기 성격유형 분포</CardTitle>
                <CardDescription>
                  최근 30일간 진단 결과 분포
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: "A1", name: "고요한 관찰자", count: 234, percentage: 23.7 },
                    { type: "B1", name: "감성 기록자", count: 189, percentage: 19.1 },
                    { type: "C1", name: "시네마틱 몽상가", count: 156, percentage: 15.8 },
                    { type: "E1", name: "도시의 드리머", count: 142, percentage: 14.4 },
                    { type: "D1", name: "활력 가득 리더", count: 128, percentage: 13.0 }
                  ].map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                          {item.type}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.count}명</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.percentage}%</p>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>시스템 상태</CardTitle>
                <CardDescription>
                  성향 진단 시스템의 현재 상태
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Quiz API</span>
                    </div>
                    <span className="text-green-600 text-sm">정상</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Database</span>
                    </div>
                    <span className="text-green-600 text-sm">정상</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">AI Image Generation</span>
                    </div>
                    <span className="text-green-600 text-sm">정상</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium">질문 데이터</span>
                    </div>
                    <span className="text-yellow-600 text-sm">점검 필요</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personality-types">
          <PersonalityTypesManagement />
        </TabsContent>

        <TabsContent value="quiz-stats">
          <QuizStatsDashboard />
        </TabsContent>

        <TabsContent value="quiz-questions">
          <QuizQuestionsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}