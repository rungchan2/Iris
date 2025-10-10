/**
 * Script to create initial terms of service for kindt platform
 *
 * This script creates the first version of terms based on the service features:
 * - AI-powered photographer matching system
 * - Direct booking and inquiry system
 * - Payment processing (Toss, Eximbay, Adyen, Stripe)
 * - Photographer profile management
 * - Review system
 *
 * Run: npx tsx scripts/create-initial-terms.ts
 */

/**
 * This script was used to create initial terms data.
 * Terms have already been created via MCP tools.
 * This file is kept for reference only.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

const initialTerms = {
  version: '1.0',
  effective_date: new Date('2025-01-01').toISOString(),
  is_active: true,
  sections: [
    {
      article_number: 1,
      title: '목적',
      display_order: 1,
      content: `본 약관은 kindt(이하 "회사")가 제공하는 사진작가 매칭 및 예약 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

본 서비스는 AI 기반 매칭 시스템을 통해 고객과 사진작가를 연결하고, 예약 및 결제 서비스를 제공합니다.`,
    },
    {
      article_number: 2,
      title: '정의',
      display_order: 2,
      content: `1. "서비스"란 회사가 제공하는 사진작가 매칭, 예약, 결제 및 관련 부가 서비스를 의미합니다.
2. "회원"이란 본 약관에 동의하고 회사와 서비스 이용계약을 체결한 개인 또는 법인을 의미합니다.
3. "고객"이란 사진 촬영 서비스를 이용하고자 하는 회원을 의미합니다.
4. "사진작가"란 회사의 승인을 받아 서비스를 통해 촬영 서비스를 제공하는 회원을 의미합니다.
5. "매칭 시스템"이란 10개 질문 기반 AI 임베딩 기술을 활용하여 고객과 사진작가를 연결하는 시스템을 의미합니다.
6. "패키지"란 사진작가가 제공하는 촬영 상품을 의미합니다.`,
    },
    {
      article_number: 3,
      title: '약관의 효력 및 변경',
      display_order: 3,
      content: `1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.
3. 회사가 약관을 변경하는 경우에는 적용일자 및 변경사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.
4. 회원이 변경된 약관에 동의하지 않는 경우, 회원은 서비스 이용을 중단하고 이용계약을 해지할 수 있습니다.`,
    },
    {
      article_number: 4,
      title: '회원가입 및 서비스 이용',
      display_order: 4,
      content: `1. 회원가입은 이용자가 본 약관 및 개인정보 처리방침에 동의하고 회사가 정한 가입양식에 따라 회원정보를 기입한 후 가입신청을 하고, 회사가 이를 승인함으로써 완료됩니다.
2. 사진작가 회원의 경우, 추가적인 심사 절차를 거쳐 회사의 승인을 받아야 서비스를 제공할 수 있습니다.
3. 회사는 다음 각 호에 해당하는 경우 회원가입을 거부하거나 사후에 이용계약을 해지할 수 있습니다:
   - 타인의 명의를 도용한 경우
   - 허위 정보를 기재한 경우
   - 법령 또는 본 약관을 위반한 경우
   - 기타 회사가 정한 이용조건에 부합하지 않는 경우`,
    },
    {
      article_number: 5,
      title: '매칭 서비스',
      display_order: 5,
      content: `1. 회사는 AI 기반 매칭 시스템을 통해 고객의 선호도와 사진작가의 스타일을 분석하여 최적의 매칭을 제공합니다.
2. 매칭 시스템은 다음의 4가지 차원으로 구성됩니다:
   - 스타일/감성 (40% 가중치)
   - 커뮤니케이션/심리 (30% 가중치)
   - 목적/스토리 (20% 가중치)
   - 동반자 유형 (10% 가중치)
3. 매칭 결과는 참고용이며, 최종 선택은 고객의 판단에 따릅니다.
4. 회사는 매칭 결과의 정확성을 보장하지 않으며, 매칭 결과로 인한 분쟁에 대해 책임지지 않습니다.`,
    },
    {
      article_number: 6,
      title: '예약 및 문의',
      display_order: 6,
      content: `1. 고객은 서비스를 통해 사진작가에게 촬영 예약 및 문의를 할 수 있습니다.
2. 예약 요청 시 다음 정보를 제공해야 합니다:
   - 촬영 희망 날짜 및 시간
   - 촬영 목적 및 컨셉
   - 촬영 인원
   - 기타 요청사항
3. 사진작가는 예약 요청에 대해 48시간 이내에 응답해야 합니다.
4. 예약 확정은 사진작가의 승인과 결제 완료 후에 이루어집니다.`,
    },
    {
      article_number: 7,
      title: '결제 및 환불',
      display_order: 7,
      content: `1. 회사는 다음의 결제수단을 제공합니다:
   - 국내 결제: 토스페이먼츠
   - 해외 결제: Eximbay, Adyen, Stripe
2. 결제는 촬영 서비스 이용 전에 완료되어야 합니다.
3. 환불 정책:
   - 촬영일 7일 전 취소: 100% 환불
   - 촬영일 3-6일 전 취소: 50% 환불
   - 촬영일 2일 전 이내 취소: 환불 불가
   - 사진작가 귀책사유로 인한 취소: 100% 환불
4. 환불은 결제수단과 동일한 방법으로 처리되며, 영업일 기준 3-5일이 소요될 수 있습니다.
5. 회사는 결제 및 환불 과정에서 발생하는 수수료에 대해 책임지지 않습니다.`,
    },
    {
      article_number: 8,
      title: '사진작가의 의무',
      display_order: 8,
      content: `1. 사진작가는 회사에 등록한 프로필 정보를 항상 최신 상태로 유지해야 합니다.
2. 사진작가는 확정된 예약에 대해 성실히 서비스를 제공해야 합니다.
3. 사진작가는 촬영 후 약정된 기간 내에 결과물을 제공해야 합니다.
4. 사진작가는 고객의 개인정보를 보호하고, 촬영물을 고객의 동의 없이 상업적으로 사용할 수 없습니다.
5. 사진작가는 회사와 정산 정책에 따라 정기적으로 정산을 받습니다.`,
    },
    {
      article_number: 9,
      title: '고객의 의무',
      display_order: 9,
      content: `1. 고객은 예약 시 정확한 정보를 제공해야 합니다.
2. 고객은 확정된 예약 시간을 준수해야 합니다.
3. 고객은 사진작가의 저작권을 존중해야 하며, 결과물을 임의로 편집하거나 상업적으로 사용할 수 없습니다.
4. 고객은 촬영 과정에서 사진작가의 지시에 협조해야 합니다.`,
    },
    {
      article_number: 10,
      title: '리뷰 및 평가',
      display_order: 10,
      content: `1. 고객은 촬영 서비스 이용 후 익명으로 리뷰를 작성할 수 있습니다.
2. 리뷰는 다른 이용자들의 선택에 도움을 주기 위한 것으로, 객관적이고 사실에 기반한 내용이어야 합니다.
3. 다음의 내용을 포함한 리뷰는 삭제될 수 있습니다:
   - 욕설, 비방, 명예훼손
   - 허위 사실
   - 개인정보 노출
   - 기타 법령 또는 본 약관 위반 내용
4. 회사는 리뷰의 진위 여부를 검증할 의무가 없으며, 리뷰로 인한 분쟁에 대해 책임지지 않습니다.`,
    },
    {
      article_number: 11,
      title: '지적재산권',
      display_order: 11,
      content: `1. 서비스 및 서비스에 사용된 소프트웨어, 이미지, 마크, 로고, 디자인, 서비스명칭, 정보 및 상표 등에 관한 지적재산권 및 기타 권리는 회사에 귀속됩니다.
2. 촬영 결과물에 대한 저작권은 사진작가에게 있으며, 고객은 개인적 용도로만 사용할 수 있습니다.
3. 고객이 결과물을 상업적으로 사용하고자 하는 경우, 사진작가와 별도의 협의가 필요합니다.`,
    },
    {
      article_number: 12,
      title: '개인정보 보호',
      display_order: 12,
      content: `1. 회사는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다.
2. 회원의 개인정보 보호 및 사용에 대해서는 관련 법령 및 회사의 개인정보처리방침이 적용됩니다.
3. 회사는 수집된 개인정보를 회원의 동의 없이 제3자에게 제공하지 않습니다. 단, 다음의 경우는 예외로 합니다:
   - 법령에 의해 요구되는 경우
   - 서비스 제공을 위해 필요한 경우 (예: 사진작가와의 매칭)
4. 회사는 AI 매칭 시스템 개선을 위해 익명화된 데이터를 분석할 수 있습니다.`,
    },
    {
      article_number: 13,
      title: '회사의 의무',
      display_order: 13,
      content: `1. 회사는 안정적인 서비스 제공을 위해 최선을 다합니다.
2. 회사는 회원의 개인정보 보호를 위해 보안 시스템을 갖추고 개인정보처리방침을 공시하고 준수합니다.
3. 회사는 회원으로부터 제기되는 의견이나 불만이 정당하다고 인정될 경우 이를 처리하여야 합니다.
4. 회사는 사진작가 심사 및 관리를 통해 서비스 품질을 유지하기 위해 노력합니다.`,
    },
    {
      article_number: 14,
      title: '서비스 이용 제한',
      display_order: 14,
      content: `1. 회사는 다음 각 호에 해당하는 경우 사전 통지 없이 서비스 이용을 제한하거나 계약을 해지할 수 있습니다:
   - 타인의 명의를 도용한 경우
   - 서비스 운영을 고의로 방해한 경우
   - 허위 내용을 등록한 경우
   - 같은 사용자가 다른 아이디로 이중 등록한 경우
   - 공공질서 및 미풍양속에 저해되는 내용을 유포한 경우
   - 회원이 국익 또는 사회적 공익을 저해할 목적으로 서비스 이용을 계획 또는 실행하는 경우
   - 타인의 명예를 손상시키거나 불이익을 주는 행위를 한 경우
   - 법령 또는 본 약관을 위반한 경우
2. 회사가 서비스 이용을 제한하거나 계약을 해지하는 경우에는 그 사유, 일시 및 기간 등을 회원에게 통지합니다.`,
    },
    {
      article_number: 15,
      title: '면책조항',
      display_order: 15,
      content: `1. 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.
2. 회사는 회원의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.
3. 회사는 회원이 서비스를 이용하여 기대하는 수익을 얻지 못하거나 상실한 것에 대하여 책임을 지지 않습니다.
4. 회사는 회원 간 또는 회원과 제3자 간에 서비스를 매개로 발생한 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임도 없습니다.
5. 회사는 사진작가가 제공하는 서비스의 품질, 내용, 결과물에 대해 보증하지 않으며, 이로 인한 분쟁에 대해 책임지지 않습니다.
6. 회사는 무료로 제공되는 서비스 이용과 관련하여 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.`,
    },
    {
      article_number: 16,
      title: '분쟁 해결',
      display_order: 16,
      content: `1. 회사는 회원이 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 고객센터를 설치, 운영합니다.
2. 회사와 회원 간 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에 제소합니다.
3. 회사와 회원 간 제기된 소송에는 대한민국 법을 적용합니다.`,
    },
    {
      article_number: 17,
      title: '기타',
      display_order: 17,
      content: `1. 본 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.
2. 회사는 필요한 경우 특정 서비스에 관하여 적용될 사항(이하 "개별약관")을 정하여 미리 공지할 수 있습니다. 회원이 개별약관에 동의하고 특정 서비스를 이용하는 경우에는 개별약관이 우선적으로 적용되고, 본 약관은 보충적인 효력을 갖습니다.
3. 본 약관의 일부 조항이 관련 법령에 의하여 무효로 판명되더라도 나머지 조항은 계속 유효합니다.`,
    },
  ],
}

async function createInitialTerms() {
  try {
    console.log('Creating initial terms...')

    // Create terms
    const { data: terms, error: termsError } = await supabase
      .from('terms')
      .insert({
        version: initialTerms.version,
        effective_date: initialTerms.effective_date,
        is_active: initialTerms.is_active,
      })
      .select()
      .single()

    if (termsError) {
      throw new Error(`Failed to create terms: ${termsError.message}`)
    }

    console.log('✅ Terms created:', terms.id)

    // Create sections
    const sections = initialTerms.sections.map((section) => ({
      terms_id: terms.id,
      article_number: section.article_number,
      title: section.title,
      content: section.content,
      display_order: section.display_order,
    }))

    const { data: createdSections, error: sectionsError } = await supabase
      .from('terms_sections')
      .insert(sections)
      .select()

    if (sectionsError) {
      throw new Error(`Failed to create sections: ${sectionsError.message}`)
    }

    console.log(`✅ Created ${createdSections.length} sections`)
    console.log('\n✅ Initial terms created successfully!')
    console.log(`Version: ${terms.version}`)
    console.log(`Effective Date: ${new Date(terms.effective_date).toLocaleDateString('ko-KR')}`)
    console.log(`Total Sections: ${createdSections.length}`)
  } catch (error) {
    console.error('❌ Error creating initial terms:', error)
    process.exit(1)
  }
}

createInitialTerms()
