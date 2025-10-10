---
description: Synchronize database schema documentation with actual database types
---

# Database Schema Synchronization Task

You need to synchronize the database schema documentation with the actual database types.

## Files to Synchronize

**Source of Truth (DO NOT MODIFY):**
- `/types/database.types.ts` - Auto-generated Supabase database types

**Target to Update:**
- `/specs/database-schema.md` - Database schema documentation

## Synchronization Requirements

### 1. Analysis Phase
- Read `/types/database.types.ts` completely
- Extract all tables, enums, functions, and relationships
- Identify new tables or modified fields compared to current documentation

### 2. Comparison Phase
- Read current `/specs/database-schema.md`
- Compare each table field-by-field with database.types.ts
- Identify:
  - New tables not documented
  - Removed tables (if any)
  - Field additions/removals/modifications
  - Type changes
  - Constraint changes

### 3. Update Phase
Update `/specs/database-schema.md` with:
- Add new tables in appropriate sections
- Update modified table schemas
- Ensure ALL fields match exactly with database.types.ts
- Preserve existing markdown formatting and organization
- Update "최근 업데이트" section with today's date
- Update table list section if new tables added

### 4. Verification Phase
- Verify every field type matches database.types.ts
- Verify all relationships (foreign keys) are documented
- Verify enums are correctly reflected
- Count total tables to ensure completeness

## Documentation Structure to Preserve

```markdown
# Database Schema - kindt (YYYY년 MM월 최신)

## 🏗️ 전체 DB 구조 개요

### 기본 정보
### 최근 업데이트

## 📊 핵심 테이블 구조

### 1. 사용자 관리 시스템
### 2. 매칭 시스템
### 3. 예약/결제 시스템
### 4. 갤러리 시스템
### 5. 스토리 시스템
### 6. 딥러닝 데이터 수집 테이블
### 7. 관리자 도구
### 8. 약관 시스템
... (add more sections as needed)

## 🎯 매칭 알고리즘 구조
## 🧠 딥러닝 데이터 수집 전략
## 🔐 RLS 정책
## 📈 성능 최적화
## 🎯 핵심 특징
## 📊 테이블 목록
```

## Important Notes

1. **Field-by-field accuracy**: Every field must match exactly
2. **Type precision**: All types (TEXT, INTEGER, UUID, etc.) must be accurate
3. **Null constraints**: Document which fields are nullable (` | null`)
4. **Default values**: Include default values in schema
5. **Foreign keys**: Document all relationships with ON DELETE CASCADE/etc.
6. **Enums**: Ensure enum values are correctly listed
7. **Korean comments**: Maintain Korean descriptions for clarity

## Success Criteria

- [ ] All tables from database.types.ts are documented
- [ ] Every field matches exactly (name, type, constraints)
- [ ] All relationships are documented
- [ ] "최근 업데이트" section updated with today's date
- [ ] Table count matches between database.types.ts and documentation
- [ ] No missing or extra tables in documentation

## Execution Instructions

1. Use TodoWrite to track progress through phases
2. Read both files completely before making changes
3. Make systematic, section-by-section updates
4. Verify each table before moving to next
5. Report summary of changes made
