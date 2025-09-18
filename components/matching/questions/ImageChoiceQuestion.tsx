'use client'

import { SurveyImage } from '@/types/matching.types'
import { Check, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

interface ImageChoiceQuestionProps {
  images: SurveyImage[]
  value: string | null
  onChange: (value: string) => void
}

// Helper function to validate URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Helper function to get image URL with fallback
function getImageUrl(url: string | null, imageKey: string): string {
  if (!url || !isValidUrl(url)) {
    // Create consistent fallback based on image key for deterministic images
    const seed = imageKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return `https://picsum.photos/seed/${seed}/400/300`
  }
  return url
}

function ImageWithFallback({ 
  src, 
  alt, 
  imageKey,
  className 
}: { 
  src: string | null
  alt: string
  imageKey: string
  className?: string 
}) {
  const [imgSrc, setImgSrc] = useState(getImageUrl(src, imageKey))
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      // Try a different fallback image
      const seed = imageKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      setImgSrc(`https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=${encodeURIComponent(alt)}`)
    }
  }

  if (hasError && !isValidUrl(imgSrc)) {
    // Final fallback - show placeholder with icon
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400">
        <ImageIcon className="w-12 h-12 mb-2" />
        <span className="text-xs text-center px-2">{alt}</span>
      </div>
    )
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className={className}
      sizes="(max-width: 768px) 50vw, 33vw"
      onError={handleError}
    />
  )
}

export default function ImageChoiceQuestion({ 
  images, 
  value, 
  onChange 
}: ImageChoiceQuestionProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images
        .sort((a, b) => a.image_order - b.image_order)
        .map(image => (
          <button
            key={image.id}
            onClick={() => onChange(image.image_key)}
            className={`
              relative rounded-xl overflow-hidden transition-all duration-200
              group hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-200
              ${value === image.image_key
                ? 'ring-4 ring-blue-500 shadow-lg'
                : 'hover:shadow-md'
              }
            `}
          >
            <div className="aspect-[4/3] relative bg-gray-100">
              <ImageWithFallback
                src={image.image_url}
                alt={image.image_label}
                imageKey={image.image_key}
                className="object-cover"
              />
              
              {/* Overlay on hover/select */}
              <div className={`
                absolute inset-0 transition-opacity duration-200
                ${value === image.image_key
                  ? 'bg-blue-600/20'
                  : 'bg-black/0 group-hover:bg-black/10'
                }
              `} />
              
              {/* Checkmark for selected */}
              {value === image.image_key && (
                <div className="absolute top-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            
            <div className={`
              p-3 bg-white
              ${value === image.image_key
                ? 'bg-blue-50'
                : ''
              }
            `}>
              <p className={`
                text-sm font-medium
                ${value === image.image_key
                  ? 'text-blue-900'
                  : 'text-gray-700'
                }
              `}>
                {image.image_label}
              </p>
            </div>
          </button>
        ))}
    </div>
  )
}