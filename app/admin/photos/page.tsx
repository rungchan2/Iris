import { createClient } from "@/lib/supabase/server"
import { PhotoManager } from "@/components/admin/photo-manager"

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: { page?: string; category?: string; unassigned?: string }
}) {
  const supabase = await createClient()

  // Get user for upload permissions
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch categories for filter
  const { data: categories } = await supabase.from("categories").select("*").order("path")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Photo Management</h1>
        <p className="text-muted-foreground">Upload and categorize photos efficiently</p>
      </div>

      <PhotoManager
        categories={categories || []}
        userId={user?.id || ""}
        initialPage={Number.parseInt(searchParams.page || "1")}
        filterCategory={searchParams.category}
        showUnassigned={searchParams.unassigned === "true"}
      />
    </div>
  )
}
