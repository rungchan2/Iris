import { createClient } from "@/lib/supabase/server";
import { GalleryClient, Photo } from "./gallery-client";
import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Photo Gallery | 시네마틱 프로필",
  description: "시네마틱 프로필 촬영 작품 갤러리를 확인해보세요.",
};

export default async function GalleryPage() {
  const supabase = await createClient();

  try {
    // Fetch initial photos with category information
    const { data: photos, error } = await supabase
      .from("photos")
      .select(
        `
        *,
        photo_categories (
          categories (
            id,
            name,
            path
          )
        )
      `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching photos:", error);
      return (
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-8">Photo Gallery</h1>
          <p className="text-muted-foreground">
            갤러리를 불러오는 중 오류가 발생했습니다.
          </p>
        </div>
      );
    }

    return (
      <>
        <Toaster position="top-right" richColors />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto py-8 px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Photo Gallery</h1>
              <p className="text-lg text-muted-foreground">
                시네마틱 프로필 촬영 작품들을 만나보세요
              </p>
            </div>
            <GalleryClient initialPhotos={photos as Photo[]} />
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error("Gallery page error:", error);
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Photo Gallery</h1>
        <p className="text-muted-foreground">갤러리를 불러올 수 없습니다.</p>
      </div>
    );
  }
}
