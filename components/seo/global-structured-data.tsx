'use client'

import { JsonLd } from './json-ld'
import {
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateWebsiteSchema
} from '@/lib/seo/structured-data'

/**
 * Global structured data for all pages
 */
export function GlobalStructuredData() {
  const organizationSchema = generateOrganizationSchema()
  const localBusinessSchema = generateLocalBusinessSchema()
  const websiteSchema = generateWebsiteSchema()

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={localBusinessSchema} />
      <JsonLd data={websiteSchema} />
    </>
  )
}
