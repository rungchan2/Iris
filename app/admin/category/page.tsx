import { createClient } from "@/lib/supabase/server"
import { CategoryManager } from "@/components/admin/category-manager"
import { Category } from "@/types/inquiry.types"

export default async function CategoryPage() {
  const supabase = await createClient()

  // Fetch all categories with representative images
  const { data: categories, error } = await supabase
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
    console.error("Error fetching categories:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Category Management</h1>
      </div>
      <CategoryManager initialCategories={categories as any} />
    </div>
  )
}
