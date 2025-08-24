'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Star, 
  MapPin, 
  Camera, 
  Calendar, 
  Phone, 
  Mail, 
  ArrowLeft,
  Share2,
  Copy,
  Check,
  PlayCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import {
  FacebookShareButton,
  TwitterShareButton,
  LineShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LineIcon,
  WhatsappIcon,
} from 'react-share'
import { YouTubeModal } from '@/components/ui/youtube-modal'

interface PhotographerProfileProps {
  photographer: any
}

export function PhotographerProfile({ photographer }: PhotographerProfileProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<{ id: string | null; title: string }>({ id: null, title: '' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareTitle = `${photographer.name} 작가님의 프로필 | Iris`
  const shareDescription = `${photographer.name} 작가님의 멋진 포트폴리오를 확인해보세요!`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const extractYouTubeId = (url: string | null | undefined): string | null => {
    if (!url) return null
    
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    return null
  }

  const handleVideoClick = () => {
    const videoId = extractYouTubeId(photographer.youtube_intro_url)
    if (videoId) {
      setSelectedVideo({ id: videoId, title: `${photographer.name} 소개 영상` })
      setIsModalOpen(true)
    }
  }
  
  const initials = photographer.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  const portfolioPhotos = photographer.admin_portfolio_photos || []
  const personalityMappings = photographer.personality_admin_mapping || []
  const primaryPersonality = personalityMappings.find((m: any) => m.is_primary)
  const compatiblePersonalities = personalityMappings.filter((m: any) => !m.is_primary)

  // Mock data for display
  const experience = Math.floor((new Date().getTime() - new Date(photographer.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)) + 1
  const rating = portfolioPhotos.length > 0 ? 4.5 + (photographer.id.charCodeAt(0) % 5) / 10 : undefined
  const reviewCount = portfolioPhotos.length > 0 ? Math.floor((photographer.id.charCodeAt(1) % 20)) + 5 : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/photographers">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  목록으로
                </Link>
              </Button>
              <div className="flex gap-2 ml-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      공유
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="end">
                    <div className="flex flex-col gap-2">
                      <div className="text-sm font-medium mb-2">프로필 공유하기</div>
                      <div className="flex gap-2">
                        <FacebookShareButton url={shareUrl} title={shareTitle}>
                          <FacebookIcon size={32} round />
                        </FacebookShareButton>
                        <TwitterShareButton url={shareUrl} title={shareTitle}>
                          <TwitterIcon size={32} round />
                        </TwitterShareButton>
                        <LineShareButton url={shareUrl} title={shareTitle}>
                          <LineIcon size={32} round />
                        </LineShareButton>
                        <WhatsappShareButton url={shareUrl} title={shareTitle}>
                          <WhatsappIcon size={32} round />
                        </WhatsappShareButton>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={handleCopyLink}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            복사됨!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            링크 복사
                          </>
                        )}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={photographer.profile_image_url} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {rating && (
                  <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white px-2 py-1 rounded-full flex items-center gap-1 text-sm">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{photographer.name}</h1>
                
                <div className="flex flex-wrap items-center gap-4 mb-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>서울</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{experience}년 경력</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    <span>{portfolioPhotos.length}개 작품</span>
                  </div>
                  {reviewCount > 0 && (
                    <div className="flex items-center gap-1">
                      <span>리뷰 {reviewCount}개</span>
                    </div>
                  )}
                </div>

                {primaryPersonality && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">전문 분야</h3>
                    <Badge variant="default" className="mr-2">
                      {primaryPersonality.personality_types?.code}: {primaryPersonality.personality_types?.name}
                    </Badge>
                  </div>
                )}

                <p className="text-muted-foreground mb-6">
                  {primaryPersonality?.personality_types?.name || '다양한'} 스타일 전문 작가입니다. 
                  고객의 개성과 매력을 최대한 끌어내는 촬영을 지향합니다.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button size="lg" asChild>
                    <Link href={`/photographers/${photographer.id}/booking`}>
                      <Calendar className="w-4 h-4 mr-2" />
                      예약하기
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href={`mailto:${photographer.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      문의하기
                    </Link>
                  </Button>
                  {photographer.youtube_intro_url && (
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={handleVideoClick}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      소개 영상
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Portfolio */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">포트폴리오</h2>
                <Badge variant="outline">{portfolioPhotos.length}개 작품</Badge>
              </div>

              {portfolioPhotos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {portfolioPhotos.map((photo: any) => (
                    <div 
                      key={photo.id}
                      className="group relative aspect-[4/5] overflow-hidden rounded-lg cursor-pointer"
                      onClick={() => setSelectedImage(photo.photo_url)}
                    >
                      <Image
                        src={photo.photo_url}
                        alt={photo.title || '포트폴리오'}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <h3 className="text-white font-medium">{photo.title}</h3>
                        {photo.description && (
                          <p className="text-white/80 text-sm">{photo.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>아직 등록된 포트폴리오가 없습니다.</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>연락처</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{photographer.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">010-0000-0000</span>
                  </div>
                </CardContent>
              </Card>

              {/* Personality Types */}
              {compatiblePersonalities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>호환 성격유형</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {compatiblePersonalities.map((mapping: any) => (
                        <div key={mapping.personality_code} className="flex items-center justify-between">
                          <div>
                            <Badge variant="secondary" className="text-xs">
                              {mapping.personality_types?.code}
                            </Badge>
                            <p className="text-sm mt-1">{mapping.personality_types?.name}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {mapping.compatibility_score}/10
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={selectedImage}
              alt="포트폴리오"
              width={800}
              height={1000}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setSelectedImage(null)}
            >
              닫기
            </Button>
          </div>
        </div>
      )}

      {/* YouTube Modal */}
      <YouTubeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedVideo({ id: null, title: '' })
        }}
        videoId={selectedVideo.id}
        title={selectedVideo.title}
      />
    </div>
  )
}