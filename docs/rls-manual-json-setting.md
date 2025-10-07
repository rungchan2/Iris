🎯 설정 스키마
기본 구조
typescript{
  "table_name": {
    "owner_column": "photographer_id" | "user_id" | null,
    "policies": {
      "select": {
        "min_role": "anon" | "user" | "photographer:pending" | "photographer:approved" | "admin",
        "own_only": boolean,           // true면 본인 데이터만
        "public_when": "조건식"         // 공개 조건 (선택)
      },
      "insert": { "min_role": "...", "own_only": boolean },
      "update": { "min_role": "...", "own_only": boolean },
      "delete": { "min_role": "...", "own_only": boolean }
    }
  }
}
필드 설명
min_role
최소 요구 권한. 이 권한 이상만 접근 가능.

"anon" (0): 누구나 접근 가능 (비로그인 포함)
"user" (10): 로그인한 일반 사용자 이상
"photographer" (20): 사진작가 (승인 대기 포함) 이상
"admin" (40): 관리자만

own_only

false (기본값): 조건 충족 시 모든 row 접근
true: 본인 소유 row만 접근 (owner_column 기준)

public_when
추가 공개 조건 (선택적)

예: "approval_status = 'approved'"
예: "is_active = true AND profile_completed = true"

## 실제 photographer 테이블 설정 
```json
{
  "photographers": {
    "owner_column": "id",  // ✅ 수정
    "policies": {
      "select": {
        "min_role": "anon",
        "own_only": false,
        "public_when": "approval_status = 'approved'",
        "owner_exception": true  // ✅ 추가: 본인은 항상 볼 수 있음
      },
      "insert": {
        "min_role": "user",
        "own_only": true  // ✅ 수정: 본인 것만 생성
      },
      "update": {
        "min_role": "photographer",
        "own_only": true
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  }
}
```