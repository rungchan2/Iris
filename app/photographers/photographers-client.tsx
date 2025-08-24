'use client'

import { useState, useMemo, useEffect } from 'react'
import { PhotographerCard } from '@/components/photographers/photographer-card'
import { PhotographerFilters } from '@/components/photographers/photographer-filters'
import { Button } from '@/components/ui/button'
import { Users, Search } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface PhotographerData {
  id: string
  name: string
  email: string
  created_at: string
  portfolioCount: number
  personality_type?: string | null
  directing_style?: string | null
  photography_approach?: string | null
  youtube_intro_url?: string | null
  profile_image_url?: string | null
  personalityTypes: Array<{
    code: string
    name: string
    compatibility: number
    isPrimary: boolean
    notes?: string
  }>
}

interface PersonalityType {
  code: string
  name: string
}

interface PhotographersClientProps {
  initialPhotographers: PhotographerData[]
  personalityTypes: PersonalityType[]
}

export function PhotographersClient({ 
  initialPhotographers, 
  personalityTypes 
}: PhotographersClientProps) {
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState({
    search: '',
    personalityCode: null as string | null,
    sortBy: 'name',
    personalityType: null as string | null,
    directingStyle: null as string | null,
    photographyApproach: null as string | null
  })

  // Initialize filters from URL parameters
  useEffect(() => {
    const personalityType = searchParams.get('personality_type')
    const directingStyle = searchParams.get('directing_style')
    const photographyApproach = searchParams.get('photography_approach')
    
    if (personalityType || directingStyle || photographyApproach) {
      setFilters(prev => ({
        ...prev,
        personalityType,
        directingStyle,
        photographyApproach
      }))
    }
  }, [searchParams])

  const filteredPhotographers = useMemo(() => {
    let filtered = [...initialPhotographers]

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(photographer =>
        photographer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        photographer.email.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Apply personality filter
    if (filters.personalityCode) {
      filtered = filtered.filter(photographer =>
        photographer.personalityTypes.some(pt => pt.code === filters.personalityCode)
      )
    }

    // Apply style filters from URL parameters
    if (filters.personalityType) {
      filtered = filtered.filter(photographer =>
        photographer.personality_type === filters.personalityType
      )
    }

    if (filters.directingStyle) {
      filtered = filtered.filter(photographer =>
        photographer.directing_style === filters.directingStyle
      )
    }

    if (filters.photographyApproach) {
      filtered = filtered.filter(photographer =>
        photographer.photography_approach === filters.photographyApproach
      )
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'portfolio':
        filtered.sort((a, b) => b.portfolioCount - a.portfolioCount)
        break
      case 'compatibility':
        filtered.sort((a, b) => {
          const aMaxCompat = Math.max(...a.personalityTypes.map(pt => pt.compatibility), 0)
          const bMaxCompat = Math.max(...b.personalityTypes.map(pt => pt.compatibility), 0)
          return bMaxCompat - aMaxCompat
        })
        break
      case 'experience':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'rating':
        filtered.sort((a, b) => b.portfolioCount - a.portfolioCount)
        break
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name))
    }

    return filtered
  }, [initialPhotographers, filters])

  const transformPhotographersForCard = (photographers: PhotographerData[]) => {
    return photographers.map(photographer => ({
      id: photographer.id,
      name: photographer.name,
      email: photographer.email,
      portfolioCount: photographer.portfolioCount,
      personalityTypes: photographer.personalityTypes,
      profileImage: photographer.profile_image_url || undefined,
      // Add mock data for display purposes
      rating: photographer.portfolioCount > 0 ? 4.5 + (photographer.id.charCodeAt(0) % 5) / 10 : undefined,
      reviewCount: photographer.portfolioCount > 0 ? Math.floor((photographer.id.charCodeAt(1) % 20)) + 5 : undefined,
      experience: Math.floor((new Date().getTime() - new Date(photographer.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)) + 1,
      location: '서울',
      bio: `${photographer.personalityTypes.find(pt => pt.isPrimary)?.name || '다양한'} 스타일 전문 작가입니다.`,
      specialties: photographer.personalityTypes.slice(0, 3).map(pt => pt.name)
    }))
  }

  const transformedPhotographers = transformPhotographersForCard(filteredPhotographers)

  if (initialPhotographers.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">아직 등록된 작가가 없습니다</h3>
        <p className="text-muted-foreground mb-6">
          곧 멋진 작가들이 합류할 예정입니다.
        </p>
        <Button asChild>
          <Link href="/quiz">
            성향 진단부터 시작하기
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white/50 backdrop-blur-sm border rounded-lg p-6">
        <PhotographerFilters
          personalityTypes={personalityTypes}
          onFiltersChange={(newFilters) => 
            setFilters(prev => ({ ...prev, ...newFilters }))
          }
        />
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">작가 목록</h2>
          <span className="text-muted-foreground">
            ({filteredPhotographers.length}명)
          </span>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {filters.personalityCode && (
            <div className="text-sm text-muted-foreground">
              {personalityTypes.find(pt => pt.code === filters.personalityCode)?.name} 전문 작가
            </div>
          )}
          {(filters.personalityType || filters.directingStyle || filters.photographyApproach) && (
            <div className="text-sm text-orange-600 font-medium">
              맞춤 추천 작가
            </div>
          )}
        </div>
      </div>

      {/* Photographers Grid */}
      {transformedPhotographers.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">검색 결과가 없습니다</h3>
          <p className="text-muted-foreground mb-6">
            다른 검색어나 필터를 시도해보세요.
          </p>
          <Button 
            variant="outline" 
            onClick={() => setFilters({ 
              search: '', 
              personalityCode: null, 
              sortBy: 'name',
              personalityType: null,
              directingStyle: null,
              photographyApproach: null
            })}
          >
            필터 초기화
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transformedPhotographers.map((photographer) => (
            <PhotographerCard key={photographer.id} photographer={photographer} />
          ))}
        </div>
      )}

      {/* Call to Action */}
      {transformedPhotographers.length > 0 && (
        <div className="text-center py-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">마음에 드는 작가를 찾지 못하셨나요?</h3>
          <p className="text-muted-foreground mb-6">
            성향 진단을 통해 나만의 맞춤 작가를 추천받아보세요
          </p>
          <Button asChild>
            <Link href="/quiz">
              성향 진단 시작하기
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}