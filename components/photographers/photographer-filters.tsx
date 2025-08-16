'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface PersonalityType {
  code: string
  name: string
}

interface PhotographerFiltersProps {
  personalityTypes: PersonalityType[]
  onFiltersChange: (filters: {
    search: string
    personalityCode: string | null
    sortBy: string
  }) => void
}

export function PhotographerFilters({ 
  personalityTypes, 
  onFiltersChange 
}: PhotographerFiltersProps) {
  const [search, setSearch] = useState('')
  const [selectedPersonality, setSelectedPersonality] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('name')

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onFiltersChange({
      search: value,
      personalityCode: selectedPersonality,
      sortBy,
    })
  }

  const handlePersonalityChange = (value: string) => {
    const newValue = value === 'all' ? null : value
    setSelectedPersonality(newValue)
    onFiltersChange({
      search,
      personalityCode: newValue,
      sortBy,
    })
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    onFiltersChange({
      search,
      personalityCode: selectedPersonality,
      sortBy: value,
    })
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedPersonality(null)
    setSortBy('name')
    onFiltersChange({
      search: '',
      personalityCode: null,
      sortBy: 'name',
    })
  }

  const hasActiveFilters = search || selectedPersonality || sortBy !== 'name'

  return (
    <div className="space-y-4">
      {/* Desktop Filters */}
      <div className="hidden md:flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="작가 이름으로 검색..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedPersonality || 'all'} onValueChange={handlePersonalityChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="성격유형 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 성격유형</SelectItem>
              {personalityTypes.map((type) => (
                <SelectItem key={type.code} value={type.code}>
                  {type.code}: {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="정렬 기준" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">이름순</SelectItem>
              <SelectItem value="rating">평점순</SelectItem>
              <SelectItem value="experience">경력순</SelectItem>
              <SelectItem value="portfolio">포트폴리오순</SelectItem>
              <SelectItem value="compatibility">호환성순</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">적용된 필터:</span>
            {search && (
              <Badge variant="secondary">
                검색: {search}
                <button
                  onClick={() => handleSearchChange('')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedPersonality && (
              <Badge variant="secondary">
                성격유형: {selectedPersonality}
                <button
                  onClick={() => handlePersonalityChange('all')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {sortBy !== 'name' && (
              <Badge variant="secondary">
                정렬: {sortBy === 'rating' ? '평점순' : 
                      sortBy === 'experience' ? '경력순' : 
                      sortBy === 'portfolio' ? '포트폴리오순' : '호환성순'}
                <button
                  onClick={() => handleSortChange('name')}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Mobile Filters */}
      <div className="md:hidden flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="작가 검색..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>필터 옵션</SheetTitle>
              <SheetDescription>
                원하는 조건으로 작가를 찾아보세요
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>성격유형</Label>
                <Select value={selectedPersonality || 'all'} onValueChange={handlePersonalityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="성격유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 성격유형</SelectItem>
                    {personalityTypes.map((type) => (
                      <SelectItem key={type.code} value={type.code}>
                        {type.code}: {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>정렬 기준</Label>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="정렬 기준" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">이름순</SelectItem>
                    <SelectItem value="rating">평점순</SelectItem>
                    <SelectItem value="experience">경력순</SelectItem>
                    <SelectItem value="portfolio">포트폴리오순</SelectItem>
                    <SelectItem value="compatibility">호환성순</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={clearFilters}
                >
                  필터 초기화
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}