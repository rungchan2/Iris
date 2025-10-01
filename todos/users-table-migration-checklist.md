# Users 테이블 통합 마이그레이션 체크리스트

## 📋 Overview
**목표**: admins, photographers, users 테이블을 단일 users 테이블로 통합  
**예상 소요시간**: 2-3일  
**위험도**: 높음 (모든 인증/권한 시스템 영향)  
**롤백 계획**: Phase별 체크포인트에서 이전 상태로 복원 가능

---

## Phase 1: 준비 및 백업 (Day 1 Morning)

### 데이터베이스 백업
- [ ] Supabase 대시보드에서 전체 데이터베이스 백업 생성
- [ ] 현재 테이블 구조 SQL 덤프 저장
  - [ ] admins 테이블 구조 및 데이터
  - [ ] photographers 테이블 구조 및 데이터  
  - [ ] users 테이블 구조 및 데이터
  - [ ] photographer_profiles 테이블 구조 및 데이터
- [ ] 모든 RLS 정책 백업 (SQL로 export)
- [ ] 현재 외래키 관계 문서화

### 영향받는 테이블 목록 작성
- [ ] photographer_id를 참조하는 모든 테이블 확인
  - [ ] photos (photographer_id)
  - [ ] products (photographer_id)
  - [ ] available_slots (photographer_id)
  - [ ] inquiries (photographer_id)
  - [ ] reviews (photographer_id)
  - [ ] matching_results (photographer_id)
  - [ ] photographer_profiles (photographer_id)
  - [ ] photographer_keywords (photographer_id)
- [ ] admin_id를 참조하는 모든 테이블 확인
  - [ ] system_settings (updated_by)
  - [ ] embedding_jobs (requested_by)
  - [ ] 기타 audit 필드들
- [ ] updated_by, created_by 필드 있는 테이블 확인

---

## Phase 2: 스키마 설계 및 생성 (Day 1 Afternoon)

