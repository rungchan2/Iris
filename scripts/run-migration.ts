/**
 * Users 테이블 통합 마이그레이션 실행 스크립트
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Users 테이블 통합 마이그레이션 시작...\n');

  // SQL 파일 읽기
  const sqlPath = join(process.cwd(), 'migrations', 'users-table-migration.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  // SQL을 단계별로 분리 (Phase별로)
  const phases = sql.split(/-- Phase \d+:/);

  console.log(`📝 총 ${phases.length - 1}개 Phase 실행 예정\n`);

  // 각 Phase별로 실행
  for (let i = 1; i < phases.length; i++) {
    const phaseContent = phases[i].trim();
    const phaseTitle = phaseContent.split('\n')[0].trim();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Phase ${i}: ${phaseTitle}`);
    console.log('='.repeat(60));

    // Phase 내의 각 SQL 문 실행
    const statements = phaseContent
      .split('\n')
      .filter(line => !line.startsWith('--') && line.trim())
      .join('\n')
      .split(';')
      .filter(stmt => stmt.trim());

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;

      // 검증 쿼리는 건너뛰기
      if (trimmed.includes('주석 처리')) continue;

      try {
        const { error } = await supabase.rpc('exec_sql' as any, { sql_query: trimmed + ';' });

        if (error) {
          // 이미 존재하는 객체 에러는 무시
          if (error.message?.includes('already exists')) {
            console.log('  ⚠️  이미 존재함 (건너뜀)');
            continue;
          }
          throw error;
        }

        console.log('  ✅ 성공:', trimmed.substring(0, 50) + '...');
      } catch (error: any) {
        console.error('  ❌ 오류:', error.message);
        console.error('  SQL:', trimmed.substring(0, 100));

        // 치명적 오류인 경우 중단
        if (!error.message?.includes('already exists')) {
          throw error;
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ 마이그레이션 완료!');
  console.log('='.repeat(60));

  // 결과 검증
  await verifyMigration();
}

async function verifyMigration() {
  console.log('\n📊 마이그레이션 결과 검증 중...\n');

  // 각 테이블의 레코드 수 확인
  const tables = ['admins', 'photographers', 'users', 'users_new'];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`  ${table}: ❌ ${error.message}`);
    } else {
      console.log(`  ${table}: ${count ?? 0} 레코드`);
    }
  }

  console.log('\n');
}

// 실행
runMigration().catch(error => {
  console.error('\n💥 마이그레이션 실패:', error);
  process.exit(1);
});
