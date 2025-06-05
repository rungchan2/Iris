"use client"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface AspectImageProps {
  src: string
  alt?: string
  ratio?: number // Default to 16/9
  className?: string
  objectFit?: "cover" | "contain"
  onClick?: () => void
}

export function AspectImage({
  src,
  alt = "",
  ratio = 16 / 9,
  className,
  objectFit = "cover",
  onClick,
}: AspectImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // Generate consistent fallback image based on src
  const getFallbackUrl = (originalSrc: string) => {
    const seed = originalSrc.split("/").pop()?.split(".")[0] || "fallback"
    return `https://picsum.photos/seed/${seed}/800/450`
  }

  return (
    <AspectRatio ratio={ratio} className={cn("bg-muted overflow-hidden", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
      <img
        src={error ? getFallbackUrl(src) : src}
        alt={alt}
        className={cn(
          "h-full w-full transition-all duration-300",
          objectFit === "cover" ? "object-cover" : "object-contain",
          onClick && "cursor-pointer hover:opacity-90 hover:scale-105",
          isLoading ? "opacity-0" : "opacity-100",
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true)
          setIsLoading(false)
        }}
        onClick={onClick}
      />
    </AspectRatio>
  )
}
