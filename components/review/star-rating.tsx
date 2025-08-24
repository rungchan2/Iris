"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  className?: string;
}

export function StarRating({ 
  value, 
  onChange, 
  size = "md", 
  readonly = false,
  className 
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  const handleClick = (rating: number, event: React.MouseEvent) => {
    if (!readonly) {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const halfWidth = rect.width / 2;
      
      // 왼쪽 절반 클릭시 0.5, 오른쪽 절반 클릭시 1.0
      const finalRating = clickX <= halfWidth ? rating - 0.5 : rating;
      onChange(finalRating);
    }
  };

  const handleMouseEnter = (rating: number, event: React.MouseEvent) => {
    if (!readonly) {
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const halfWidth = rect.width / 2;
      
      // 마우스 위치에 따라 0.5 또는 1.0 단위로 hover 값 설정
      const hoverRating = mouseX <= halfWidth ? rating - 0.5 : rating;
      setHoverValue(hoverRating);
    }
  };

  const handleMouseMove = (rating: number, event: React.MouseEvent) => {
    if (!readonly) {
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const halfWidth = rect.width / 2;
      
      const hoverRating = mouseX <= halfWidth ? rating - 0.5 : rating;
      setHoverValue(hoverRating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(0);
    }
  };

  const renderStar = (rating: number, currentValue: number) => {
    const activeValue = hoverValue || currentValue;
    
    if (activeValue >= rating) {
      // 완전히 채워진 별
      return (
        <Star
          className={cn(
            sizeClasses[size],
            "transition-colors duration-200 text-yellow-400 fill-yellow-400"
          )}
        />
      );
    } else if (activeValue >= rating - 0.5) {
      // 반만 채워진 별
      return (
        <div className="relative">
          {/* 배경 별 (회색) */}
          <Star
            className={cn(
              sizeClasses[size],
              "text-gray-300 fill-gray-300"
            )}
          />
          {/* 앞쪽 별 (노란색, 왼쪽 반만 보이게) */}
          <Star
            className={cn(
              sizeClasses[size],
              "absolute top-0 left-0 text-yellow-400 fill-yellow-400"
            )}
            style={{
              clipPath: 'inset(0 50% 0 0)'
            }}
          />
        </div>
      );
    } else {
      // 비어있는 별
      return (
        <Star
          className={cn(
            sizeClasses[size],
            "transition-colors duration-200 text-gray-300"
          )}
        />
      );
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((rating) => {
        return (
          <div key={rating} className="relative">
            <button
              type="button"
              onClick={(e) => handleClick(rating, e)}
              onMouseEnter={(e) => handleMouseEnter(rating, e)}
              onMouseMove={(e) => handleMouseMove(rating, e)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              className={cn(
                "transition-all duration-200 relative",
                readonly 
                  ? "cursor-default" 
                  : "cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded-sm"
              )}
            >
              {renderStar(rating, value)}
            </button>
          </div>
        );
      })}
    </div>
  );
}

interface StarDisplayProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export function StarDisplay({ 
  rating, 
  size = "md", 
  showValue = false,
  className 
}: StarDisplayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  // 클라이언트에서만 렌더링
  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <div key={star} className="relative">
              <Star
                className={cn(
                  sizeClasses[size],
                  "text-gray-300"
                )}
              />
            </div>
          ))}
        </div>
        {showValue && (
          <span className={cn("text-gray-600 font-medium", textSizeClasses[size])}>
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    );
  }

  const renderDisplayStar = (starPosition: number, ratingValue: number) => {
    const isHalfFilled = ratingValue >= starPosition - 0.5 && ratingValue < starPosition;
    const isFilled = ratingValue >= starPosition;
    
    if (isFilled) {
      // 완전히 채워진 별
      return (
        <Star
          className={cn(
            sizeClasses[size],
            "text-yellow-400 fill-yellow-400"
          )}
        />
      );
    } else if (isHalfFilled) {
      // 반만 채워진 별 - 항상 같은 구조로 렌더링
      return (
        <div className="relative">
          <Star
            className={cn(
              sizeClasses[size],
              "text-gray-300 fill-gray-300"
            )}
          />
          <Star
            className={cn(
              sizeClasses[size],
              "absolute top-0 left-0 text-yellow-400 fill-yellow-400"
            )}
            style={{
              clipPath: 'inset(0 50% 0 0)'
            }}
          />
        </div>
      );
    } else {
      // 비어있는 별
      return (
        <Star
          className={cn(
            sizeClasses[size],
            "text-gray-300"
          )}
        />
      );
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className="relative">
            {renderDisplayStar(star, rating)}
          </div>
        ))}
      </div>
      {showValue && (
        <span className={cn("text-gray-600 font-medium", textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}