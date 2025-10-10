#!/usr/bin/env node

/**
 * Script to execute the terms tables migration
 * Run with: node scripts/run-terms-migration.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

dotenv.config({ path: join(rootDir, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('📦 Loading migration file...')

  const migrationPath = join(rootDir, 'migrations', 'create_terms_tables.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf8')

  console.log('🚀 Executing migration...\n')

  // Split by semicolons but keep SQL blocks together
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'

    // Skip comments-only statements
    if (statement.trim().match(/^--/)) continue

    // Extract statement type for logging
    const statementType = statement
      .split('\n')
      .find(line => !line.trim().startsWith('--'))
      ?.trim()
      .split(/\s+/)
      .slice(0, 3)
      .join(' ') || 'SQL'

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

      if (error) {
        // Some errors might be benign (like "already exists")
        if (error.message.includes('already exists')) {
          console.log(`⚠️  ${statementType} - already exists, skipping`)
        } else {
          console.error(`❌ ${statementType} - FAILED`)
          console.error(`   Error: ${error.message}`)
          errorCount++
        }
      } else {
        console.log(`✅ ${statementType}`)
        successCount++
      }
    } catch (err) {
      console.error(`❌ ${statementType} - EXCEPTION`)
      console.error(`   ${err.message}`)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`Migration completed: ${successCount} successful, ${errorCount} errors`)
  console.log('='.repeat(60))

  // Verify tables exist
  console.log('\n🔍 Verifying tables...')

  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['terms', 'terms_sections'])

  if (tablesError) {
    console.error('❌ Could not verify tables:', tablesError.message)
  } else {
    console.log(`✅ Found ${tables?.length || 0} tables:`, tables?.map(t => t.table_name).join(', '))
  }

  return errorCount === 0
}

// Run migration
runMigration()
  .then(success => {
    if (success) {
      console.log('\n✨ Migration completed successfully!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Migration completed with errors')
      process.exit(1)
    }
  })
  .catch(err => {
    console.error('\n💥 Migration failed:', err)
    process.exit(1)
  })
