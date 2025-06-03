"use client"

import { RecursiveCategoryNode } from "@/components/admin/recursive-category-node"
import type { Category } from "@/components/admin/category-manager"

interface CategoryTreeProps {
  categories: Category[]
  allCategories: Category[]
  expandedNodes: Set<string>
  onToggleExpanded: (nodeId: string) => void
  onEdit: (id: string, updates: Partial<Category>) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string, isActive: boolean) => void
  onSetImage: (categoryId: string) => void
  buildTree: (parentId?: string | null) => Category[]
}

export function CategoryTree({
  categories,
  allCategories,
  expandedNodes,
  onToggleExpanded,
  onEdit,
  onDelete,
  onToggleStatus,
  onSetImage,
  buildTree,
}: CategoryTreeProps) {
  // Get root categories (parent_id is null)
  const rootCategories = categories.filter((cat) => !cat.parent_id)

  return (
    <div className="space-y-1">
      {rootCategories.map((category) => (
        <RecursiveCategoryNode
          key={category.id}
          category={category}
          allCategories={allCategories}
          depth={0}
          expandedNodes={expandedNodes}
          onToggleExpanded={onToggleExpanded}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
          onSetImage={onSetImage}
        />
      ))}
    </div>
  )
}
