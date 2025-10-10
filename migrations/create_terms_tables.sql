-- Migration: Create Terms and Terms Sections Tables
-- Description: Creates tables for managing terms of service with versioning support
-- Date: 2025-10-10

-- ============================================
-- STEP 1: Create Tables
-- ============================================

-- Create terms table
CREATE TABLE IF NOT EXISTS public.terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  effective_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add comment to terms table
COMMENT ON TABLE public.terms IS 'Stores terms of service versions with versioning and activation control';

-- Create terms_sections table
CREATE TABLE IF NOT EXISTS public.terms_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  terms_id UUID REFERENCES public.terms(id) ON DELETE CASCADE NOT NULL,
  article_number INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(terms_id, article_number)
);

-- Add comment to terms_sections table
COMMENT ON TABLE public.terms_sections IS 'Stores individual sections/articles for each terms version';

-- ============================================
-- STEP 2: Create Indexes
-- ============================================

-- Index for finding active terms
CREATE INDEX IF NOT EXISTS idx_terms_active ON public.terms(is_active);

-- Index for sorting by effective date
CREATE INDEX IF NOT EXISTS idx_terms_effective_date ON public.terms(effective_date);

-- Index for joining terms_sections to terms
CREATE INDEX IF NOT EXISTS idx_terms_sections_terms_id ON public.terms_sections(terms_id);

-- Index for ordering sections within a terms document
CREATE INDEX IF NOT EXISTS idx_terms_sections_order ON public.terms_sections(terms_id, display_order);

-- ============================================
-- STEP 3: Create Updated At Trigger Function
-- ============================================

-- Create or replace the trigger function for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for terms table
DROP TRIGGER IF EXISTS update_terms_updated_at ON public.terms;
CREATE TRIGGER update_terms_updated_at
  BEFORE UPDATE ON public.terms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for terms_sections table
DROP TRIGGER IF EXISTS update_terms_sections_updated_at ON public.terms_sections;
CREATE TRIGGER update_terms_sections_updated_at
  BEFORE UPDATE ON public.terms_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 4: Enable Row Level Security
-- ============================================

ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_sections ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create RLS Policies for terms table
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous select on terms" ON public.terms;
DROP POLICY IF EXISTS "Allow authenticated select on terms" ON public.terms;
DROP POLICY IF EXISTS "Allow admin insert on terms" ON public.terms;
DROP POLICY IF EXISTS "Allow admin update on terms" ON public.terms;
DROP POLICY IF EXISTS "Allow admin delete on terms" ON public.terms;

-- Allow anonymous users to view terms (read-only)
CREATE POLICY "Allow anonymous select on terms"
  ON public.terms
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to view terms (read-only)
CREATE POLICY "Allow authenticated select on terms"
  ON public.terms
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin users to insert new terms
CREATE POLICY "Allow admin insert on terms"
  ON public.terms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow admin users to update terms
CREATE POLICY "Allow admin update on terms"
  ON public.terms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow admin users to delete terms
CREATE POLICY "Allow admin delete on terms"
  ON public.terms
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- STEP 6: Create RLS Policies for terms_sections table
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous select on terms_sections" ON public.terms_sections;
DROP POLICY IF EXISTS "Allow authenticated select on terms_sections" ON public.terms_sections;
DROP POLICY IF EXISTS "Allow admin insert on terms_sections" ON public.terms_sections;
DROP POLICY IF EXISTS "Allow admin update on terms_sections" ON public.terms_sections;
DROP POLICY IF EXISTS "Allow admin delete on terms_sections" ON public.terms_sections;

-- Allow anonymous users to view terms sections (read-only)
CREATE POLICY "Allow anonymous select on terms_sections"
  ON public.terms_sections
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to view terms sections (read-only)
CREATE POLICY "Allow authenticated select on terms_sections"
  ON public.terms_sections
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin users to insert new terms sections
CREATE POLICY "Allow admin insert on terms_sections"
  ON public.terms_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow admin users to update terms sections
CREATE POLICY "Allow admin update on terms_sections"
  ON public.terms_sections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow admin users to delete terms sections
CREATE POLICY "Allow admin delete on terms_sections"
  ON public.terms_sections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- STEP 7: Grant Permissions
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select to anonymous users (read-only)
GRANT SELECT ON public.terms TO anon;
GRANT SELECT ON public.terms_sections TO anon;

-- Grant all privileges to authenticated users (controlled by RLS)
GRANT ALL ON public.terms TO authenticated;
GRANT ALL ON public.terms_sections TO authenticated;

-- ============================================
-- Verification Queries
-- ============================================

-- To verify the migration was successful, run these queries:

-- 1. Check if tables exist
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('terms', 'terms_sections');

-- 2. Check if indexes exist
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('terms', 'terms_sections');

-- 3. Check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('terms', 'terms_sections');

-- 4. Check if policies exist
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('terms', 'terms_sections');

-- 5. Check if triggers exist
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE event_object_schema = 'public' AND event_object_table IN ('terms', 'terms_sections');
