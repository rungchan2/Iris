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
      title: "Total Photos",
      value: statistics.totalPhotos.toLocaleString(),
      icon: ImageIcon,
      description: "Photos uploaded",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Storage Used",
      value: formatFileSize(statistics.totalSizeMB),
      icon: HardDrive,
      description: "Total storage consumed",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Average Size",
      value: formatAverageSize(statistics.averageSizeKB),
      icon: BarChart3,
      description: "Per photo average",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "This Month",
      value: statistics.photosThisMonth.toLocaleString(),
      icon: TrendingUp,
      description: "Photos uploaded",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Upload Statistics
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
                      Active
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
            <h4 className="text-sm font-medium">Quick Insights</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {statistics.totalSizeMB > 1024 && <p>• You're using over 1 GB of storage space</p>}
              {statistics.photosThisMonth > 10 && (
                <p>• Very active this month with {statistics.photosThisMonth} uploads</p>
              )}
              {statistics.averageSizeKB > 1024 && <p>• Your photos average over 1 MB in size</p>}
              {statistics.totalPhotos > 100 && <p>• You've uploaded over 100 photos total</p>}
            </div>
          </div>
        )}

        {/* Empty State */}
        {statistics.totalPhotos === 0 && (
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No photos uploaded yet. Start uploading to see your statistics!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
