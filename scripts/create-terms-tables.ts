/**
 * Script to create terms and terms_sections tables
 * Run with: npx tsx scripts/create-terms-tables.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env.local manually
const envPath = join(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf8')
const envVars: Record<string, string> = {}

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim()
    envVars[key] = value
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSqlStatements() {
  console.log('🚀 Starting terms tables migration...\n')

  const statements = [
    // Step 1: Create terms table
    {
      name: 'Create terms table',
      sql: `
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
      `
    },
    // Step 2: Create terms_sections table
    {
      name: 'Create terms_sections table',
      sql: `
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
      `
    },
    // Step 3: Create indexes
    {
      name: 'Create index on terms.is_active',
      sql: 'CREATE INDEX IF NOT EXISTS idx_terms_active ON public.terms(is_active);'
    },
    {
      name: 'Create index on terms.effective_date',
      sql: 'CREATE INDEX IF NOT EXISTS idx_terms_effective_date ON public.terms(effective_date);'
    },
    {
      name: 'Create index on terms_sections.terms_id',
      sql: 'CREATE INDEX IF NOT EXISTS idx_terms_sections_terms_id ON public.terms_sections(terms_id);'
    },
    {
      name: 'Create index on terms_sections display order',
      sql: 'CREATE INDEX IF NOT EXISTS idx_terms_sections_order ON public.terms_sections(terms_id, display_order);'
    },
    // Step 4: Create trigger function
    {
      name: 'Create update_updated_at_column function',
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    // Step 5: Create triggers
    {
      name: 'Create trigger for terms.updated_at',
      sql: `
        DROP TRIGGER IF EXISTS update_terms_updated_at ON public.terms;
        CREATE TRIGGER update_terms_updated_at
          BEFORE UPDATE ON public.terms
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `
    },
    {
      name: 'Create trigger for terms_sections.updated_at',
      sql: `
        DROP TRIGGER IF EXISTS update_terms_sections_updated_at ON public.terms_sections;
        CREATE TRIGGER update_terms_sections_updated_at
          BEFORE UPDATE ON public.terms_sections
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `
    },
    // Step 6: Enable RLS
    {
      name: 'Enable RLS on terms',
      sql: 'ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on terms_sections',
      sql: 'ALTER TABLE public.terms_sections ENABLE ROW LEVEL SECURITY;'
    },
    // Step 7: Create RLS policies for terms
    {
      name: 'Create RLS policy: anonymous select on terms',
      sql: `
        DROP POLICY IF EXISTS "Allow anonymous select on terms" ON public.terms;
        CREATE POLICY "Allow anonymous select on terms"
          ON public.terms FOR SELECT TO anon USING (true);
      `
    },
    {
      name: 'Create RLS policy: authenticated select on terms',
      sql: `
        DROP POLICY IF EXISTS "Allow authenticated select on terms" ON public.terms;
        CREATE POLICY "Allow authenticated select on terms"
          ON public.terms FOR SELECT TO authenticated USING (true);
      `
    },
    {
      name: 'Create RLS policy: admin insert on terms',
      sql: `
        DROP POLICY IF EXISTS "Allow admin insert on terms" ON public.terms;
        CREATE POLICY "Allow admin insert on terms"
          ON public.terms FOR INSERT TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND users.role = 'admin'
            )
          );
      `
    },
    {
      name: 'Create RLS policy: admin update on terms',
      sql: `
        DROP POLICY IF EXISTS "Allow admin update on terms" ON public.terms;
        CREATE POLICY "Allow admin update on terms"
          ON public.terms FOR UPDATE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND users.role = 'admin'
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND users.role = 'admin'
            )
          );
      `
    },
    {
      name: 'Create RLS policy: admin delete on terms',
      sql: `
        DROP POLICY IF EXISTS "Allow admin delete on terms" ON public.terms;
        CREATE POLICY "Allow admin delete on terms"
          ON public.terms FOR DELETE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND users.role = 'admin'
            )
          );
      `
    },
    // Step 8: Create RLS policies for terms_sections
    {
      name: 'Create RLS policy: anonymous select on terms_sections',
      sql: `
        DROP POLICY IF EXISTS "Allow anonymous select on terms_sections" ON public.terms_sections;
        CREATE POLICY "Allow anonymous select on terms_sections"
          ON public.terms_sections FOR SELECT TO anon USING (true);
      `
    },
    {
      name: 'Create RLS policy: authenticated select on terms_sections',
      sql: `
        DROP POLICY IF EXISTS "Allow authenticated select on terms_sections" ON public.terms_sections;
        CREATE POLICY "Allow authenticated select on terms_sections"
          ON public.terms_sections FOR SELECT TO authenticated USING (true);
      `
    },
    {
      name: 'Create RLS policy: admin insert on terms_sections',
      sql: `
        DROP POLICY IF EXISTS "Allow admin insert on terms_sections" ON public.terms_sections;
        CREATE POLICY "Allow admin insert on terms_sections"
          ON public.terms_sections FOR INSERT TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND users.role = 'admin'
            )
          );
      `
    },
    {
      name: 'Create RLS policy: admin update on terms_sections',
      sql: `
        DROP POLICY IF EXISTS "Allow admin update on terms_sections" ON public.terms_sections;
        CREATE POLICY "Allow admin update on terms_sections"
          ON public.terms_sections FOR UPDATE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND users.role = 'admin'
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND users.role = 'admin'
            )
          );
      `
    },
    {
      name: 'Create RLS policy: admin delete on terms_sections',
      sql: `
        DROP POLICY IF EXISTS "Allow admin delete on terms_sections" ON public.terms_sections;
        CREATE POLICY "Allow admin delete on terms_sections"
          ON public.terms_sections FOR DELETE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND users.role = 'admin'
            )
          );
      `
    },
  ]

  let successCount = 0
  let errorCount = 0

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec', { sql: statement.sql })

      if (error) {
        // Try alternative method using direct SQL execution
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: statement.sql })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        console.log(`✅ ${statement.name}`)
        successCount++
      } else {
        console.log(`✅ ${statement.name}`)
        successCount++
      }
    } catch (err) {
      const error = err as Error
      console.error(`❌ ${statement.name}`)
      console.error(`   Error: ${error.message}\n`)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`Migration Summary: ${successCount} successful, ${errorCount} failed`)
  console.log('='.repeat(80))

  if (errorCount > 0) {
    console.log('\n⚠️  Some statements failed. Please execute the migration manually.')
    console.log('Migration file: migrations/create_terms_tables.sql')
    console.log('Supabase SQL Editor: https://supabase.com/dashboard/project/kypwcsgwjtnkiiwjedcn/sql')
  }

  // Verify tables exist
  console.log('\n🔍 Verifying tables...')
  const { data: termsTable, error: termsError } = await supabase
    .from('terms')
    .select('*')
    .limit(0)

  const { data: sectionsTable, error: sectionsError } = await supabase
    .from('terms_sections')
    .select('*')
    .limit(0)

  if (!termsError) {
    console.log('✅ Table "terms" exists and is accessible')
  } else {
    console.log('❌ Table "terms" not found:', termsError.message)
  }

  if (!sectionsError) {
    console.log('✅ Table "terms_sections" exists and is accessible')
  } else {
    console.log('❌ Table "terms_sections" not found:', sectionsError.message)
  }

  return errorCount === 0
}

// Run the migration
executeSqlStatements()
  .then(success => {
    if (success) {
      console.log('\n✨ Migration completed successfully!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Migration completed with errors. Please check the logs above.')
      process.exit(1)
    }
  })
  .catch(err => {
    console.error('\n💥 Fatal error:', err)
    process.exit(1)
  })
