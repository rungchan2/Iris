"use client"

import type React from "react"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GripVertical, ChevronDown, ChevronRight, Edit, Eye, EyeOff, Trash, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Category } from "@/lib/hooks/use-categories"

interface RecursiveCategoryNodeProps {
  category: Category
  allCategories: Category[]
  depth: number
  expandedNodes: Set<string>
  onToggleExpanded: (nodeId: string) => void
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string, isActive: boolean) => void
  onSetImage: (categoryId: string) => void
}

export function RecursiveCategoryNode({
  category,
  allCategories,
  depth,
  expandedNodes,
  onToggleExpanded,
  onEdit,
  onDelete,
  onToggleStatus,
  onSetImage,
}: RecursiveCategoryNodeProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: category.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const children = allCategories.filter((cat) => cat.parent_id === category.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedNodes.has(category.id)

  const handleEdit = () => {
    onEdit(category)
  }

  const indentWidth = depth * 24

  return (
    <div 
      ref={(node) => {
        setNodeRef(node)
        setDropRef(node)
      }} 
      style={style} 
      className={cn("select-none", isDragging && "opacity-50")}
    >
      <div
        className={cn(
          "group flex items-center gap-2 py-2 px-3 rounded-lg transition-colors",
          isOver ? "bg-blue-100 border-2 border-blue-300" : "hover:bg-gray-50"
        )}
        style={{ marginLeft: `${indentWidth}px` }}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

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
          <div>
            <span className={cn("font-medium", !category.is_active && "text-gray-400 line-through")}>
              {category.name}
            </span>
            <div className="text-xs text-gray-500 mt-1">
              Depth: {category.depth} | Order: {category.display_order}
              {hasChildren && ` | Children: ${children.length}`}
            </div>
          </div>
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
            onClick={() => onToggleStatus(category.id, !category.is_active)}
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
      {isExpanded && hasChildren && (
        <div>
          {children
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((child) => (
              <RecursiveCategoryNode
                key={child.id}
                category={child}
                allCategories={allCategories}
                depth={depth + 1}
                expandedNodes={expandedNodes}
                onToggleExpanded={onToggleExpanded}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
                onSetImage={onSetImage}
              />
            ))}
        </div>
      )}
    </div>
  )
}
