import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { GoogleAnalytics } from "@next/third-parties/google";
import { getUserCookie } from "@/lib/auth/cookie";
import { GlobalStructuredData } from "@/components/seo/global-structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: {
    default: "kindt | 나만의 성향을 찾아가는 포토 여정",
    template: "%s | kindt"
  },
  description: "AI 성향 진단으로 당신에게 딱 맞는 사진 스타일과 전문 작가를 추천해드립니다. 10개의 질문으로 나에게 완벽한 포토그래퍼를 찾아보세요.",
  keywords: [
    "킨트 사진",
    "킨트",
    "킨트 스투디오",
    "사진작가 추천",
    "포토그래퍼 매칭",
    "AI 사진작가 매칭",
    "사진 촬영 예약",
    "프로필 사진",
    "웨딩 촬영",
    "가족 사진",
    "스냅 사진",
    "포토그래퍼 찾기",
    "사진 스타일 진단"
  ],
  authors: [{ name: "kindt" }],
  creator: "kindt",
  publisher: "kindt",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "kindt",
    title: "kindt | 나만의 성향을 찾아가는 포토 여정",
    description: "AI 성향 진단으로 당신에게 딱 맞는 사진 스타일과 전문 작가를 추천해드립니다",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "kindt - AI 사진작가 매칭 플랫폼"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "kindt | 나만의 성향을 찾아가는 포토 여정",
    description: "AI 성향 진단으로 당신에게 딱 맞는 사진 스타일과 전문 작가를 추천해드립니다",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const GA_ID = process.env.GA_ID || "G-05DFZQYX6N";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserCookie();

  return (
    <html lang="ko">
      <head>
        <GlobalStructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics gaId={GA_ID} />
        <Providers serverUser={user}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
