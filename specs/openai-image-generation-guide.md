# OpenAI Image Generation API 가이드 (2025)

## 개요

OpenAI의 최신 이미지 생성 및 편집 API에 대한 종합 가이드입니다. Iris 프로젝트에서 사용자 업로드 이미지를 기반으로 개인화된 이미지를 생성하는 기능 구현을 위한 기술 문서입니다.

## 주요 API 엔드포인트

### 1. Responses API (권장)
- **모델**: `gpt-4.1-mini`, `gpt-4.1`, `gpt-4o` 등
- **이미지 생성 도구**: `gpt-image-1` 모델 사용
- **특징**: 네이티브 멀티모달 대화형 인터페이스

### 2. Images API (기존)
- **모델**: `gpt-image-1`, `dall-e-3`, `dall-e-2`
- **특징**: 직접적인 이미지 생성 엔드포인트

### 3. Chat Completions API
- **용도**: 이미지 분석 및 텍스트 생성

## 사용자 이미지 업로드 및 편집

### 이미지 입력 방법

#### 1. URL 방식
```javascript
{
  type: "input_image",
  image_url: "https://example.com/image.jpg"
}
```

#### 2. Base64 인코딩 방식
```javascript
{
  type: "input_image",
  image_url: `data:image/jpeg;base64,${base64Image}`
}
```

#### 3. File ID 방식
```javascript
{
  type: "input_image",
  file_id: "file-abc123"
}
```

### 이미지 입력 요구사항

| 항목 | 요구사항 |
|------|----------|
| 지원 포맷 | PNG (.png), JPEG (.jpeg, .jpg), WEBP (.webp), GIF (.gif, 비애니메이션) |
| 크기 제한 | 요청당 총 50MB, 개별 이미지 500개까지 |
| 기타 요구사항 | 워터마크 없음, NSFW 콘텐츠 없음, 인식 가능한 선명도 |

### 이미지 디테일 레벨
- `"detail": "low"` - 85 토큰, 512x512 저해상도 (빠름, 저비용)
- `"detail": "high"` - 고해상도 처리 (정확함, 고비용)
- `"detail": "auto"` - 모델이 자동 선택

## Iris 구현을 위한 핵심 기능

### 1. 사용자 이미지 기반 생성

**Responses API 사용 예시:**
```javascript
const response = await openai.responses.create({
  model: "gpt-4.1-mini",
  input: [
    {
      role: "user",
      content: [
        { 
          type: "input_text", 
          text: "이 사진을 기반으로 [성격유형]에 맞는 스타일로 편집해주세요" 
        },
        {
          type: "input_image",
          image_url: `data:image/jpeg;base64,${userImageBase64}`
        }
      ]
    }
  ],
  tools: [{ type: "image_generation" }]
});
```

### 2. 반복적 편집 (Multi-turn)

**이전 응답 ID 참조:**
```javascript
const followUp = await openai.responses.create({
  model: "gpt-4.1-mini",
  previous_response_id: response.id,
  input: "좀 더 밝게 만들어주세요",
  tools: [{ type: "image_generation" }]
});
```

**이미지 ID 참조:**
```javascript
const followUp = await openai.responses.create({
  model: "gpt-4.1-mini",
  input: [
    {
      role: "user",
      content: [{ type: "input_text", text: "배경을 변경해주세요" }]
    },
    {
      type: "image_generation_call",
      id: imageGenerationCalls[0].id
    }
  ],
  tools: [{ type: "image_generation" }]
});
```

### 3. 스트리밍 지원

```javascript
const stream = await openai.images.generate({
  prompt: "사용자 프롬프트",
  model: "gpt-image-1",
  stream: true,
  partial_images: 2
});

for await (const event of stream) {
  if (event.type === "image_generation.partial_image") {
    const imageBase64 = event.b64_json;
    // 부분 이미지 처리
  }
}
```

## 이미지 생성 도구 옵션

### 설정 가능한 매개변수
```javascript
tools: [{
  type: "image_generation",
  image_generation: {
    size: "1024x1024",      // 또는 "auto"
    quality: "high",        // "low", "medium", "high", "auto"
    format: "png",          // "png", "jpeg", "webp"
    compression: 80,        // JPEG/WebP용 (0-100%)
    background: "opaque"    // "transparent", "opaque", "auto"
  }
}]
```

## 비용 계산

### GPT-4.1-mini, GPT-4.1-nano, o4-mini
```text
// 32x32 패치 기반 계산
raw_patches = ceil(width/32) × ceil(height/32)
image_tokens = min(raw_patches, 1536)

// 모델별 배수 적용
- gpt-4.1-mini: image_tokens × 1.62
- gpt-4.1-nano: image_tokens × 2.46  
- o4-mini: image_tokens × 1.72
```