### 새 users 테이블 생성
- [ ] 새 users 테이블 DDL 작성
  ```sql
  CREATE TABLE public.users_new (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'photographer', 'admin')),
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] 인덱스 생성
  ```sql
  CREATE INDEX idx_users_new_role ON users_new(role);
  CREATE INDEX idx_users_new_email ON users_new(email);
  CREATE INDEX idx_users_new_created_at ON users_new(created_at DESC);
  ```

### Auth 트리거 설정
- [ ] auth.users 생성 시 자동으로 users_new 레코드 생성하는 트리거
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $$
  BEGIN
    INSERT INTO public.users_new (id, email, name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
- [ ] 트리거 연결
  ```sql
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  ```

### photographer_profiles 테이블 조정
- [ ] photographer_id FK를 users_new(id)로 변경 준비
- [ ] 제약조건 이름 확인 및 문서화

---

## Phase 3: 데이터 마이그레이션 (Day 1 Evening)

### 기존 데이터 이동
- [ ] admins → users_new 마이그레이션
  ```sql
  INSERT INTO users_new (id, email, name, role, created_at, updated_at)
  SELECT id, email, name, 'admin', created_at, updated_at
  FROM admins;
  ```
- [ ] photographers → users_new 마이그레이션
  ```sql
  INSERT INTO users_new (id, email, name, role, created_at, updated_at)
  SELECT id, email, name, 'photographer', created_at, updated_at
  FROM photographers;
  ```
- [ ] 기존 users → users_new 마이그레이션 (있다면)
  ```sql
  INSERT INTO users_new (id, email, name, role, phone, created_at)
  SELECT id, email, name, 'user', phone, created_at
  FROM users
  WHERE NOT EXISTS (SELECT 1 FROM users_new WHERE users_new.id = users.id);
  ```

### 데이터 무결성 검증
- [ ] users_new 레코드 수 = admins + photographers + users 레코드 수
- [ ] 모든 auth.users가 users_new에 존재하는지 확인
- [ ] 중복 email 체크
- [ ] NULL 값 체크 (name, role 필수 필드)

---

## Phase 4: 외래키 업데이트 (Day 2 Morning)

### FK 참조 변경 스크립트 작성
- [ ] photos 테이블
  ```sql
  ALTER TABLE photos 
    DROP CONSTRAINT photos_photographer_id_fkey;
  ALTER TABLE photos
    ADD CONSTRAINT photos_photographer_id_fkey 
    FOREIGN KEY (photographer_id) REFERENCES users_new(id);
  ```
- [ ] products 테이블
  ```sql
  ALTER TABLE products 
    DROP CONSTRAINT products_photographer_id_fkey;
  ALTER TABLE products
    ADD CONSTRAINT products_photographer_id_fkey 
    FOREIGN KEY (photographer_id) REFERENCES users_new(id);
  ```
- [ ] available_slots 테이블 FK 업데이트
- [ ] inquiries 테이블 FK 업데이트
- [ ] reviews 테이블 FK 업데이트
- [ ] matching_results 테이블 FK 업데이트
- [ ] photographer_profiles 테이블 FK 업데이트
- [ ] photographer_keywords 테이블 FK 업데이트
- [ ] system_settings의 updated_by FK 업데이트
- [ ] embedding_jobs의 requested_by FK 업데이트

### 컬럼명 변경 (선택사항)
- [ ] photographer_id → user_id 변경 여부 결정
- [ ] 변경 시 모든 관련 테이블 UPDATE

---

## Phase 5: RLS 정책 재구성 (Day 2 Afternoon)

### 기존 RLS 정책 제거
- [ ] admins 테이블 RLS 정책 백업 후 제거
- [ ] photographers 테이블 RLS 정책 백업 후 제거
- [ ] 기존 users 테이블 RLS 정책 백업 후 제거

### 새로운 RLS 정책 생성
- [ ] users_new 테이블 기본 정책
  ```sql
  -- 자기 자신 조회
  CREATE POLICY "Users can view own profile" ON users_new
    FOR SELECT USING (auth.uid() = id);
  
  -- 관리자는 모든 사용자 조회
  CREATE POLICY "Admins can view all users" ON users_new
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM users_new 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  ```
- [ ] 각 테이블별 role 기반 정책 생성
  - [ ] photos 테이블 정책
  - [ ] products 테이블 정책
  - [ ] inquiries 테이블 정책
  - [ ] available_slots 테이블 정책
  - [ ] reviews 테이블 정책

### RLS 정책 테스트
- [ ] user role로 테스트
- [ ] photographer role로 테스트
- [ ] admin role로 테스트

---

## Phase 6: 프론트엔드 수정 (Day 2 Evening - Day 3)

### TypeScript 타입 재생성
- [ ] Supabase 타입 재생성
  ```bash
  npm run gen-types
  ```
- [ ] 타입 오류 확인 및 수정

### Auth Hook 구현
- [ ] lib/hooks/useAuth.ts 생성
  ```typescript
  export function useAuth() {
    // role 기반 권한 체크 로직
  }
  ```
- [ ] useUser hook 수정
- [ ] usePhotographer hook 수정
- [ ] useAdmin hook 수정

### 로그인/회원가입 플로우 수정
- [ ] app/login/page.tsx 수정
  - [ ] role 체크 로직을 users_new 테이블 기반으로 변경
  - [ ] 리다이렉션 로직 수정
- [ ] components/login-form.tsx 수정
- [ ] components/signup-form.tsx 수정
- [ ] 작가 회원가입 페이지 분리
  - [ ] app/signup/photographer/page.tsx 생성
  - [ ] 작가 전용 회원가입 폼 구현
  - [ ] role='photographer' 자동 설정

### 구글 로그인 처리
- [ ] lib/auth/google.ts 수정
  - [ ] 첫 로그인 시 기본 role 할당 로직
  - [ ] user_metadata 처리 수정
- [ ] app/auth/callback/route.ts 수정
  - [ ] users_new 테이블 체크 로직 추가
  - [ ] role 기반 리다이렉션

### 권한 관리 시스템 수정
- [ ] lib/auth/permissions.ts 전면 개편
  - [ ] role 기반 권한 체크 함수
  - [ ] 기존 3-tier에서 role 기반으로 변경
- [ ] components/auth/permission-guard.tsx 수정
  - [ ] users_new 테이블의 role 체크

### Server Actions 수정
- [ ] lib/actions/photographers.ts
  - [ ] users_new 테이블 참조로 변경
  - [ ] role 체크 로직 수정
- [ ] lib/actions/admins.ts
  - [ ] users_new 테이블 참조로 변경
- [ ] lib/actions/users.ts
  - [ ] 통합된 user 관리 로직 구현
- [ ] lib/actions/inquiries.ts
  - [ ] photographer_id 참조 확인
- [ ] lib/actions/products.ts
  - [ ] photographer_id 참조 확인

### 관리자 페이지 수정
- [ ] app/admin/photographers/page.tsx
  - [ ] users_new 테이블에서 role='photographer' 필터링
- [ ] app/admin/users/page.tsx
  - [ ] 통합된 사용자 관리 인터페이스
- [ ] components/admin/* 컴포넌트들
  - [ ] 테이블 참조 업데이트

### 작가 관리 페이지 수정
- [ ] app/photographer-admin/* 페이지들
  - [ ] users_new 테이블 기반 인증 체크
  - [ ] photographer_profiles 조인 로직 확인

---

## Phase 7: 테스트 및 검증 (Day 3 Afternoon)

### 기능 테스트
- [ ] 일반 사용자 로그인/회원가입
- [ ] 작가 로그인/회원가입
- [ ] 관리자 로그인
- [ ] 구글 소셜 로그인
  - [ ] 신규 사용자
  - [ ] 기존 사용자
- [ ] 비밀번호 재설정 플로우

### 권한 테스트
- [ ] 일반 사용자 권한 범위 확인
- [ ] 작가 권한 범위 확인
  - [ ] 본인 프로필 수정
  - [ ] 본인 상품 관리
  - [ ] 본인 스케줄 관리
- [ ] 관리자 권한 범위 확인
  - [ ] 모든 사용자 조회/관리
  - [ ] 시스템 설정 접근

### 매칭 시스템 테스트
- [ ] photographer_profiles 연동 확인
- [ ] matching_results 생성 확인
- [ ] 작가 검색 및 필터링

### 예약/결제 시스템 테스트
- [ ] inquiries 생성 및 조회
- [ ] 작가별 예약 조회
- [ ] 결제 처리 플로우

### 성능 테스트
- [ ] 로그인 응답 시간
- [ ] 사용자 목록 조회 성능
- [ ] JOIN 쿼리 성능 확인

---

## Phase 8: 마이그레이션 완료 (Day 3 Evening)

### 기존 테이블 정리
- [ ] 모든 기능 정상 작동 최종 확인
- [ ] users_new → users 테이블명 변경
  ```sql
  ALTER TABLE users RENAME TO users_old;
  ALTER TABLE users_new RENAME TO users;
  ```
- [ ] admins 테이블 삭제
  ```sql
  DROP TABLE admins CASCADE;
  ```
- [ ] photographers 테이블 삭제
  ```sql
  DROP TABLE photographers CASCADE;
  ```
- [ ] users_old 테이블 삭제 (백업 확인 후)
  ```sql
  DROP TABLE users_old CASCADE;
  ```

### 최종 정리
- [ ] 불필요한 인덱스 제거
- [ ] VACUUM ANALYZE 실행
- [ ] 타입 최종 재생성
- [ ] 빌드 확인
  ```bash
  npm run build
  ```

---

## Phase 9: 문서화 및 모니터링

### 문서 업데이트
- [ ] specs/database-schema.md 업데이트
- [ ] specs/rbac-guide.md 업데이트
- [ ] CLAUDE.md 업데이트
- [ ] README.md 필요시 업데이트

### 모니터링 설정
- [ ] Supabase 로그 모니터링
- [ ] 에러 발생 추적
- [ ] 성능 메트릭 확인
- [ ] 24시간 관찰 기간 설정

---

## 🚨 롤백 계획

### 즉시 롤백 조건
- [ ] 인증 시스템 전면 장애
- [ ] 데이터 손실 발견
- [ ] 심각한 성능 저하 (3초 이상 응답 지연)

### 롤백 절차
1. users 테이블을 users_new로 되돌리기
2. 기존 백업한 admins, photographers 테이블 복원
3. FK 제약조건 원복
4. RLS 정책 원복
5. 프론트엔드 이전 커밋으로 롤백
6. TypeScript 타입 재생성

### 롤백 후 조치
- [ ] 실패 원인 분석
- [ ] 수정 계획 재수립
- [ ] 테스트 환경에서 재검증

---

## 📝 Notes

### 주의사항
- 작업 시작 전 반드시 Supabase 백업 생성
- 각 Phase 완료 시점마다 체크포인트 생성
- 프로덕션 트래픽이 적은 시간대에 작업
- 모든 SQL 스크립트는 트랜잭션으로 실행

### 예상 이슈
- 기존 세션 무효화 가능성 → 사용자 재로그인 안내 필요
- TypeScript 타입 충돌 → 점진적 수정 필요
- RLS 정책 복잡도 증가 → 철저한 테스트 필요

### 성공 지표
- ✅ 모든 사용자 정상 로그인
- ✅ 권한 체크 정상 작동
- ✅ 기존 기능 100% 호환
- ✅ 성능 저하 없음
- ✅ 에러 로그 클린