"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Category } from "@/components/admin/category-manager"

interface AddCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (parentId: string | null, name: string, representativeImageId?: string) => void
  categories: Category[]
}

export function AddCategoryModal({ isOpen, onClose, onAdd, categories }: AddCategoryModalProps) {
  const [name, setName] = useState("")
  const [parentId, setParentId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await onAdd(parentId, name.trim())
      setName("")
      setParentId(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setName("")
    setParentId(null)
    onClose()
  }

  // Build options for parent selector
  const buildParentOptions = () => {
    const options = [{ id: null, name: "Root Level", path: "Root" }]

    const addCategoryOptions = (cats: Category[], prefix = "") => {
      cats
        .filter((cat) => cat.depth < 10) // Only allow parents that won't exceed max depth
        .sort((a, b) => a.display_order - b.display_order)
        .forEach((cat) => {
          options.push({
            id: cat.id,
            name: cat.name,
            path: prefix + cat.name,
          })

          // Add children
          const children = categories.filter((c) => c.parent_id === cat.id)
          if (children.length > 0) {
            addCategoryOptions(children, prefix + cat.name + " > ")
          }
        })
    }

    const rootCategories = categories.filter((cat) => cat.parent_id === null)
    addCategoryOptions(rootCategories)

    return options
  }

  const parentOptions = buildParentOptions()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parent">Parent Category</Label>
            <Select value={parentId || "root"} onValueChange={(value) => setParentId(value === "root" ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent category" />
              </SelectTrigger>
              <SelectContent>
                {parentOptions.map((option) => (
                  <SelectItem key={option.id || "root"} value={option.id || "root"}>
                    {option.path}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
