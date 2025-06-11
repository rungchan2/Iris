import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Category } from "@/types/inquiry.types"

// Query key factory
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters: string) => [...categoryKeys.lists(), { filters }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
}

// Fetch categories
export function useCategories() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select(`
          *,
          representative_image:photos(
            id,
            storage_url,
            thumbnail_url
          )
        `)
        .order("display_order", { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data as Category[]
    },
  })
}

// Add category mutation
export function useAddCategory() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ 
      parentId, 
      name, 
      representativeImageId 
    }: { 
      parentId: string | null
      name: string
      representativeImageId?: string 
    }) => {
      const currentCategories = queryClient.getQueryData<Category[]>(categoryKeys.lists()) || []
      
      // Calculate depth
      const parentCategory = parentId ? currentCategories.find((c) => c.id === parentId) : null
      const depth = parentCategory ? parentCategory.depth + 1 : 1

      // Check max depth
      if (depth > 10) {
        throw new Error("카테고리는 최대 10단계까지만 생성할 수 있습니다")
      }

      // Generate path
      const path = parentCategory ? `${parentCategory.path}/${name}` : name

      // Get next display order
      const siblings = currentCategories.filter((c) => c.parent_id === parentId)
      const displayOrder = Math.max(...siblings.map((s) => s.display_order || 0), -1) + 1

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
      return data
    },
    onSuccess: (newCategory) => {
      // Optimistic update
      queryClient.setQueryData<Category[]>(categoryKeys.lists(), (old) => {
        if (!old) return [newCategory]
        return [...old, newCategory]
      })
      toast.success("카테고리가 성공적으로 추가되었습니다")
    },
    onError: (error: Error) => {
      toast.error(error.message || "카테고리 추가에 실패했습니다")
    },
  })
}

// Update category mutation
export function useUpdateCategory() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: { 
        name: string
        parent_id: string | null
        place_recommendation?: string
        male_clothing_recommendation?: string
        female_clothing_recommendation?: string
        accessories_recommendation?: string
      } 
    }) => {
      const currentCategories = queryClient.getQueryData<Category[]>(categoryKeys.lists()) || []
      const category = currentCategories.find((c) => c.id === id)
      if (!category) throw new Error("카테고리를 찾을 수 없습니다")

      // Calculate new depth and path
      const parentCategory = updates.parent_id ? currentCategories.find((c) => c.id === updates.parent_id) : null
      const newDepth = parentCategory ? parentCategory.depth + 1 : 1
      const newPath = parentCategory ? `${parentCategory.path}/${updates.name}` : updates.name

      // Check max depth
      if (newDepth > 10) {
        throw new Error("카테고리는 최대 10단계까지만 생성할 수 있습니다")
      }

      // Check for circular dependency
      if (updates.parent_id) {
        let checkParent = parentCategory
        while (checkParent) {
          if (checkParent.id === id) {
            throw new Error("자기 자신이나 하위 카테고리를 부모로 설정할 수 없습니다")
          }
          checkParent = currentCategories.find(c => c.id === checkParent?.parent_id) || null
        }
      }

      // Get new display order if parent changed
      let newDisplayOrder = category.display_order || 0
      if (updates.parent_id !== category.parent_id) {
        const newSiblings = currentCategories.filter((c) => c.parent_id === updates.parent_id)
        newDisplayOrder = Math.max(...newSiblings.map((s) => s.display_order || 0), -1) + 1
      }

      // Update the category
      const updateData: any = {
        name: updates.name,
        parent_id: updates.parent_id,
        depth: newDepth,
        path: newPath,
        display_order: newDisplayOrder,
      }

      // Add recommendation fields if provided
      if (updates.place_recommendation !== undefined) {
        updateData.place_recommendation = updates.place_recommendation
      }
      if (updates.male_clothing_recommendation !== undefined) {
        updateData.male_clothing_recommendation = updates.male_clothing_recommendation
      }
      if (updates.female_clothing_recommendation !== undefined) {
        updateData.female_clothing_recommendation = updates.female_clothing_recommendation
      }
      if (updates.accessories_recommendation !== undefined) {
        updateData.accessories_recommendation = updates.accessories_recommendation
      }

      const { error } = await supabase.from("categories").update(updateData).eq("id", id)

      if (error) throw error

      // Update descendants if hierarchy changed
      if (updates.parent_id !== category.parent_id || updates.name !== category.name) {
        await updateDescendantPaths(supabase, currentCategories, id, newPath, newDepth)
      }

      return { id, updates: { ...updates, depth: newDepth, path: newPath, display_order: newDisplayOrder } }
    },
    onSuccess: () => {
      // Invalidate and refetch categories
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      toast.success("카테고리가 성공적으로 수정되었습니다")
    },
    onError: (error: Error) => {
      toast.error(error.message || "카테고리 수정에 실패했습니다")
    },
  })
}

