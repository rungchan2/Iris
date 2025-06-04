"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function DynamicBreadcrumb() {
  const pathname = usePathname()

  const getBreadcrumbTitle = (path: string) => {
    const segments = path.split("/").filter(Boolean)

    if (segments.length <= 1) return "Dashboard"

    const lastSegment = segments[segments.length - 1]

    switch (lastSegment) {
      case "category":
        return "Categories"
      case "photos":
        return "Photos"
      case "my-page":
        return "My Account"
      default:
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
    }
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{getBreadcrumbTitle(pathname)}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
