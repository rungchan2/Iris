-- ==========================================
-- Step 3: 외래키 업데이트
-- ==========================================

-- 3.1 admins 참조 FK → users_new 참조로 변경
-- ==========================================

-- embedding_jobs.requested_by
ALTER TABLE embedding_jobs
  DROP CONSTRAINT IF EXISTS embedding_jobs_requested_by_fkey;
ALTER TABLE embedding_jobs
  ADD CONSTRAINT embedding_jobs_requested_by_fkey
  FOREIGN KEY (requested_by) REFERENCES users_new(id);

-- system_settings.updated_by
ALTER TABLE system_settings
  DROP CONSTRAINT IF EXISTS system_settings_updated_by_fkey;
ALTER TABLE system_settings
  ADD CONSTRAINT system_settings_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES users_new(id);

-- products.approved_by
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_approved_by_fkey;
ALTER TABLE products
  ADD CONSTRAINT products_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES users_new(id);

-- stories.moderated_by
ALTER TABLE stories
  DROP CONSTRAINT IF EXISTS stories_moderated_by_fkey;
ALTER TABLE stories
  ADD CONSTRAINT stories_moderated_by_fkey
  FOREIGN KEY (moderated_by) REFERENCES users_new(id);

-- 3.2 photographers 참조 FK → users_new 참조로 변경
-- ==========================================

-- products.created_by
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_created_by_fkey;
ALTER TABLE products
  ADD CONSTRAINT products_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users_new(id);

-- products.photographer_id
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_photographer_id_fkey;
ALTER TABLE products
  ADD CONSTRAINT products_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- photographer_profiles.photographer_id
ALTER TABLE photographer_profiles
  DROP CONSTRAINT IF EXISTS photographer_profiles_photographer_id_fkey;
ALTER TABLE photographer_profiles
  ADD CONSTRAINT photographer_profiles_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- photographer_keywords.photographer_id
ALTER TABLE photographer_keywords
  DROP CONSTRAINT IF EXISTS photographer_keywords_photographer_id_fkey;
ALTER TABLE photographer_keywords
  ADD CONSTRAINT photographer_keywords_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- photos.uploaded_by
ALTER TABLE photos
  DROP CONSTRAINT IF EXISTS photos_uploaded_by_fkey;
ALTER TABLE photos
  ADD CONSTRAINT photos_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES users_new(id);

-- available_slots.admin_id (photographers 참조)
ALTER TABLE available_slots
  DROP CONSTRAINT IF EXISTS available_slots_admin_id_fkey;
ALTER TABLE available_slots
  ADD CONSTRAINT available_slots_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES users_new(id);

-- inquiries.photographer_id
ALTER TABLE inquiries
  DROP CONSTRAINT IF EXISTS inquiries_photographer_id_fkey;
ALTER TABLE inquiries
  ADD CONSTRAINT inquiries_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- payments.photographer_id
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_photographer_id_fkey;
ALTER TABLE payments
  ADD CONSTRAINT payments_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- matching_results.photographer_id
ALTER TABLE matching_results
  DROP CONSTRAINT IF EXISTS matching_results_photographer_id_fkey;
ALTER TABLE matching_results
  ADD CONSTRAINT matching_results_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- settlement_items.photographer_id
ALTER TABLE settlement_items
  DROP CONSTRAINT IF EXISTS settlement_items_photographer_id_fkey;
ALTER TABLE settlement_items
  ADD CONSTRAINT settlement_items_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- settlements.photographer_id
ALTER TABLE settlements
  DROP CONSTRAINT IF EXISTS settlements_photographer_id_fkey;
ALTER TABLE settlements
  ADD CONSTRAINT settlements_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- user_feedback.photographer_id
ALTER TABLE user_feedback
  DROP CONSTRAINT IF EXISTS user_feedback_photographer_id_fkey;
ALTER TABLE user_feedback
  ADD CONSTRAINT user_feedback_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- 3.3 users 참조 FK → users_new 참조로 변경
-- ==========================================

-- inquiries.user_id
ALTER TABLE inquiries
  DROP CONSTRAINT IF EXISTS inquiries_user_id_fkey;
ALTER TABLE inquiries
  ADD CONSTRAINT inquiries_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users_new(id);

-- matching_sessions.user_id
ALTER TABLE matching_sessions
  DROP CONSTRAINT IF EXISTS matching_sessions_user_id_fkey;
ALTER TABLE matching_sessions
  ADD CONSTRAINT matching_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users_new(id);

-- payments.user_id
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
ALTER TABLE payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users_new(id);

-- coupons.user_id
ALTER TABLE coupons
  DROP CONSTRAINT IF EXISTS coupons_user_id_fkey;
ALTER TABLE coupons
  ADD CONSTRAINT coupons_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users_new(id);

-- stories.user_id
ALTER TABLE stories
  DROP CONSTRAINT IF EXISTS stories_user_id_fkey;
ALTER TABLE stories
  ADD CONSTRAINT stories_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users_new(id);

-- 검증: users_new를 참조하는 외래키 확인
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users_new'
ORDER BY tc.table_name, kcu.column_name;