// Delete category mutation
export function useDeleteCategory() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id)
      if (error) throw error
      return id
    },
    onSuccess: (deletedId) => {
      // Optimistic update
      queryClient.setQueryData<Category[]>(categoryKeys.lists(), (old) => {
        if (!old) return []
        return old.filter((cat) => cat.id !== deletedId)
      })
      toast.success("카테고리가 성공적으로 삭제되었습니다")
    },
    onError: (error: Error) => {
      toast.error(error.message || "카테고리 삭제에 실패했습니다")
    },
  })
}

// Toggle status mutation
export function useToggleCategoryStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: isActive })
        .eq("id", id)

      if (error) throw error
      return { id, isActive }
    },
    onSuccess: ({ id, isActive }) => {
      // Optimistic update
      queryClient.setQueryData<Category[]>(categoryKeys.lists(), (old) => {
        if (!old) return []
        return old.map((cat) => cat.id === id ? { ...cat, is_active: isActive } : cat)
      })
      toast.success(`카테고리가 ${isActive ? '활성화' : '비활성화'}되었습니다`)
    },
    onError: (error: Error) => {
      toast.error(error.message || "카테고리 상태 변경에 실패했습니다")
    },
  })
}

// Update category order mutation
export function useUpdateCategoryOrder() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ 
      activeId, 
      overId, 
      activeParentId 
    }: { 
      activeId: string
      overId: string
      activeParentId: string | null 
    }) => {
      const currentCategories = queryClient.getQueryData<Category[]>(categoryKeys.lists()) || []
      
      // Check if they have the same parent
      const activeCategory = currentCategories.find(c => c.id === activeId)
      const overCategory = currentCategories.find(c => c.id === overId)
      
      if (!activeCategory || !overCategory) {
        throw new Error("카테고리를 찾을 수 없습니다")
      }

      if (activeCategory.parent_id !== overCategory.parent_id) {
        throw new Error("같은 레벨의 카테고리들끼리만 순서를 변경할 수 있습니다")
      }

      // Get siblings and reorder
      const siblings = currentCategories
        .filter(c => c.parent_id === activeParentId)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

      const activeIndex = siblings.findIndex(c => c.id === activeId)
      const overIndex = siblings.findIndex(c => c.id === overId)

      if (activeIndex === -1 || overIndex === -1) return

      // Remove active item and insert at new position
      const reorderedSiblings = [...siblings]
      const [movedItem] = reorderedSiblings.splice(activeIndex, 1)
      reorderedSiblings.splice(overIndex, 0, movedItem)

      // Update display orders in database
      const updates = reorderedSiblings.map((category, index) => ({
        id: category.id,
        display_order: index
      }))

      // Batch update display orders
      for (const update of updates) {
        await supabase
          .from("categories")
          .update({ display_order: update.display_order })
          .eq("id", update.id)
      }

      return { updates }
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
    onError: (error: Error) => {
      toast.error(error.message || "순서 변경에 실패했습니다")
    },
  })
}

// Update representative image mutation
export function useUpdateRepresentativeImage() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ categoryId, imageId, imageUrl }: { categoryId: string; imageId: string; imageUrl: string }) => {
      const { error } = await supabase
        .from("categories")
        .update({ representative_image_id: imageId, representative_image_url: imageUrl })
        .eq("id", categoryId)

      if (error) throw error
      return { categoryId, imageId }
    },
    onSuccess: () => {
      // Invalidate and refetch to get updated image data
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      toast.success("대표 이미지가 설정되었습니다")
    },
    onError: (error: Error) => {
      toast.error(error.message || "대표 이미지 설정에 실패했습니다")
    },
  })
}

// Helper function to update descendant paths
async function updateDescendantPaths(
  supabase: any,
  categories: Category[],
  categoryId: string,
  newParentPath: string,
  newParentDepth: number
) {
  const descendants = categories.filter((c) => c.parent_id === categoryId)

  for (const descendant of descendants) {
    const descendantNewPath = `${newParentPath}/${descendant.name}`
    const descendantNewDepth = newParentDepth + 1

    await supabase.from("categories").update({
      path: descendantNewPath,
      depth: descendantNewDepth,
    }).eq("id", descendant.id)

    // Recursively update deeper descendants
    await updateDescendantPaths(supabase, categories, descendant.id, descendantNewPath, descendantNewDepth)
  }
} 