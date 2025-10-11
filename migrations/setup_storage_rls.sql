-- ============================================
-- Storage RLS Setup for Photo Uploads
-- ============================================
-- 작가 권한을 가진 사용자만 사진 업로드 가능
-- 누구나 공개 사진 조회 가능
-- ============================================
-- 모든 업로드는 photos 버킷을 사용하며,
-- 사용자별 폴더 구조로 관리 (user_id/filename)
-- ============================================

-- ============================================
-- 1. Enable RLS on storage.objects
-- ============================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


-- ============================================
-- 2. Storage RLS Policies for photos bucket
-- ============================================

-- SELECT: 누구나 공개 사진 조회 가능
DROP POLICY IF EXISTS "photos_select_public" ON storage.objects;
CREATE POLICY "photos_select_public"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos'
);


-- INSERT: photographer 권한을 가진 사용자만 업로드 가능
-- 본인의 폴더(user_id/)에만 업로드 가능
DROP POLICY IF EXISTS "photos_insert_photographer" ON storage.objects;
CREATE POLICY "photos_insert_photographer"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos'
  AND public.is_photographer()
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- UPDATE: photographer 본인 파일만 업데이트 가능 (관리자는 모든 파일)
DROP POLICY IF EXISTS "photos_update_own_or_admin" ON storage.objects;
CREATE POLICY "photos_update_own_or_admin"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
)
WITH CHECK (
  bucket_id = 'photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
);


-- DELETE: photographer 본인 파일 또는 관리자만 삭제 가능
DROP POLICY IF EXISTS "photos_delete_own_or_admin" ON storage.objects;
CREATE POLICY "photos_delete_own_or_admin"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
);


-- ============================================
-- 3. Verify Policies (Optional - for testing)
-- ============================================
-- 정책이 제대로 적용되었는지 확인
/*
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'photos_%'
ORDER BY policyname;
*/


-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Storage RLS 정책이 성공적으로 적용되었습니다.';
  RAISE NOTICE '';
  RAISE NOTICE '📋 적용된 정책:';
  RAISE NOTICE '  - photos 버킷: photographer만 업로드 (본인 폴더), 누구나 조회';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 권한 요구사항:';
  RAISE NOTICE '  - SELECT: 누구나';
  RAISE NOTICE '  - INSERT: photographer + 본인 폴더에만';
  RAISE NOTICE '  - UPDATE/DELETE: 본인 파일 또는 관리자';
  RAISE NOTICE '';
  RAISE NOTICE '📁 폴더 구조:';
  RAISE NOTICE '  - photos/{user_id}/{timestamp}_{random}.{ext}';
  RAISE NOTICE '  - 회원가입: photos/{user_id}/portfolio_*.{ext}';
  RAISE NOTICE '  - 대시보드: photos/{user_id}/photo_*.{ext}';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  주의사항:';
  RAISE NOTICE '  - 회원가입 시 반드시 로그인 후 업로드해야 함';
  RAISE NOTICE '  - photographer_signup_form.tsx (line 256-291)에서 이미 구현됨';
  RAISE NOTICE '  - 기존 photo-uploader.tsx와 동일한 패턴 사용';
END $$;
