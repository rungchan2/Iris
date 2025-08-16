'use client'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Star, Calendar, MapPin, Eye } from 'lucide-react'
import Link from 'next/link'

interface PhotographerCardProps {
  photographer: {
    id: string
    name: string
    email: string
    profileImage?: string
    bio?: string
    experience?: number
    location?: string
    specialties?: string[]
    rating?: number
    reviewCount?: number
    portfolioCount?: number
    personalityTypes?: Array<{
      code: string
      name: string
      compatibility?: number
      isPrimary?: boolean
    }>
  }
}

export function PhotographerCard({ photographer }: PhotographerCardProps) {
  const initials = photographer.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const primaryPersonality = photographer.personalityTypes?.find(p => p.isPrimary)

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4 mb-3">
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-gray-100">
              <AvatarImage src={photographer.profileImage} />
              <AvatarFallback className="text-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            {photographer.rating && (
              <div className="absolute -top-1 -right-1 bg-yellow-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5 text-xs">
                <Star className="w-2.5 h-2.5 fill-current" />
                <span>{photographer.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1">{photographer.name}</h3>
            {photographer.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="w-3 h-3" />
                <span>{photographer.location}</span>
              </div>
            )}
            
            {primaryPersonality && (
              <Badge variant="default" className="text-xs">
                {primaryPersonality.code}: {primaryPersonality.name}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          {photographer.experience && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{photographer.experience}년</span>
            </div>
          )}
          {photographer.portfolioCount !== undefined && (
            <div className="flex items-center gap-1">
              <Camera className="w-3 h-3" />
              <span>{photographer.portfolioCount}개</span>
            </div>
          )}
          {photographer.reviewCount && (
            <span className="text-xs">리뷰 {photographer.reviewCount}개</span>
          )}
        </div>

        {photographer.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {photographer.bio}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/photographers/${photographer.id}`}>
            <Eye className="w-4 h-4" />
          </Link>
        </Button>
        <Button className="flex-1" asChild>
          <Link href={`/photographers/${photographer.id}/booking`}>
            예약하기
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}