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
  title: "Sunset Cinema | 일상을 영화처럼, 시네마틱 프로필",
  description: "촬영이 처음인 사람도, 전문 배우도 찍고 가는 개인맞춤형 프로필 사진",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    images: "/og-image.jpg",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sunset Cinema | 일상을 영화처럼, 시네마틱 프로필",
    description: "촬영이 처음인 사람도, 전문 배우도 찍고 가는 개인맞춤형 프로필 사진",
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
