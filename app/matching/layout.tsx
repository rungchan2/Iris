import { Metadata } from 'next'
import { generateMatchingMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = generateMatchingMetadata()

export default function MatchingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
