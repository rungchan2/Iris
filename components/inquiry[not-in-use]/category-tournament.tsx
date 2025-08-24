"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Skeleton } from "@/components/ui/skeleton"
import type { Category, SelectionHistoryStep } from "@/types/inquiry.types"

interface CategoryTournamentProps {
  rootCategories: Category[]
  allCategories: Category[]
  onComplete: (category: Category, path: string[], history: SelectionHistoryStep[]) => void
  isSubmitting: boolean
}

export function CategoryTournament({
  rootCategories,
  allCategories,
  onComplete,
  isSubmitting,
}: CategoryTournamentProps) {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [currentCategories, setCurrentCategories] = useState<Category[]>(rootCategories)
  const [selectedPath, setSelectedPath] = useState<Category[]>([])
  const [selectionHistory, setSelectionHistory] = useState<SelectionHistoryStep[]>([])
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})
  const [isProcessing, setIsProcessing] = useState(false) // 중복 처리 방지

  // Preload images for current categories
  useEffect(() => {
    currentCategories.forEach((category) => {
      if (category.representative_image_url && !loadedImages[category.id]) {
        const img = new Image()
        img.src = category.representative_image_url
        img.onload = () => {
          setLoadedImages((prev) => ({ ...prev, [category.id]: true }))
        }
      }
    })
  }, [currentCategories, loadedImages])

  const handleSelectCategory = (category: Category) => {
    // 중복 처리 방지
    if (isProcessing || isSubmitting) {
      return
    }

    // 이미 선택된 카테고리인지 확인 (순환 참조 방지)
    if (selectedPath.some(selected => selected.id === category.id)) {
      console.warn('Already selected category:', category.name)
      return
    }

    // 최대 depth 제한 (10단계까지만)
    if (currentLevel > 10) {
      console.warn('Maximum depth reached')
      // 강제로 완료 처리
      const categoryNames = [...selectedPath, category].map((c) => c.name)
      onComplete(category, categoryNames, selectionHistory)
      return
    }

    setIsProcessing(true)

    try {
      // Record this selection in history
      const newHistory = [
        ...selectionHistory,
        {
          level: currentLevel,
          selected_id: category.id,
          options: currentCategories.map((c) => c.id),
        },
      ]
      setSelectionHistory(newHistory)

      // Add to path
      const newPath = [...selectedPath, category]
      setSelectedPath(newPath)

      // Find children categories (이미 선택된 카테고리들 제외)
      const selectedIds = new Set(newPath.map(c => c.id))
      const children = allCategories.filter((c) => 
        c.parent_id === category.id && !selectedIds.has(c.id)
      )

      console.log(`Level ${currentLevel}: Selected "${category.name}", Children found: ${children.length}`)

      if (children.length > 0) {
        // Go to next level
        setCurrentCategories(children)
        setCurrentLevel(currentLevel + 1)
      } else {
        // This is a leaf category, complete the selection
        const categoryNames = newPath.map((c) => c.name)
        console.log('Tournament completed with path:', categoryNames)
        onComplete(category, categoryNames, newHistory)
      }
    } catch (error) {
      console.error('Error in handleSelectCategory:', error)
    } finally {
      // 짧은 딜레이 후 처리 상태 해제 (터치 이벤트 중복 방지)
      setTimeout(() => {
        setIsProcessing(false)
      }, 300)
    }
  }

  const handleGoBack = () => {
    if (isProcessing || isSubmitting || selectedPath.length === 0) {
      return
    }

    setIsProcessing(true)

    try {
      // Remove the last selection from history
      setSelectionHistory((prev) => prev.slice(0, -1))

      // Go back one level
      const newPath = [...selectedPath]
      newPath.pop()
      setSelectedPath(newPath)

      if (newPath.length === 0) {
        // Back to root
        setCurrentCategories(rootCategories)
        setCurrentLevel(1)
      } else {
        // Get parent's children (이미 선택된 카테고리들 제외)
        const parentId = newPath[newPath.length - 1].id
        const selectedIds = new Set(newPath.map(c => c.id))
        const siblings = allCategories.filter((c) => 
          c.parent_id === parentId && !selectedIds.has(c.id)
        )
        setCurrentCategories(siblings)
        setCurrentLevel(newPath.length + 1)
      }

      console.log('Went back to level:', newPath.length + 1)
    } catch (error) {
      console.error('Error in handleGoBack:', error)
    } finally {
      setTimeout(() => {
        setIsProcessing(false)
      }, 100)
    }
  }

  // Determine grid layout based on number of options
  const getGridClass = () => {
    switch (currentCategories.length) {
      case 1:
        return "grid-cols-1"
      case 2:
        return "grid-cols-1 md:grid-cols-2"
      case 3:
        return "grid-cols-1 md:grid-cols-3"
      case 4:
      default:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4"
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-4 py-8">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">원하시는 스타일을 <br className="md:hidden" />선택해주세요</h2>
            </div>

            {/* Breadcrumb & Back Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {selectedPath.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleGoBack} 
                    disabled={isSubmitting || isProcessing} 
                    className="mr-2"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}

                <div className="flex items-center text-sm text-muted-foreground overflow-x-auto">
                  {selectedPath.map((category, index) => (
                    <div key={category.id} className="flex items-center whitespace-nowrap">
                      {index > 0 && <span className="mx-2">›</span>}
                      <span>{category.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-sm font-medium">{currentLevel} 단계</div>
            </div>

            {/* Category Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLevel}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`grid ${getGridClass()} gap-6`}
              >
                {currentCategories.map((category) => (
                  <motion.div key={category.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <div className={`group cursor-pointer overflow-hidden transition-all hover:shadow-xl rounded-lg shadow-lg border shadow-accent/80 border-gray-300 ${
                        isProcessing || isSubmitting ? 'pointer-events-none opacity-75' : ''
                      }`}
                      onClick={() => !isSubmitting && !isProcessing && handleSelectCategory(category)}
                    >
                      <AspectRatio ratio={16 / 9}>
                        {category.representative_image_url ? (
                          <>
                            {!loadedImages[category.id] && (
                              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                <Skeleton className="h-full w-full" />
                              </div>
                            )}
                            <img
                              src={category.representative_image_url || category.representative_image?.storage_url || "/placeholder.svg"}
                              alt={category.name}
                              className={`object-cover w-full h-full transition-transform group-hover:scale-105 ${
                                loadedImages[category.id] ? "opacity-100" : "opacity-0"
                              }`}
                              loading="lazy"
                            />
                          </>
                        ) : (
                          <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-full h-full" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="text-white text-2xl font-bold">{category.name}</h3>
                        </div>
                      </AspectRatio>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {isSubmitting && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-2 text-muted-foreground">제출하는 중입니다...</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
