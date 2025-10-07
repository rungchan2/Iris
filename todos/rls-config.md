# RLS 정책 설정 파일 (위계적 최소 권한 모델)

## 📋 설계 원칙

### 역할 위계 구조
```
anon (0) < user (10) < photographer:pending (20) < photographer:approved (30) < admin (40)
```

**위계적 접근**: `min_role: "user"` 설정 시 → user, photographer, admin 모두 접근 가능

### 성능 최적화 전략
1. **단일 함수 조회**: `auth.get_user_role_level()` - 한 번만 실행, 결과 캐시
2. **인덱스 활용**: owner_column에 자동 인덱스
3. **조건 단순화**: 복잡한 OR 대신 단순 비교 (`role_level >= 10`)

---

## 🎯 설정 스키마

### 기본 구조
```typescript
{
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
```

### 필드 설명

#### min_role
최소 요구 권한. 이 권한 이상만 접근 가능.
- `"anon"` (0): 누구나 접근 가능 (비로그인 포함)
- `"user"` (10): 로그인한 일반 사용자 이상
- `"photographer:pending"` (20): 사진작가 (승인 대기 포함) 이상
- `"photographer:approved"` (30): 승인된 사진작가 이상
- `"admin"` (40): 관리자만

#### own_only
- `false` (기본값): 조건 충족 시 모든 row 접근
- `true`: 본인 소유 row만 접근 (`owner_column` 기준)

#### public_when
추가 공개 조건 (선택적)
- 예: `"approval_status = 'approved'"`
- 예: `"is_active = true AND profile_completed = true"`

---

## 🗂️ 테이블별 RLS 정책 설정

### 1. 사용자 관리

