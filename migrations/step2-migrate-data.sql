-- ==========================================
-- Step 2: 기존 데이터 마이그레이션
-- ==========================================

-- 2.1 admins → users_new
INSERT INTO users_new (id, email, name, role, phone, created_at, updated_at)
SELECT
  id,
  email,
  name,
  'admin',
  phone,
  created_at,
  updated_at
FROM admins
ON CONFLICT (id) DO NOTHING;

-- 2.2 photographers → users_new
INSERT INTO users_new (id, email, name, role, phone, created_at, updated_at)
SELECT
  id,
  email,
  name,
  'photographer',
  phone,
  created_at,
  updated_at
FROM photographers
ON CONFLICT (id) DO NOTHING;

-- 2.3 기존 users → users_new
INSERT INTO users_new (id, email, name, role, phone, created_at, updated_at)
SELECT
  id,
  email,
  name,
  'user',
  phone,
  created_at,
  updated_at
FROM users
ON CONFLICT (id) DO NOTHING;

-- 검증: 레코드 수 확인
SELECT
  'admins' as source_table, COUNT(*) as count FROM admins
UNION ALL
SELECT 'photographers', COUNT(*) FROM photographers
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'users_new', COUNT(*) FROM users_new
ORDER BY source_table;

-- 검증: role별 분포 확인
SELECT role, COUNT(*) as count
FROM users_new
GROUP BY role
ORDER BY role;
