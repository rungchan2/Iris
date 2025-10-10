#!/usr/bin/env node

/**
 * Script to execute the terms tables migration using Supabase REST API
 * Run with: node scripts/execute-terms-migration.mjs
 */

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

async function executeSql(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ query: sql })
  })

  return response
}

async function runMigration() {
  console.log('📦 Reading migration file...')

  const migrationPath = join(rootDir, 'migrations', 'create_terms_tables.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf8')

  console.log('✅ Migration file loaded')
  console.log('\n' + '='.repeat(80))
  console.log('IMPORTANT: Please execute this migration manually in Supabase SQL Editor')
  console.log('='.repeat(80))
  console.log('\n📋 Steps to execute:')
  console.log('1. Go to: https://supabase.com/dashboard/project/kypwcsgwjtnkiiwjedcn/sql')
  console.log('2. Create a new query')
  console.log('3. Copy and paste the contents from:')
  console.log('   ' + migrationPath)
  console.log('4. Click "Run" to execute the migration')
  console.log('\n' + '='.repeat(80))
  console.log('\nMigration file path:')
  console.log(migrationPath)
  console.log('\nOr run this command to view the SQL:')
  console.log(`cat ${migrationPath}`)
  console.log('\n' + '='.repeat(80))
}

runMigration().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
