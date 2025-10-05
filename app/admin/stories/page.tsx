import { Metadata } from 'next'
import StoryManagement from '@/components/admin/story-management'

export const metadata: Metadata = {
  title: '사연 관리 - 관리자',
  description: '사연 검토 및 관리',
}

export default function StoriesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">사연 관리</h2>
      </div>
      <StoryManagement />
    </div>
  )
}
