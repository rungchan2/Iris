"use client";

import { useState } from "react";
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

  const handleClick = (rating: number) => {
    if (!readonly) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(0);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const isActive = (hoverValue || value) >= rating;
        
        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={cn(
              "transition-all duration-200",
              readonly 
                ? "cursor-default" 
                : "cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded-sm"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors duration-200",
                isActive 
                  ? "text-yellow-400 fill-yellow-400" 
                  : "text-gray-300 hover:text-yellow-200"
              )}
            />
          </button>
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

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizeClasses[size],
              star <= rating 
                ? "text-yellow-400 fill-yellow-400" 
                : "text-gray-300"
            )}
          />
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