### 비용 예시
- **1024x1024 이미지**: 1024 토큰
- **정사각형 이미지 (저품질)**: ~$0.02
- **정사각형 이미지 (중품질)**: ~$0.07
- **정사각형 이미지 (고품질)**: ~$0.19

## 프롬프트 최적화 팁

### 1. 명령어 사용
- "그려줘", "편집해줘" 같은 동작 동사 사용
- "결합해줘" 대신 "첫 번째 이미지에 두 번째 이미지의 요소를 추가해서 편집해줘"

### 2. 성격유형별 프롬프트 전략
```javascript
const personalityPrompts = {
  'A1': '고요하고 자연스러운 분위기로 편집해주세요. 부드러운 조명과 차분한 색조를 사용해주세요.',
  'A2': '따뜻하고 친근한 느낌으로 편집해주세요. 밝은 표정과 자연스러운 포즈를 강조해주세요.',
  'B1': '감성적이고 로맨틱한 무드로 편집해주세요. 따뜻한 필터와 부드러운 톤을 적용해주세요.',
  // ... 다른 성격유형들
};
```

### 3. 개정된 프롬프트 활용
```javascript
// 개정된 프롬프트 확인
const revisedPrompt = response.output
  .find(output => output.type === "image_generation_call")
  ?.revised_prompt;
```

## 안전성 및 콘텐츠 조정

### 1. 내장 안전장치
- 유해 이미지 생성 제한
- C2PA 메타데이터 포함
- CAPTCHA 차단

### 2. 조정 민감도 제어
```javascript
{
  moderation: "strict" // 또는 "moderate", "low"
}
```

## 제한사항

### 기술적 제한사항
- **지연시간**: 복잡한 프롬프트는 최대 2분 소요
- **요청당 이미지**: gpt-image-1은 현재 1개 이미지만 지원
- **정밀 편집**: 세밀한 인페인팅 미지원
- **일관성**: 여러 이미지 간 요소 일관성 문제

### 콘텐츠 제한사항
- **의료 이미지**: CT 스캔 등 전문 의료 이미지 부적합
- **비라틴 문자**: 한국어, 일본어 등 텍스트 처리 제한
- **작은 텍스트**: 텍스트 크기 확대 필요
- **회전된 이미지**: 회전/뒤집힌 이미지 인식 문제
- **공간 추론**: 정밀한 위치 지정 어려움

## Iris 구현 권장 아키텍처

### 1. 서버 액션 구조
```typescript
export async function generatePersonalityImage(
  userImageBase64: string,
  personalityCode: string,
  additionalPrompt?: string
) {
  const personalityPrompt = getPersonalityPrompt(personalityCode);
  
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `${personalityPrompt} ${additionalPrompt || ''}`
          },
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${userImageBase64}`
          }
        ]
      }
    ],
    tools: [{ 
      type: "image_generation",
      image_generation: {
        size: "1024x1024",
        quality: "high",
        format: "png"
      }
    }]
  });
  
  return response;
}
```

### 2. 에러 처리
```typescript
try {
  const result = await generatePersonalityImage(imageData, personalityType);
} catch (error) {
  if (error.code === 'content_policy_violation') {
    // 콘텐츠 정책 위반 처리
  } else if (error.code === 'rate_limit_exceeded') {
    // 요청 제한 처리
  } else {
    // 기타 에러 처리
  }
}
```

### 3. 응답 처리
```typescript
const imageData = response.output
  .filter(output => output.type === "image_generation_call")
  .map(output => ({
    imageBase64: output.result,
    revisedPrompt: output.revised_prompt
  }));
```

## 결론

OpenAI의 gpt-image-1 API는 사용자 업로드 이미지를 기반으로 한 개인화된 이미지 생성에 강력한 기능을 제공합니다. Iris 프로젝트의 성격유형 기반 이미지 생성 기능 구현에 최적화된 솔루션으로, 높은 품질의 결과물과 유연한 편집 옵션을 제공합니다.

### 핵심 장점
- 사용자 이미지 입력 지원
- 성격유형별 맞춤 프롬프트 적용 가능
- 반복적 편집으로 사용자 만족도 향상
- 스트리밍으로 빠른 피드백 제공

### 주의사항
- 비용 최적화를 위한 이미지 크기 및 품질 설정 고려
- 지연시간을 고려한 UX 설계 필요
- 안전성 정책 준수 및 적절한 에러 처리 구현