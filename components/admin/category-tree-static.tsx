"use client"

import { CategoryNodeStatic } from "@/components/admin/category-node-static"
import type { Category } from "@/lib/hooks/use-categories"

interface CategoryTreeStaticProps {
  categories: Category[]
  allCategories: Category[]
  expandedNodes: Set<string>
  onToggleExpanded: (nodeId: string) => void
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string, isActive: boolean) => void
  onSetImage: (categoryId: string) => void
  buildTree: (parentId?: string | null) => Category[]
}

export function CategoryTreeStatic({
  categories,
  allCategories,
  expandedNodes,
  onToggleExpanded,
  onEdit,
  onDelete,
  onToggleStatus,
  onSetImage,
  buildTree,
}: CategoryTreeStaticProps) {
  return (
    <div className="space-y-1">
      {categories.map((category) => (
        <CategoryNodeStatic
          key={category.id}
          category={category}
          allCategories={allCategories}
          isExpanded={expandedNodes.has(category.id)}
          onToggleExpanded={onToggleExpanded}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
          onSetImage={onSetImage}
          buildTree={buildTree}
          depth={0}
        />
      ))}
    </div>
  )
}
