"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronRight, Edit, Eye, EyeOff, Trash, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Category } from "@/components/admin/category-manager"

interface CategoryNodeStaticProps {
  category: Category
  allCategories: Category[]
  isExpanded: boolean
  onToggleExpanded: (nodeId: string) => void
  onEdit: (id: string, updates: Partial<Category>) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string, isActive: boolean) => void
  onSetImage: (categoryId: string) => void
  buildTree: (parentId?: string | null) => Category[]
  depth: number
}

export function CategoryNodeStatic({
  category,
  allCategories,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onDelete,
  onToggleStatus,
  onSetImage,
  buildTree,
  depth,
}: CategoryNodeStaticProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)

  const children = buildTree(category.id)
  const hasChildren = children.length > 0

  const handleEdit = () => {
    setIsEditing(true)
    setEditName(category.name)
  }

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== category.name) {
      onEdit(category.id, { name: editName.trim() })
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditName(category.name)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit()
    } else if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  const indentWidth = depth * 24

  return (
    <div>
      <div
        className="group flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors"
        style={{ marginLeft: `${indentWidth}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={() => onToggleExpanded(category.id)}
          className="flex items-center justify-center w-4 h-4"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="w-4" />
          )}
        </button>

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
              autoFocus
            />
          ) : (
            <div>
              <span className={cn("font-medium", !category.is_active && "text-gray-400 line-through")}>
                {category.name}
              </span>
              <div className="text-xs text-gray-500 mt-1">
                Depth: {category.depth} | Order: {category.display_order}
                {hasChildren && ` | Children: ${children.length}`}
              </div>
            </div>
          )}
        </div>

        {/* Representative Image */}
        {category.representative_image_url ? (
          <div className="relative">
            <img
              src={category.representative_image_url}
              alt={`${category.name} representative`}
              className="h-8 w-8 rounded object-cover border border-gray-200"
            />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
          </div>
        ) : (
          <div className="h-8 w-8 rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-gray-400" />
          </div>
        )}

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <Button size="icon" variant="ghost" onClick={() => onSetImage(category.id)} title="Set representative image">
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleEdit} title="Edit category">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onToggleStatus(category.id, category.is_active)}
            title={category.is_active ? "Deactivate" : "Activate"}
          >
            {category.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(category.id)}
            title="Delete category"
            disabled={hasChildren}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Children - Recursive rendering */}
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <CategoryNodeStatic
              key={child.id}
              category={child}
              allCategories={allCategories}
              isExpanded={false} // Children start collapsed
              onToggleExpanded={onToggleExpanded}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
              onSetImage={onSetImage}
              buildTree={buildTree}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
