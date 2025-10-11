"use client"

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

function UserBreadcrumbContent() {
  const pathname = usePathname()

  const getBreadcrumbTitle = (path: string) => {
    const segments = path.split("/").filter(Boolean)

    if (segments.length <= 1) return "마이페이지"

    const lastSegment = segments[segments.length - 1]

    switch (lastSegment) {
      case "inquiries":
        return "예약 내역"
      case "payments":
        return "결제 내역"
      case "profile":
        return "내 프로필"
      default:
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
    }
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/user">마이페이지</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{getBreadcrumbTitle(pathname)}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export const UserBreadcrumb = dynamic(() => Promise.resolve(UserBreadcrumbContent), {
  ssr: false,
  loading: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/user">마이페이지</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>로딩중...</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
})
