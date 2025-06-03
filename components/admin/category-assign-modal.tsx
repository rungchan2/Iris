"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Category {
  id: string
  parent_id: string | null
  name: string
  path: string
  depth: number
}

interface CategoryAssignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  selectedPhotos: string[]
  onAssign: (categoryIds: string[]) => void
}

export function CategoryAssignModal({
  open,
  onOpenChange,
  categories,
  selectedPhotos,
  onAssign,
}: CategoryAssignModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")

  const handleCategoryToggle = (categoryId: string) => {
    const newSelection = new Set(selectedCategories)
    if (newSelection.has(categoryId)) {
      newSelection.delete(categoryId)
    } else {
      newSelection.add(categoryId)
    }
    setSelectedCategories(newSelection)
  }

  const handleAssign = () => {
    onAssign(Array.from(selectedCategories))
    setSelectedCategories(new Set())
    setSearchTerm("")
  }

  const handleClose = () => {
    setSelectedCategories(new Set())
    setSearchTerm("")
    onOpenChange(false)
  }

  // Filter categories by search term
  const filteredCategories = categories.filter((cat) => cat.path.toLowerCase().includes(searchTerm.toLowerCase()))

  // Build hierarchical structure
  const buildCategoryTree = (parentId: string | null = null, depth = 0): Category[] => {
    return filteredCategories
      .filter((cat) => cat.parent_id === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap((cat) => [cat, ...buildCategoryTree(cat.id, depth + 1)])
  }

  const categoryTree = buildCategoryTree()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Categories to {selectedPhotos.length} Photos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Category List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {categoryTree.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center space-x-2"
                  style={{ paddingLeft: `${category.depth * 16}px` }}
                >
                  <Checkbox
                    checked={selectedCategories.has(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <label className="text-sm cursor-pointer flex-1" onClick={() => handleCategoryToggle(category.id)}>
                    {category.name}
                    <span className="text-muted-foreground ml-2">({category.path})</span>
                  </label>
                </div>
              ))}

              {filteredCategories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No categories found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Selected Categories Summary */}
          {selectedCategories.size > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Selected categories ({selectedCategories.size}):</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedCategories)
                  .slice(0, 5)
                  .map((categoryId) => {
                    const category = categories.find((c) => c.id === categoryId)
                    return (
                      <span key={categoryId} className="text-xs bg-background px-2 py-1 rounded">
                        {category?.name}
                      </span>
                    )
                  })}
                {selectedCategories.size > 5 && (
                  <span className="text-xs bg-background px-2 py-1 rounded">+{selectedCategories.size - 5} more</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={selectedCategories.size === 0}>
            Assign {selectedCategories.size} Categories
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
