"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

function DynamicBreadcrumbContent() {
  const pathname = usePathname()

  const getBreadcrumbTitle = (path: string) => {
    const segments = path.split("/").filter(Boolean)

    if (segments.length <= 1) return "대시보드"

    const lastSegment = segments[segments.length - 1]

    switch (lastSegment) {
      case "category":
        return "카테고리"
      case "photos":
        return "사진 관리"
      case "my-page":
        return "내 계정"
      case "schedule":
        return "일정 관리"
      default:
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
    }
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/admin">관리자</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{getBreadcrumbTitle(pathname)}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export const DynamicBreadcrumb = dynamic(() => Promise.resolve(DynamicBreadcrumbContent), {
  ssr: false,
  loading: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/admin">관리자</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>로딩중...</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
})
