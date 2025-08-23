"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ImageIcon, Sparkles, X } from "lucide-react";
import { PersonalityType } from "@/lib/quiz-data";
import { getPersonalityPhotos } from "@/lib/actions/personality";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface RecommendedGalleryProps {
  personalityCode: PersonalityType;
}

interface PersonalityPhoto {
  id: string;
  photo_url: string;
  thumbnail_url: string;
  title: string;
  description: string;
  style_tags: string[];
  display_order: number;
}

export function RecommendedGallery({ personalityCode }: RecommendedGalleryProps) {
  const [photos, setPhotos] = useState<PersonalityPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PersonalityPhoto | null>(null);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const result = await getPersonalityPhotos(personalityCode);
        if (result.success && result.photos) {
          const validPhotos: PersonalityPhoto[] = result.photos
            .filter(photo => photo !== null)
            .map(photo => ({
              ...photo!,
              style_tags: photo!.style_tags || []
            }));
          setPhotos(validPhotos);
        }
      } catch (error) {
        console.error("Error loading personality photos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [personalityCode]);

  // 사진이 없는 경우 기본 플레이스홀더 표시
  const placeholderPhotos = Array(9).fill(null).map((_, index) => ({
    id: `placeholder-${index}`,
    photo_url: '',
    thumbnail_url: '',
    title: `스타일 ${index + 1}`,
    description: '준비 중',
    style_tags: [],
    display_order: index + 1
  }));

  const displayPhotos = photos.length > 0 ? photos : placeholderPhotos;

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {personalityCode} 성향을 위한 추천 사진
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              당신의 성향과 완벽하게 어울리는 사진 스타일들을 확인해보세요.
              <br />
              각 사진은 전문 작가들이 촬영한 실제 작품입니다.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {Array(9).fill(null).map((_, index) => (
                <div 
                  key={index}
                  className="aspect-square bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {displayPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group cursor-pointer"
                  onClick={() => photo.photo_url && setSelectedPhoto(photo)}
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                    {photo.photo_url ? (
                      <>
                        <Image
                          src={photo.thumbnail_url || photo.photo_url}
                          alt={photo.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-sm font-medium truncate">{photo.title}</p>
                          {photo.style_tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {photo.style_tags.slice(0, 2).map((tag, i) => (
                                <Badge 
                                  key={i} 
                                  variant="secondary" 
                                  className="text-xs bg-white/20 text-white border-0"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">준비 중</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Sparkle effect for new photos */}
                    {index === 0 && photo.photo_url && (
                      <div className="absolute top-2 right-2">
                        <div className="relative">
                          <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                          <div className="absolute inset-0 w-5 h-5 bg-yellow-400 rounded-full blur-lg opacity-50 animate-pulse" />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {photos.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                이 성향을 위한 추천 사진을 준비 중입니다.
              </p>
              <p className="text-sm text-gray-400">
                곧 다양한 스타일의 사진들을 만나보실 수 있어요!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>
              {selectedPhoto ? selectedPhoto.title : '사진 상세보기'}
            </DialogTitle>
          </VisuallyHidden>
          {selectedPhoto && (
            <div className="relative">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="relative aspect-[4/3]">
                <Image
                  src={selectedPhoto.photo_url}
                  alt={selectedPhoto.title}
                  fill
                  className="object-contain"
                />
              </div>
              
              <div className="p-6 bg-white">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedPhoto.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedPhoto.description}
                </p>
                {selectedPhoto.style_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedPhoto.style_tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}