"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Client-only wrapper for DndContext to avoid SSR issues
const DndContextWrapper = dynamic(() => import("@dnd-kit/core").then((mod) => mod.DndContext), {
  ssr: false,
  loading: () => <div className="animate-pulse">Loading drag and drop...</div>,
})
import { closestCenter, type DragEndEvent, DragOverlay, type DragStartEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { CategoryTree } from "@/components/admin/category-tree"
import { CategoryTreeStatic } from "@/components/admin/category-tree-static"
import { AddCategoryModal } from "@/components/admin/add-category-modal"
import { EditCategoryModal } from "@/components/admin/edit-category-modal"
import { ImageSelectorModal } from "@/components/admin/image-selector-modal"
import { cn } from "@/lib/utils"
import {
  useCategories,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
  useToggleCategoryStatus,
  useUpdateCategoryOrder,
  useUpdateRepresentativeImage,
  type Category,
} from "@/lib/hooks/use-categories"

interface CategoryManagerProps {
  initialCategories: Category[]
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<Category | null>(null)
  const [selectedCategoryForImage, setSelectedCategoryForImage] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // TanStack Query hooks
  const { data: categories = initialCategories, isLoading } = useCategories()
  const addCategoryMutation = useAddCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()
  const toggleStatusMutation = useToggleCategoryStatus()
  const updateOrderMutation = useUpdateCategoryOrder()
  const updateImageMutation = useUpdateRepresentativeImage()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Build tree structure
  const buildTree = (parentId: string | null = null): Category[] => {
    return categories
      .filter((cat) => cat.parent_id === parentId)
      .filter((cat) => (searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  }

  const handleAddCategory = async (parentId: string | null, name: string, representativeImageId?: string) => {
    await addCategoryMutation.mutateAsync({
      parentId,
      name,
      representativeImageId,
    })
    setIsAddModalOpen(false)
  }

  const handleEditCategory = async (id: string, updates: { 
    name: string
    parent_id: string | null
    place_recommendation?: string
    male_clothing_recommendation?: string
    female_clothing_recommendation?: string
    accessories_recommendation?: string
  }) => {
    await updateCategoryMutation.mutateAsync({ id, updates })
    setIsEditModalOpen(false)
    setSelectedCategoryForEdit(null)
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      await deleteCategoryMutation.mutateAsync(id)
    }
  }

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    await toggleStatusMutation.mutateAsync({ id, isActive })
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the categories
    const activeCategory = categories.find((c) => c.id === activeId)
    if (!activeCategory) return

    try {
      await updateOrderMutation.mutateAsync({
        activeId,
        overId,
        activeParentId: activeCategory.parent_id,
      })
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleOpenEditModal = (category: Category) => {
    setSelectedCategoryForEdit(category)
    setIsEditModalOpen(true)
  }

  const handleSetRepresentativeImage = (categoryId: string) => {
    setSelectedCategoryForImage(categoryId)
    setIsImageModalOpen(true)
  }

  const handleImageSelected = async (imageId: string, imageUrl: string) => {
    if (selectedCategoryForImage) {
      await updateImageMutation.mutateAsync({
        categoryId: selectedCategoryForImage,
        imageId,
      })
      setIsImageModalOpen(false)
      setSelectedCategoryForImage(null)
    }
  }

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  if (!mounted) {
    return <div className="animate-pulse">Loading...</div>
  }

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>
  }

  // Helper to flatten categories for DnD sorting
  const flattenCategories = (cats: Category[]): string[] => {
    const result: string[] = []
    const addCategory = (category: Category) => {
      result.push(category.id)
      const children = buildTree(category.id)
      children.forEach(addCategory)
    }
    cats.forEach(addCategory)
    return result
  }

  const flatCategories = flattenCategories(buildTree())

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="카테고리 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            카테고리 추가
          </Button>
        </div>
      </div>

      {/* Category Tree with Drag & Drop */}
      <div className="border rounded-lg p-4">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>카테고리가 없습니다.</p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="outline"
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              첫 번째 카테고리 추가
            </Button>
          </div>
        ) : (
          <DndContextWrapper
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={flatCategories} strategy={verticalListSortingStrategy}>
              <CategoryTree
                categories={buildTree()}
                allCategories={categories}
                expandedNodes={expandedNodes}
                onToggleExpanded={toggleExpanded}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteCategory}
                onToggleStatus={handleToggleStatus}
                onSetImage={handleSetRepresentativeImage}
                buildTree={buildTree}
              />
            </SortableContext>

            <DragOverlay>
              {activeId ? (
                <div
                  className={cn(
                    "bg-background border rounded-lg p-3 shadow-lg",
                    "opacity-90 transform rotate-2",
                  )}
                >
                  <CategoryTreeStatic
                    categories={buildTree().filter((cat) => cat.id === activeId)}
                    allCategories={categories}
                    expandedNodes={expandedNodes}
                    onToggleExpanded={toggleExpanded}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteCategory}
                    onToggleStatus={handleToggleStatus}
                    onSetImage={handleSetRepresentativeImage}
                    buildTree={buildTree}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContextWrapper>
        )}
      </div>

      {/* Modals */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCategory}
        categories={categories}
      />

      <EditCategoryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedCategoryForEdit(null)
        }}
        onSave={handleEditCategory}
        category={selectedCategoryForEdit}
        categories={categories}
      />

      <ImageSelectorModal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false)
          setSelectedCategoryForImage(null)
        }}
        onSelect={handleImageSelected}
      />
    </div>
  )
}

// Export the Category type for other components
export type { Category }
