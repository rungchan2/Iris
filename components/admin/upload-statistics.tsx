"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, HardDrive, BarChart3, TrendingUp } from "lucide-react"

interface Statistics {
  totalPhotos: number
  totalSizeMB: number
  averageSizeKB: number
  photosThisMonth: number
}

interface UploadStatisticsProps {
  statistics: Statistics
}

export function UploadStatistics({ statistics }: UploadStatisticsProps) {
  const formatFileSize = (sizeInMB: number): string => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(2)} GB`
    }
    return `${sizeInMB.toFixed(2)} MB`
  }

  const formatAverageSize = (sizeInKB: number): string => {
    if (sizeInKB >= 1024) {
      return `${(sizeInKB / 1024).toFixed(1)} MB`
    }
    return `${sizeInKB.toFixed(0)} KB`
  }

  const stats = [
    {
      title: "총 사진",
      value: statistics.totalPhotos.toLocaleString(),
      icon: ImageIcon,
      description: "업로드된 사진",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "사용 공간",
      value: formatFileSize(statistics.totalSizeMB),
      icon: HardDrive,
      description: "총 사용 공간",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "평균 크기",
      value: formatAverageSize(statistics.averageSizeKB),
      icon: BarChart3,
      description: "평균 사진 크기",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "이번 달",
      value: statistics.photosThisMonth.toLocaleString(),
      icon: TrendingUp,
      description: "업로드된 사진",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          업로드 통계
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {stats.map((stat) => (
            <div key={stat.title} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.title === "This Month" && statistics.photosThisMonth > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      활성
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Insights */}
        {statistics.totalPhotos > 0 && (
          <div className="mt-6 pt-6 border-t space-y-3">
            <h4 className="text-sm font-medium">빠른 인사이트</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {statistics.totalSizeMB > 1024 && <p>• 1GB 이상의 저장 공간을 사용하고 있습니다</p>}
              {statistics.photosThisMonth > 10 && (
                <p>• 이번 달에 {statistics.photosThisMonth}개의 사진을 업로드했습니다</p>
              )}
              {statistics.averageSizeKB > 1024 && <p>• 평균 사진 크기가 1MB 이상입니다</p>}
              {statistics.totalPhotos > 100 && <p>• 총 100개 이상의 사진을 업로드했습니다</p>}
            </div>
          </div>
        )}

        {/* Empty State */}
        {statistics.totalPhotos === 0 && (
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">아직 사진이 없습니다. 업로드를 시작하여 통계를 확인하세요!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
