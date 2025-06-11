import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sunset Cinema | 일상을 영화처럼, 시네마틱 프로필",
    short_name: "Sunset Cinema | 일상을 영화처럼, 시네마틱 프로필",
    description: "촬영이 처음인 사람도, 전문 배우도 찍고 가는 개인맞춤형 프로필 사진",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}