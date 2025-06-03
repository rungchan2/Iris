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
import { ImageSelectorModal } from "@/components/admin/image-selector-modal"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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
    const overCategory = categories.find((c) => c.id === over.id)

    if (!activeCategory || !overCategory) {
      setActiveId(null)
      return
    }

    // Check if same parent
    if (activeCategory.parent_id !== overCategory.parent_id) {
      toast.error("Can only reorder within the same parent")
      setActiveId(null)
      return
    }

    try {
      // Get siblings in current order
      const siblings = categories
        .filter((c) => c.parent_id === activeCategory.parent_id)
        .sort((a, b) => a.display_order - b.display_order)

      // Calculate new order
      const oldIndex = siblings.findIndex((s) => s.id === active.id)
      const newIndex = siblings.findIndex((s) => s.id === over.id)

      if (oldIndex === newIndex) {
        setActiveId(null)
        return
      }

      // Reorder array
      const reorderedSiblings = [...siblings]
      const [removed] = reorderedSiblings.splice(oldIndex, 1)
      reorderedSiblings.splice(newIndex, 0, removed)

      // Update display_order for all affected categories
      const updates = reorderedSiblings.map((cat, index) => ({
        id: cat.id,
        display_order: index,
      }))

      // Optimistic update
      const newCategories = categories.map((cat) => {
        const update = updates.find((u) => u.id === cat.id)
        return update ? { ...cat, display_order: update.display_order } : cat
      })

      setCategories(newCategories)

      // Persist to database using Promise.all
      await Promise.all(
        updates.map(({ id, display_order }) => supabase.from("categories").update({ display_order }).eq("id", id)),
      )

      toast.success("Order updated successfully")
    } catch (error) {
      // Rollback on error
      setCategories(categories)
      console.error("Error reordering categories:", error)
      toast.error("Failed to update order")
    }

    setActiveId(null)
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
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="bg-white border rounded-lg p-2 shadow-lg">
                {categories.find((c) => c.id === activeId)?.name}
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
