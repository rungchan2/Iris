"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Client-only wrapper for DndContext to avoid SSR issues
const DndContextWrapper = dynamic(() => import("@dnd-kit/core").then((mod) => mod.DndContext), {
  ssr: false,
  loading: () => <div className="animate-pulse">Loading drag and drop...</div>,
})
import { closestCenter, type DragEndEvent, DragOverlay, type DragStartEvent, useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { CategoryTree } from "@/components/admin/category-tree"
import { CategoryTreeStatic } from "@/components/admin/category-tree-static"
import { AddCategoryModal } from "@/components/admin/add-category-modal"
import { ImageSelectorModal } from "@/components/admin/image-selector-modal"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export interface Category {
  id: string
  parent_id: string | null
  name: string
  depth: number
  path: string
  display_order: number
  is_active: boolean
  representative_image_url: string | null
  representative_image_id: string | null
  created_at: string
  updated_at: string
  representative_image?: {
    id: string
    storage_url: string
    thumbnail_url: string | null
  } | null
}

interface CategoryManagerProps {
  initialCategories: Category[]
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedCategoryForImage, setSelectedCategoryForImage] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("categories_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, (payload) => {
        handleRealtimeUpdate(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === "INSERT") {
      setCategories((prev) => [...prev, payload.new])
    } else if (payload.eventType === "UPDATE") {
      setCategories((prev) => prev.map((cat) => (cat.id === payload.new.id ? payload.new : cat)))
    } else if (payload.eventType === "DELETE") {
      setCategories((prev) => prev.filter((cat) => cat.id !== payload.old.id))
    }
  }

  // Build tree structure
  const buildTree = (parentId: string | null = null): Category[] => {
    return categories
      .filter((cat) => cat.parent_id === parentId)
      .filter((cat) => (searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true))
      .sort((a, b) => a.display_order - b.display_order)
  }

  const handleAddCategory = async (parentId: string | null, name: string, representativeImageId?: string) => {
    try {
      // Calculate depth
      const parentCategory = parentId ? categories.find((c) => c.id === parentId) : null
      const depth = parentCategory ? parentCategory.depth + 1 : 1

      // Check max depth
      if (depth > 10) {
        toast.error("Maximum depth of 10 levels reached")
        return
      }

      // Generate path
      const path = parentCategory ? `${parentCategory.path}/${name}` : name

      // Get next display order
      const siblings = categories.filter((c) => c.parent_id === parentId)
      const displayOrder = Math.max(...siblings.map((s) => s.display_order), -1) + 1

      // Insert category
      const { data, error } = await supabase
        .from("categories")
        .insert({
          parent_id: parentId,
          name,
          depth,
          path,
          display_order: displayOrder,
          representative_image_id: representativeImageId,
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Category added successfully")
      setIsAddModalOpen(false)
    } catch (error) {
      console.error("Error adding category:", error)
      toast.error("Failed to add category")
    }
  }

  const handleEditCategory = async (id: string, updates: Partial<Category>) => {
    try {
      // If name changes, update path for all descendants
      if (updates.name) {
        const category = categories.find((c) => c.id === id)
        if (category) {
          const oldPath = category.path
          const newPath = category.parent_id
            ? categories.find((c) => c.id === category.parent_id)?.path + "/" + updates.name
            : updates.name

          // Update this category and all descendants
          await updateCategoryPaths(id, oldPath, newPath || "")
        }
      }

      const { error } = await supabase.from("categories").update(updates).eq("id", id)

      if (error) throw error

      toast.success("Category updated successfully")
    } catch (error) {
      console.error("Error updating category:", error)
      toast.error("Failed to update category")
    }
  }

  const updateCategoryPaths = async (categoryId: string, oldPath: string, newPath: string) => {
    // Get all descendants
    const descendants = categories.filter((c) => c.path.startsWith(oldPath + "/"))

    // Update paths
    const updates = descendants.map((cat) => ({
      id: cat.id,
      path: cat.path.replace(oldPath, newPath),
    }))

    // Update in database
    for (const update of updates) {
      await supabase.from("categories").update({ path: update.path }).eq("id", update.id)
    }

    // Update current category
    await supabase.from("categories").update({ path: newPath }).eq("id", categoryId)
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      // Check for children
      const hasChildren = categories.some((c) => c.parent_id === id)
      if (hasChildren) {
        toast.error("Cannot delete category with children")
        return
      }

      // Check for assigned photos
      const { count } = await supabase
        .from("photo_categories")
        .select("*", { count: "exact", head: true })
        .eq("category_id", id)

      if (count && count > 0) {
        const confirmed = window.confirm(`This category has ${count} photos. Delete anyway?`)
        if (!confirmed) return
      }

      const { error } = await supabase.from("categories").delete().eq("id", id)

      if (error) throw error

      toast.success("Category deleted successfully")
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Failed to delete category")
    }
  }

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("categories").update({ is_active: !isActive }).eq("id", id)

      if (error) throw error

      toast.success(`Category ${!isActive ? "activated" : "deactivated"}`)
    } catch (error) {
      console.error("Error toggling status:", error)
      toast.error("Failed to update status")
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      return
    }

    const activeCategory = categories.find((c) => c.id === active.id)
    
    if (!activeCategory) {
      setActiveId(null)
      return
    }

    // Handle drop to root
    if (over.id === 'root') {
      await handleDropToRoot(activeCategory.id)
      setActiveId(null)
      return
    }

    const overCategory = categories.find((c) => c.id === over.id)

    if (!overCategory) {
      setActiveId(null)
      return
    }

    // Check for circular dependency (prevent making a category a child of its own descendant)
    if (isDescendant(overCategory.id, activeCategory.id)) {
      toast.error("Cannot move a category to be a child of its own descendant")
      setActiveId(null)
      return
    }

    try {
      // Moving active category to become a child of over category
      const newParentId = overCategory.id
      const newDepth = overCategory.depth + 1

      // Check max depth
      if (newDepth > 10) {
        toast.error("Maximum depth of 10 levels reached")
        setActiveId(null)
        return
      }

      // Calculate new path
      const newPath = `${overCategory.path}/${activeCategory.name}`

      // Get new display order (add to end of siblings)
      const newSiblings = categories.filter((c) => c.parent_id === newParentId)
      const newDisplayOrder = Math.max(...newSiblings.map((s) => s.display_order), -1) + 1

      // Update the category and all its descendants
      await updateCategoryHierarchy(activeCategory.id, newParentId, newDepth, newPath, newDisplayOrder)

      toast.success("Category hierarchy updated successfully")
    } catch (error) {
      console.error("Error updating hierarchy:", error)
      toast.error("Failed to update hierarchy")
    }

    setActiveId(null)
  }

  // Helper function to check if targetId is a descendant of ancestorId
  const isDescendant = (targetId: string, ancestorId: string): boolean => {
    const target = categories.find((c) => c.id === targetId)
    if (!target || !target.parent_id) return false
    
    if (target.parent_id === ancestorId) return true
    return isDescendant(target.parent_id, ancestorId)
  }

  // Helper function to update category hierarchy
  const updateCategoryHierarchy = async (categoryId: string, newParentId: string, newDepth: number, newPath: string, newDisplayOrder: number) => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return

    // Update the main category
    await supabase.from("categories").update({
      parent_id: newParentId,
      depth: newDepth,
      path: newPath,
      display_order: newDisplayOrder,
    }).eq("id", categoryId)

    // Update all descendants recursively
    const descendants = categories.filter((c) => c.parent_id === categoryId)
    for (const descendant of descendants) {
      const descendantNewPath = `${newPath}/${descendant.name}`
      const descendantNewDepth = newDepth + 1
      await updateCategoryHierarchy(descendant.id, categoryId, descendantNewDepth, descendantNewPath, descendant.display_order)
    }
  }

  const handleSetRepresentativeImage = (categoryId: string) => {
    setSelectedCategoryForImage(categoryId)
    setIsImageModalOpen(true)
  }

  const handleImageSelected = async (imageId: string, imageUrl: string) => {
    if (!selectedCategoryForImage) return

    try {
      const { error } = await supabase
        .from("categories")
        .update({
          representative_image_id: imageId,
          representative_image_url: imageUrl,
        })
        .eq("id", selectedCategoryForImage)

      if (error) throw error

      toast.success("Representative image updated")
      setIsImageModalOpen(false)
      setSelectedCategoryForImage(null)
    } catch (error) {
      console.error("Error updating representative image:", error)
      toast.error("Failed to update image")
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

  const rootCategories = buildTree()

  // Create a flattened list of all category IDs for SortableContext
  const flattenCategories = (cats: Category[]): string[] => {
    const result: string[] = []

    const addCategory = (category: Category) => {
      result.push(category.id)
      const children = cats.filter((c) => c.parent_id === category.id)
      children.forEach(addCategory)
    }

    cats.filter((c) => !c.parent_id).forEach(addCategory)
    return result
  }

  // Don't render DnD until client-side
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <CategoryTreeStatic
            categories={rootCategories}
            allCategories={categories}
            expandedNodes={expandedNodes}
            onToggleExpanded={toggleExpanded}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
            onToggleStatus={handleToggleStatus}
            onSetImage={handleSetRepresentativeImage}
            buildTree={buildTree}
          />
        </div>

        <AddCategoryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddCategory}
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

  const flattenedIds = flattenCategories(categories)

  // Component for root drop zone
  const RootDropZone = ({ children }: { children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: 'root',
    })

    return (
      <div 
        ref={setNodeRef}
        className={cn(
          "min-h-[200px] rounded-lg transition-colors",
          isOver ? "bg-blue-50 border-2 border-dashed border-blue-300" : ""
        )}
      >
        {children}
        {isOver && (
          <div className="text-center py-8 text-blue-600 font-medium">
            Drop here to move to root level
          </div>
        )}
      </div>
    )
  }

  // Handle drop to root
  const handleDropToRoot = async (categoryId: string) => {
    try {
      const category = categories.find((c) => c.id === categoryId)
      if (!category) return

      // Get new display order for root level
      const rootCategories = categories.filter((c) => !c.parent_id)
      const newDisplayOrder = Math.max(...rootCategories.map((s) => s.display_order), -1) + 1

      await supabase.from("categories").update({
        parent_id: null,
        depth: 1,
        path: category.name,
        display_order: newDisplayOrder,
      }).eq("id", categoryId)

      // Update all descendants
      const descendants = categories.filter((c) => c.parent_id === categoryId)
      for (const descendant of descendants) {
        const descendantNewPath = `${category.name}/${descendant.name}`
        const descendantNewDepth = 2
        await updateCategoryHierarchy(descendant.id, categoryId, descendantNewDepth, descendantNewPath, descendant.display_order)
      }

      toast.success("Category moved to root level")
    } catch (error) {
      console.error("Error moving to root:", error)
      toast.error("Failed to move to root")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <DndContextWrapper collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={flattenedIds} strategy={verticalListSortingStrategy}>
            {/* Root drop zone */}
            <RootDropZone>
              <CategoryTree
                categories={rootCategories}
                allCategories={categories}
                expandedNodes={expandedNodes}
                onToggleExpanded={toggleExpanded}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                onToggleStatus={handleToggleStatus}
                onSetImage={handleSetRepresentativeImage}
                buildTree={buildTree}
              />
            </RootDropZone>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="bg-white border-2 border-blue-300 rounded-lg p-2 shadow-lg opacity-90">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">
                    {categories.find((c) => c.id === activeId)?.name}
                  </span>
                  <span className="text-xs text-gray-500">→ Drop on target category</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContextWrapper>
      </div>

      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCategory}
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
