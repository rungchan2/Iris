'use client'

import { JsonLd } from './json-ld'
import { generateMatchingFAQSchema, generateWebsiteSchema } from '@/lib/seo/structured-data'

/**
 * Structured data for the matching page
 */
export function MatchingStructuredData() {
  const faqSchema = generateMatchingFAQSchema()
  const websiteSchema = generateWebsiteSchema()

  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={websiteSchema} />
    </>
  )
}
