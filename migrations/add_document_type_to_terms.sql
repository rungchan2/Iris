-- Migration: Add document_type to terms table for multi-document support
-- Date: 2025-10-11
-- Purpose: Support both Terms of Service and Privacy Policy in same table structure

-- 1. Add document_type column with default value
ALTER TABLE terms
  ADD COLUMN document_type TEXT NOT NULL DEFAULT 'terms_of_service';

-- 2. Add check constraint for valid document types
ALTER TABLE terms
  ADD CONSTRAINT terms_document_type_check
  CHECK (document_type IN ('terms_of_service', 'privacy_policy'));

-- 3. Drop existing unique constraint on is_active (if exists)
DROP INDEX IF EXISTS idx_terms_single_active;

-- 4. Create composite unique index: only one active version per document type
CREATE UNIQUE INDEX idx_terms_active_per_type
  ON terms (document_type, is_active)
  WHERE is_active = true;

-- 5. Create index for efficient version lookups per document type
CREATE INDEX idx_terms_type_version
  ON terms (document_type, effective_date DESC);

-- 6. Create index for section ordering optimization
CREATE INDEX idx_sections_display_order
  ON terms_sections (terms_id, display_order);

-- 7. Update existing data to have explicit document_type
UPDATE terms
  SET document_type = 'terms_of_service'
  WHERE document_type = 'terms_of_service';  -- Should be no-op but ensures data consistency

-- 8. Add comment for documentation
COMMENT ON COLUMN terms.document_type IS 'Type of legal document: terms_of_service or privacy_policy';
COMMENT ON INDEX idx_terms_active_per_type IS 'Ensures only one active version per document type';
