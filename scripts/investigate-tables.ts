/**
 * 데이터베이스 현재 상태 조사 스크립트
 * - 각 테이블의 레코드 수
 * - auth.users와의 관계
 * - 외래키 제약조건
 *
 * 실행: node --env-file=.env.local --import tsx scripts/investigate-tables.ts
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('='.repeat(80));
  console.log('데이터베이스 현재 상태 조사');
  console.log('='.repeat(80));
  console.log('');

  // 1. 각 테이블의 레코드 수 조회
  console.log('📊 각 테이블의 레코드 수:');
  console.log('-'.repeat(80));

  const tables = ['admins', 'photographers', 'users'];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table as any)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`  ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`  ${table}: ${count ?? 0} 레코드`);
    }
  }

  console.log('');

  // 2. 샘플 데이터 조회
  console.log('📝 샘플 데이터 (각 테이블별 최대 3개):');
  console.log('-'.repeat(80));

  // Admins
  const { data: adminsData } = await supabase
    .from('admins')
    .select('id, email, name, role')
    .limit(3);
  console.log('\n  📌 Admins:');
  adminsData?.forEach(admin => {
    console.log(`    - ${admin.name} (${admin.email}) [${admin.role}]`);
  });

  // Photographers
  const { data: photographersData } = await supabase
    .from('photographers')
    .select('id, email, name, approval_status')
    .limit(3);
  console.log('\n  📌 Photographers:');
  photographersData?.forEach(photographer => {
    console.log(`    - ${photographer.name} (${photographer.email}) [${photographer.approval_status}]`);
  });

  // Users
  const { data: usersData } = await supabase
    .from('users')
    .select('id, email, name')
    .limit(3);
  console.log('\n  📌 Users:');
  usersData?.forEach(user => {
    console.log(`    - ${user.name} (${user.email})`);
  });

  console.log('');
  console.log('');

  // 3. auth.users와의 관계 확인
  console.log('🔗 auth.users와의 관계 확인:');
  console.log('-'.repeat(80));

  // auth.users에 있는 사용자 수
  const { count: authUsersCount } = await supabase
    .rpc('get_auth_users_count' as any)
    .single();

  console.log(`  auth.users 총 레코드 수: 조회 불가 (RPC 함수 필요)`);

  // admins 테이블에서 auth.users에 없는 레코드 확인
  console.log(`\n  각 테이블의 auth.users 존재 여부는 개별 확인 필요`);

  console.log('');
  console.log('');

  // 4. 외래키 관계가 있는 테이블들의 레코드 수
  console.log('🔑 외래키 관계 테이블 레코드 수:');
  console.log('-'.repeat(80));

  const relatedTables = [
    'photographer_profiles',
    'photographer_keywords',
    'products',
    'photos',
    'available_slots',
    'inquiries',
    'payments',
    'matching_results',
    'embedding_jobs',
    'system_settings'
  ];

  for (const table of relatedTables) {
    const { count, error } = await supabase
      .from(table as any)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`  ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`  ${table}: ${count ?? 0} 레코드`);
    }
  }

  console.log('');
  console.log('');

  // 5. photographer_id를 참조하는 테이블 확인
  console.log('👥 photographer_id를 참조하는 테이블별 데이터 존재 여부:');
  console.log('-'.repeat(80));

  const photographerRelatedTables = [
    { name: 'photographer_profiles', column: 'photographer_id' },
    { name: 'photographer_keywords', column: 'photographer_id' },
    { name: 'products', column: 'photographer_id' },
    { name: 'photos', column: 'uploaded_by' },
    { name: 'available_slots', column: 'admin_id' }, // 주의: admin_id인데 photographers 참조
    { name: 'inquiries', column: 'photographer_id' },
    { name: 'payments', column: 'photographer_id' },
    { name: 'matching_results', column: 'photographer_id' },
  ];

  for (const { name, column } of photographerRelatedTables) {
    const { count } = await supabase
      .from(name as any)
      .select('*', { count: 'exact', head: true })
      .not(column, 'is', null);

    console.log(`  ${name}.${column}: ${count ?? 0} 레코드`);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('조사 완료');
  console.log('='.repeat(80));
}

main().catch(console.error);
