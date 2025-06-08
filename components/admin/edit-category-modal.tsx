"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Category } from "@/lib/hooks/use-categories"

interface EditCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, updates: { name: string; parent_id: string | null }) => void
  category: Category | null
  categories: Category[]
}

export function EditCategoryModal({
  isOpen,
  onClose,
  onSave,
  category,
  categories,
}: EditCategoryModalProps) {
  const [name, setName] = useState("")
  const [parentId, setParentId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (category) {
      setName(category.name)
      setParentId(category.parent_id)
    }
  }, [category])

  const handleClose = () => {
    setName("")
    setParentId(null)
    setIsSubmitting(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !name.trim()) return

    setIsSubmitting(true)

    try {
      await onSave(category.id, {
        name: name.trim(),
        parent_id: parentId,
      })
      handleClose()
    } catch (error) {
      console.error("Error updating category:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Build parent options (exclude self and descendants)
  const getParentOptions = () => {
    if (!category) return []

    const isDescendant = (targetId: string, ancestorId: string): boolean => {
      const target = categories.find((c) => c.id === targetId)
      if (!target || !target.parent_id) return false
      
      if (target.parent_id === ancestorId) return true
      return isDescendant(target.parent_id, ancestorId)
    }

    const availableCategories = categories.filter((cat) => {
      // Exclude self
      if (cat.id === category.id) return false
      // Exclude descendants
      if (isDescendant(cat.id, category.id)) return false
      return true
    })

    // Build hierarchical paths
    const categoryMap = new Map<string, Category>()
    availableCategories.forEach((cat) => {
      categoryMap.set(cat.id, cat)
    })

    const buildPath = (cat: Category): string => {
      if (!cat.parent_id) return cat.name
      const parent = categoryMap.get(cat.parent_id)
      if (!parent) return cat.name
      return `${buildPath(parent)} > ${cat.name}`
    }

    const options = availableCategories.map((cat) => ({
      id: cat.id,
      path: buildPath(cat),
      depth: cat.depth,
    }))

    // Sort by path
    options.sort((a, b) => a.path.localeCompare(b.path))

    // Add root option
    return [{ id: null, path: "루트 (최상위)", depth: 0 }, ...options]
  }

  const parentOptions = getParentOptions()

  if (!category) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>카테고리 수정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">카테고리 이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="카테고리 이름 입력"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent">부모 카테고리</Label>
            <Select
              value={parentId || "root"}
              onValueChange={(value) =>
                setParentId(value === "root" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="부모 카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {parentOptions.map((option) => (
                  <SelectItem
                    key={option.id || "root"}
                    value={option.id || "root"}
                  >
                    {option.path}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              현재 깊이: {category.depth} → 새 깊이: {parentId ? (parentOptions.find(opt => opt.id === parentId)?.depth || 0) + 1 : 1}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? "수정중..." : "수정 완료"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 