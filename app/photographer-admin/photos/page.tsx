import { createClient } from "@/lib/supabase/server"
import PhotoManager from "@/components/admin/photo-manager"

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; unassigned?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // Get user for upload permissions
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user is admin (has user_metadata.user_type === 'admin')
  const isAdmin = user?.user_metadata?.user_type === 'admin'

  // Fetch categories for filter
  const { data: categories } = await supabase.from("categories").select("*").order("path")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">사진 관리</h1>
        <p className="text-muted-foreground">사진을 업로드하고 카테고리로 분류하세요.</p>
      </div>

      <PhotoManager
        categories={categories?.map(cat => ({
          ...cat,
          path: cat.path || '',
          depth: cat.depth ?? 0,
          is_active: cat.is_active ?? true
        })) || []}
        userId={user?.id || ""}
        isAdmin={isAdmin}
        initialPage={Number.parseInt(params.page || "1")}
        filterCategory={params.category}
        showUnassigned={params.unassigned === "true"}
        basePath="/photographer-admin/photos"
      />
    </div>
  )
}
