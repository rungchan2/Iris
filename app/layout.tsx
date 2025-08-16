import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { GoogleAnalytics } from "@next/third-parties/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Iris | 나만의 성향을 찾아가는 포토 여정",
  description: "AI 성향 진단으로 당신에게 딱 맞는 사진 스타일과 전문 작가를 추천해드립니다",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    images: "/og-image.jpg",
  },
  twitter: {
    card: "summary_large_image",
    title: "Iris | 나만의 성향을 찾아가는 포토 여정",
    description: "AI 성향 진단으로 당신에게 딱 맞는 사진 스타일과 전문 작가를 추천해드립니다",
    images: "/og-image.jpg",
  },
};

const GA_ID = process.env.GA_ID || "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics gaId={GA_ID} />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