```json
{
  "users": {
    "owner_column": "id",
    "policies": {
      "select": {
        "min_role": "user",
        "own_only": true
      },
      "insert": {
        "min_role": "admin",
        "own_only": false
      },
      "update": {
        "min_role": "user",
        "own_only": true
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  },

  "photographers": {
    "owner_column": "id",
    "policies": {
      "select": {
        "min_role": "anon",
        "own_only": false,
        "public_when": "approval_status = 'approved'"
      },
      "insert": {
        "min_role": "photographer:pending",
        "own_only": true
      },
      "update": {
        "min_role": "photographer:pending",
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

---

### 2. 사진작가 프로필

```json
{
  "photographer_profiles": {
    "owner_column": "photographer_id",
    "policies": {
      "select": {
        "min_role": "anon",
        "own_only": false,
        "public_when": "profile_completed = true"
      },
      "insert": {
        "min_role": "photographer:pending",
        "own_only": true
      },
      "update": {
        "min_role": "photographer:pending",
        "own_only": true
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  },

  "photographer_keywords": {
    "owner_column": "photographer_id",
    "policies": {
      "select": {
        "min_role": "anon",
        "own_only": false
      },
      "insert": {
        "min_role": "photographer:pending",
        "own_only": true
      },
      "update": {
        "min_role": "photographer:pending",
        "own_only": true
      },
      "delete": {
        "min_role": "photographer:pending",
        "own_only": true
      }
    }
  }
}
```

---

### 3. 매칭 시스템

```json
{
  "survey_questions": {
    "owner_column": null,
    "policies": {
      "select": {
        "min_role": "anon",
        "own_only": false,
        "public_when": "is_active = true"
      },
      "insert": {
        "min_role": "admin",
        "own_only": false
      },
      "update": {
        "min_role": "admin",
        "own_only": false
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  },

  "survey_choices": {
    "owner_column": null,
    "policies": {
      "select": {
        "min_role": "anon",
        "own_only": false,
        "public_when": "is_active = true"
      },
      "insert": {
        "min_role": "admin",
        "own_only": false
      },
      "update": {
        "min_role": "admin",
        "own_only": false
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  },

  "survey_images": {
    "owner_column": null,
    "policies": {
      "select": {
        "min_role": "anon",
        "own_only": false,
        "public_when": "is_active = true"
      },
      "insert": {
        "min_role": "admin",
        "own_only": false
      },
      "update": {
        "min_role": "admin",
        "own_only": false
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  },

  "matching_sessions": {
    "owner_column": "user_id",
    "policies": {
      "select": {
        "min_role": "anon",
        "own_only": false
      },
      "insert": {
        "min_role": "anon",
        "own_only": false
      },
      "update": {
        "min_role": "user",
        "own_only": true
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  },

  "matching_results": {
    "owner_column": null,
    "policies": {
      "select": {
        "min_role": "user",
        "own_only": false
      },
      "insert": {
        "min_role": "admin",
        "own_only": false
      },
      "update": {
        "min_role": "admin",
        "own_only": false
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  }
}
```

---

### 4. 콘텐츠 관리

```json
{
  "photos": {
    "owner_column": "photographer_id",
    "policies": {
      "select": {
        "min_role": "anon",
        "own_only": false,
        "public_when": "is_public = true"
      },
      "insert": {
        "min_role": "photographer:pending",
        "own_only": true
      },
      "update": {
        "min_role": "photographer:pending",
        "own_only": true
      },
      "delete": {
        "min_role": "photographer:approved",
        "own_only": true
      }
    }
  },

  "products": {
    "owner_column": "photographer_id",
    "policies": {
      "select": {
        "min_role": "anon",
        "own_only": false,
        "public_when": "status = 'approved'"
      },
      "insert": {
        "min_role": "photographer:approved",
        "own_only": true
      },
      "update": {
        "min_role": "photographer:approved",
        "own_only": true
      },
      "delete": {
        "min_role": "photographer:approved",
        "own_only": true
      }
    }
  },

  "inquiries": {
    "owner_column": "user_id",
    "policies": {
      "select": {
        "min_role": "user",
        "own_only": true
      },
      "insert": {
        "min_role": "user",
        "own_only": true
      },
      "update": {
        "min_role": "user",
        "own_only": true
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  },

  "payments": {
    "owner_column": "user_id",
    "policies": {
      "select": {
        "min_role": "user",
        "own_only": true
      },
      "insert": {
        "min_role": "user",
        "own_only": true
      },
      "update": {
        "min_role": "admin",
        "own_only": false
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  }
}
```

---

### 5. 피드백 & 로그

```json
{
  "user_feedback": {
    "owner_column": null,
    "policies": {
      "select": {
        "min_role": "admin",
        "own_only": false
      },
      "insert": {
        "min_role": "user",
        "own_only": false
      },
      "update": {
        "min_role": "admin",
        "own_only": false
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  },

  "matching_performance_logs": {
    "owner_column": null,
    "policies": {
      "select": {
        "min_role": "admin",
        "own_only": false
      },
      "insert": {
        "min_role": "admin",
        "own_only": false
      },
      "update": {
        "min_role": "admin",
        "own_only": false
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  },

  "embedding_jobs": {
    "owner_column": null,
    "policies": {
      "select": {
        "min_role": "admin",
        "own_only": false
      },
      "insert": {
        "min_role": "admin",
        "own_only": false
      },
      "update": {
        "min_role": "admin",
        "own_only": false
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  },

  "system_settings": {
    "owner_column": null,
    "policies": {
      "select": {
        "min_role": "admin",
        "own_only": false
      },
      "insert": {
        "min_role": "admin",
        "own_only": false
      },
      "update": {
        "min_role": "admin",
        "own_only": false
      },
      "delete": {
        "min_role": "admin",
        "own_only": false
      }
    }
  }
}
```

---

## 📝 작성 가이드

### 일반적인 패턴

**1. 공개 읽기 전용 (설문, 작가 프로필)**
```json
"select": { "min_role": "anon", "own_only": false, "public_when": "is_active = true" }
"insert/update/delete": { "min_role": "admin", "own_only": false }
```

**2. 본인 데이터만 관리 (사진, 상품)**
```json
"select": { "min_role": "anon", "own_only": false, "public_when": "status = 'approved'" }
"insert/update/delete": { "min_role": "photographer:approved", "own_only": true }
```

**3. 관리자 전용 (로그, 설정)**
```json
"select/insert/update/delete": { "min_role": "admin", "own_only": false }
```

**4. 사용자 개인 데이터 (문의, 결제)**
```json
"select/insert/update": { "min_role": "user", "own_only": true }
"delete": { "min_role": "admin", "own_only": false }
```

---

## 🎯 성능 최적화 포인트

### 생성될 SQL 예시
```sql
-- 최적화된 단일 조건 체크
CREATE POLICY "photos_select_policy" ON photos
FOR SELECT
USING (
  -- 1. 공개 조건 체크 (인덱스 활용)
  (is_public = true)
  OR
  -- 2. 권한 레벨 체크 (함수 1회 호출, 결과 캐시)
  (auth.get_user_role_level() >= 30 AND photographer_id = auth.uid())
  OR
  -- 3. 관리자 체크 (빠른 short-circuit)
  (auth.get_user_role_level() >= 40)
);
```

### 최적화 전략
1. ✅ **public_when 우선**: 인덱스 활용 가능한 조건 먼저 체크
2. ✅ **단일 함수 호출**: `get_user_role_level()` 한 번만 실행
3. ✅ **Short-circuit**: admin은 즉시 통과
4. ✅ **owner_column 인덱스**: 자동 생성으로 빠른 조회

---

## ✏️ 수정 방법

1. 위 JSON에서 필요한 테이블 찾기
2. `min_role`, `own_only`, `public_when` 값 수정
3. 누락된 테이블 추가

**저장 경로**: `supabase/rls-config.json`