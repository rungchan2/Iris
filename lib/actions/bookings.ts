'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/send-email'
import { format } from 'date-fns'

const EMAIL_TO = [
  "chajimmy1214@gmail.com",
  "mingoyoung809@gmail.com"
]

interface BookingData {
  name: string
  instagram_id?: string
  gender: string
  phone: string
  desired_date: Date
  selected_slot_id?: string
  people_count: number
  relationship?: string
  special_request?: string
  difficulty_note?: string
  conversation_preference?: string
  conversation_topics?: string
  favorite_music?: string
  shooting_meaning?: string
}

interface BookingResult {
  success: boolean
  inquiry?: any
  error?: string
}

/**
 * Create a new booking inquiry with transaction handling
 * Handles: inquiry creation, slot reservation (via trigger), email notification
 */
export async function createBooking(data: BookingData): Promise<BookingResult> {
  try {
    const supabase = await createClient()

    // Get slot data to extract photographer_id
    let photographerId = null
    let slotData = null

    if (data.selected_slot_id) {
      const { data: slot, error: slotError } = await supabase
        .from('available_slots')
        .select('*, admin_id, start_time, end_time')
        .eq('id', data.selected_slot_id)
        .single()

      if (slotError) {
        console.error('Error fetching slot:', slotError)
        return { success: false, error: 'Failed to fetch slot information' }
      }

      photographerId = slot?.admin_id
      slotData = slot
    }

    // Create inquiry
    const { data: newInquiry, error: insertError } = await supabase
      .from('inquiries')
      .insert({
        name: data.name,
        instagram_id: data.instagram_id || null,
        gender: data.gender,
        phone: data.phone,
        desired_date: format(data.desired_date, "yyyy-MM-dd"),
        selected_slot_id: data.selected_slot_id || null,
        people_count: data.people_count,
        relationship: data.relationship || null,
        special_request: data.special_request || null,
        difficulty_note: data.difficulty_note || null,
        conversation_preference: data.conversation_preference || null,
        conversation_topics: data.conversation_topics || null,
        favorite_music: data.favorite_music || null,
        shooting_meaning: data.shooting_meaning || null,
        photographer_id: photographerId,
        status: 'new',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating inquiry:', insertError)
      return { success: false, error: 'Failed to create booking inquiry' }
    }

    // Send email notification
    const emailBody = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>새로운 촬영 문의</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #e74c3c;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .header p {
            color: #7f8c8d;
            margin: 5px 0 0 0;
            font-size: 16px;
          }
          .section {
            margin-bottom: 25px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #3498db;
          }
          .section h2 {
            color: #2c3e50;
            margin: 0 0 15px 0;
            font-size: 20px;
            font-weight: 600;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          .info-item {
            background-color: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e9ecef;
          }
          .info-label {
            font-weight: 600;
            color: #495057;
            font-size: 14px;
            margin-bottom: 4px;
          }
          .info-value {
            color: #2c3e50;
            font-size: 16px;
          }
          .full-width {
            grid-column: 1 / -1;
          }
          .status-badge {
            display: inline-block;
            background-color: #d4edda;
            color: #155724;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
          }
          @media (max-width: 480px) {
            .info-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📸 새로운 촬영 문의</h1>
            <p>새로운 문의가 접수되었습니다</p>
          </div>

          <div class="section">
            <h2>👤 기본 정보</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">이름</div>
                <div class="info-value">${data.name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">전화번호</div>
                <div class="info-value">${data.phone}</div>
              </div>
              ${data.instagram_id ? `
              <div class="info-item">
                <div class="info-label">인스타그램</div>
                <div class="info-value">@${data.instagram_id}</div>
              </div>` : ''}
              <div class="info-item">
                <div class="info-label">성별</div>
                <div class="info-value">${data.gender === 'male' ? '남성' : data.gender === 'female' ? '여성' : '기타'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">인원수</div>
                <div class="info-value">${data.people_count}명</div>
              </div>
              ${data.relationship ? `
              <div class="info-item">
                <div class="info-label">관계</div>
                <div class="info-value">${data.relationship}</div>
              </div>` : ''}
            </div>
          </div>

          <div class="section">
            <h2>📅 예약 정보</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">희망 날짜</div>
                <div class="info-value">${data.desired_date.toLocaleDateString('ko-KR')}</div>
              </div>
              ${slotData ? `
              <div class="info-item">
                <div class="info-label">선택한 시간대</div>
                <div class="info-value">${slotData.start_time} - ${slotData.end_time}</div>
              </div>` : ''}
            </div>
          </div>

          ${data.special_request || data.difficulty_note ? `
          <div class="section">
            <h2>📝 추가 정보</h2>
            ${data.special_request ? `
            <div class="info-item full-width">
              <div class="info-label">특별 요청사항</div>
              <div class="info-value">${data.special_request}</div>
            </div>` : ''}
            ${data.difficulty_note ? `
            <div class="info-item full-width" style="margin-top: 15px;">
              <div class="info-label">촬영 시 어려운 점</div>
              <div class="info-value">${data.difficulty_note}</div>
            </div>` : ''}
          </div>` : ''}

          <div class="section">
            <h2>📊 문의 상태</h2>
            <div class="info-item">
              <div class="info-label">상태</div>
              <div class="info-value">
                <span class="status-badge">신규 문의</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>이 문의는 ${new Date().toLocaleString('ko-KR')}에 접수되었습니다.</p>
            <p>빠른 시일 내에 연락드리겠습니다. 감사합니다! 🎉</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email notification (don't await - fire and forget)
    sendEmail(EMAIL_TO, "[Iris] 새로운 문의가 접수되었습니다.", emailBody).catch(err => {
      console.error('Error sending email:', err)
    })

    // Construct complete inquiry object with slot data
    const completeInquiry = {
      ...newInquiry,
      selected_slot_id: slotData,
      desired_date: newInquiry.desired_date,
    }

    return {
      success: true,
      inquiry: completeInquiry
    }

  } catch (error: any) {
    console.error('Error in createBooking:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    }
  }
}
