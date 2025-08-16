-- Insert Personality Types Data
-- Based on CSV data: 포토포유 - 성격유형.csv

INSERT INTO personality_types (code, name, description, example_person, display_order, ai_preview_prompt) VALUES
('A1', '고요한 관찰자', '잔잔한 분위기를 좋아하고, 자신만의 시선으로 세상을 바라보는 사람', '혼자 여행을 즐기는 북극 MBTI 친구', 1, 'A serene, contemplative portrait with soft lighting and muted colors, showing a person in a quiet, peaceful setting with natural shadows and gentle atmosphere'),
('A2', '따뜻한 동행자', '감성적이고 따뜻한 관계를 중시하는, 감정 이입형의 조용한 사람', '감정 표현 잘하고 친구 얘기 잘 들어주는 카페 알바생', 2, 'A warm, emotional portrait with golden hour lighting, soft warm tones, showing genuine emotional connection and intimate atmosphere'),
('B1', '감성 기록자, 내추럴 힐러', '평범한 일상 속 감정을 포착하고 기록하고 싶어하는 사람, 사람을 편안하게 만들고, 자신도 부드러운 분위기를 추구하는 사람', '필름카메라로 일상을 기록하는 인스타 감성러', 3, 'A natural, film-like portrait with soft natural lighting, capturing everyday emotions and healing atmosphere with gentle, comfortable vibes'),
('C1', '시네마틱 몽상가, 시크한 미니멀리스트', '구조적인 아름다움과 감정선을 동시에 중시하는 예술적 성향, 말수는 적지만 정제된 분위기와 뷰티를 선호하는 도시형 감성', '영화 Her나 Drive 같은 분위기를 좋아하는 친구', 4, 'A cinematic, minimalist portrait with dramatic lighting and clean composition, moody atmosphere with urban aesthetic and refined beauty'),
('D1', '활력 가득 리더, 캐주얼 낙천주의자', '에너지 넘치고 밝은 분위기, 스냅에서도 밝은 표정과 움직임을 원하는 사람, 깔끔하고 밝은 일상 속 웃음이 많은 스타일을 추구하는 사람', '항상 약속 주도하고 웃는 사진 찍히는 거 좋아하는 친구', 5, 'A bright, energetic portrait with vibrant lighting, cheerful expression and dynamic pose, capturing joyful and optimistic energy'),
('E1', '도시의 드리머', '빛과 그림자, 낯선 공간을 좋아하고 새로운 배경에서 나를 찾고 싶은 사람', '혼자 이태원이나 익선동에서 감성샷 찍는 인스타 유저', 6, 'An urban, dreamy portrait with dramatic city lighting, playing with light and shadows in unique urban locations with moody atmosphere'),
('E2', '무심한 예술가', '관심 없어 보이지만 자신만의 미적 감각을 갖고 있는 관찰자', '인스타그램은 안 하지만 찍는 사진은 감도 높은 친구', 7, 'An artistic, nonchalant portrait with subtle lighting and artistic composition, showing sophisticated aesthetic sense with understated elegance'),
('F1', '자유로운 탐험가', '틀에 얽매이지 않고 새로운 나를 발견하려는 역동적 탐색형', '촬영지를 자신이 골라야 만족하는 액티브한 친구', 8, 'A dynamic, adventurous portrait with natural outdoor lighting, capturing freedom and exploration spirit in diverse natural settings'),
('F2', '감각적 실험가', '콘셉트 있고 독특한 걸 시도해보고 싶은 트렌드 시커', '패션/헤어/촬영 스타일 모두 실험적이고 시도적인 감각러', 9, 'An experimental, conceptual portrait with unique lighting and creative composition, showcasing innovative fashion and artistic experimentation');

-- Insert Quiz Questions
-- Note: This is a template based on the CSV structure. You'll need to adjust based on actual question content.

DO $$
DECLARE
    question_1_id UUID := gen_random_uuid();
    question_2_id UUID := gen_random_uuid();
    question_3_id UUID := gen_random_uuid();
    question_4_id UUID := gen_random_uuid();
    -- Add more question IDs as needed
    choice_1_1_id UUID;
    choice_1_2_id UUID;
    choice_1_3_id UUID;
    choice_1_4_id UUID;
BEGIN
    -- Question 1
    INSERT INTO quiz_questions (id, part, question_text, display_order) VALUES
    (question_1_id, '감정', '가장 편안함을 느끼는 순간은 언제인가요?', 1);
    
    -- Question 1 Choices
    INSERT INTO quiz_choices (id, question_id, choice_text, display_order) VALUES
    (gen_random_uuid(), question_1_id, '혼자 걷는 길 위에서', 1),
    (gen_random_uuid(), question_1_id, '누군가와 깊은 대화를 나눌 때', 2),
    (gen_random_uuid(), question_1_id, '많은 사람들 속에서 에너지를 받을 때', 3),
    (gen_random_uuid(), question_1_id, '새로운 장소에서 나를 발견할 때', 4);
    
    -- Get choice IDs for weights
    SELECT id INTO choice_1_1_id FROM quiz_choices WHERE question_id = question_1_id AND display_order = 1;
    SELECT id INTO choice_1_2_id FROM quiz_choices WHERE question_id = question_1_id AND display_order = 2;
    SELECT id INTO choice_1_3_id FROM quiz_choices WHERE question_id = question_1_id AND display_order = 3;
    SELECT id INTO choice_1_4_id FROM quiz_choices WHERE question_id = question_1_id AND display_order = 4;
    
    -- Question 1 Weights (A1, A2, B1, C1, D1, E1, E2, F1, F2)
    INSERT INTO choice_weights (choice_id, personality_code, weight) VALUES
    (choice_1_1_id, 'A1', 2), (choice_1_1_id, 'A2', 0), (choice_1_1_id, 'B1', 3), (choice_1_1_id, 'C1', 2), (choice_1_1_id, 'D1', 0), (choice_1_1_id, 'E1', 0), (choice_1_1_id, 'E2', 3), (choice_1_1_id, 'F1', 3), (choice_1_1_id, 'F2', 2),
    (choice_1_2_id, 'A1', 1), (choice_1_2_id, 'A2', 2), (choice_1_2_id, 'B1', 1), (choice_1_2_id, 'C1', 1), (choice_1_2_id, 'D1', 2), (choice_1_2_id, 'E1', 2), (choice_1_2_id, 'E2', 2), (choice_1_2_id, 'F1', 2), (choice_1_2_id, 'F2', 1),
    (choice_1_3_id, 'A1', 0), (choice_1_3_id, 'A2', 1), (choice_1_3_id, 'B1', 0), (choice_1_3_id, 'C1', 0), (choice_1_3_id, 'D1', 3), (choice_1_3_id, 'E1', 1), (choice_1_3_id, 'E2', 0), (choice_1_3_id, 'F1', 1), (choice_1_3_id, 'F2', 0),
    (choice_1_4_id, 'A1', 3), (choice_1_4_id, 'A2', 3), (choice_1_4_id, 'B1', 2), (choice_1_4_id, 'C1', 3), (choice_1_4_id, 'D1', 1), (choice_1_4_id, 'E1', 3), (choice_1_4_id, 'E2', 1), (choice_1_4_id, 'F1', 0), (choice_1_4_id, 'F2', 3);

    -- Question 2
    INSERT INTO quiz_questions (id, part, question_text, display_order) VALUES
    (question_2_id, '감정', '요즘 나의 하루 분위기를 가장 잘 설명하는 말은?', 2);
    
    -- Question 2 Choices
    INSERT INTO quiz_choices (question_id, choice_text, display_order) VALUES
    (question_2_id, '고요하고 잔잔하다', 1),
    (question_2_id, '편안하고 따뜻하다', 2),
    (question_2_id, '활기차고 에너지 넘친다', 3),
    (question_2_id, '혼란스럽지만 나름대로 굴러간다', 4);
    
    -- Question 3
    INSERT INTO quiz_questions (id, part, question_text, display_order) VALUES
    (question_3_id, '감정', '사람들과의 관계에서 나는?', 3);
    
    -- Question 3 Choices
    INSERT INTO quiz_choices (question_id, choice_text, display_order) VALUES
    (question_3_id, '말없이 듣는 편이다', 1),
    (question_3_id, '필요한 말은 잘 한다', 2),
    (question_3_id, '먼저 분위기를 이끄는 편이다', 3),
    (question_3_id, '순간의 공감을 즐긴다', 4);
    
    -- Question 4
    INSERT INTO quiz_questions (id, part, question_text, display_order) VALUES
    (question_4_id, '사진', '아래 중 가장 끌리는 장면은?', 4);
    
    -- Question 4 Choices
    INSERT INTO quiz_choices (question_id, choice_text, display_order) VALUES
    (question_4_id, '인물이 흐릿한 창밖을 바라보는 사진', 1),
    (question_4_id, '따뜻한 햇살이 드는 책상 위', 2),
    (question_4_id, '분주한 도시 거리의 익명의 사람들', 3),
    (question_4_id, '자연 속에서 자유롭게 웃는 모습', 4);

END $$;

-- Add more questions following the same pattern...
-- For production, you would need to insert all 21 questions with their complete weight matrices

-- Insert some sample personality-admin mappings (adjust admin_id based on your actual admin users)
-- INSERT INTO personality_admin_mapping (personality_code, admin_id, compatibility_score, is_primary) VALUES
-- ('A1', 'your-admin-uuid-here', 9, true),
-- ('A2', 'your-admin-uuid-here', 8, false);

-- Set up style keywords for each personality type
UPDATE personality_types SET style_keywords = ARRAY['차분함', '내성적', '관찰', '고요함', '섬세함'] WHERE code = 'A1';
UPDATE personality_types SET style_keywords = ARRAY['따뜻함', '감성적', '동행', '다정함', '공감'] WHERE code = 'A2';
UPDATE personality_types SET style_keywords = ARRAY['자연스러움', '힐링', '감성', '일상', '편안함'] WHERE code = 'B1';
UPDATE personality_types SET style_keywords = ARRAY['시크함', '미니멀', '도시적', '구조적', '예술적'] WHERE code = 'C1';
UPDATE personality_types SET style_keywords = ARRAY['활력', '밝음', '리더십', '에너지', '낙천적'] WHERE code = 'D1';
UPDATE personality_types SET style_keywords = ARRAY['도시적', '꿈꾸는', '빛과그림자', '새로움', '탐험'] WHERE code = 'E1';
UPDATE personality_types SET style_keywords = ARRAY['예술적', '실험적', '무심함', '관찰', '미적감각'] WHERE code = 'E2';
UPDATE personality_types SET style_keywords = ARRAY['자유로움', '탐험', '역동적', '모험', '틀깨기'] WHERE code = 'F1';
UPDATE personality_types SET style_keywords = ARRAY['감각적', '독특함', '콘셉추얼', '실험적', '트렌드'] WHERE code = 'F2';

-- Add recommended locations
UPDATE personality_types SET recommended_locations = ARRAY['조용한 카페', '도서관', '공원 벤치', '홀로 걷는 길', '창가 자리'] WHERE code = 'A1';
UPDATE personality_types SET recommended_locations = ARRAY['따뜻한 카페', '친구의 집', '아늑한 공간', '함께하는 장소'] WHERE code = 'A2';
UPDATE personality_types SET recommended_locations = ARRAY['자연스러운 일상 공간', '집 근처', '동네 카페', '공원', '햇살 좋은 곳'] WHERE code = 'B1';
UPDATE personality_types SET recommended_locations = ARRAY['도시적 배경', '미니멀한 공간', '모던한 건물', '깔끔한 스튜디오'] WHERE code = 'C1';
UPDATE personality_types SET recommended_locations = ARRAY['밝은 야외', '활기찬 장소', '사람들과 함께', '에너지 넘치는 공간'] WHERE code = 'D1';
UPDATE personality_types SET recommended_locations = ARRAY['이태원', '익선동', '도시의 뒷골목', '네온사인', '독특한 건물'] WHERE code = 'E1';
UPDATE personality_types SET recommended_locations = ARRAY['갤러리', '예술적 공간', '독특한 장소', '감각적 배경'] WHERE code = 'E2';
UPDATE personality_types SET recommended_locations = ARRAY['자연', '산', '바다', '여행지', '새로운 장소'] WHERE code = 'F1';
UPDATE personality_types SET recommended_locations = ARRAY['실험적 공간', '트렌디한 장소', '콘셉트 있는 공간', '독특한 배경'] WHERE code = 'F2';

-- Add recommended props
UPDATE personality_types SET recommended_props = ARRAY['책', '차', '식물', '일기장', '단순한 소품'] WHERE code = 'A1';
UPDATE personality_types SET recommended_props = ARRAY['담요', '따뜻한 음료', '편지', '소중한 물건'] WHERE code = 'A2';
UPDATE personality_types SET recommended_props = ARRAY['필름카메라', '일상용품', '자연스러운 소품', '식물'] WHERE code = 'B1';
UPDATE personality_types SET recommended_props = ARRAY['미니멀한 소품', '선글라스', '모던한 액세서리'] WHERE code = 'C1';
UPDATE personality_types SET recommended_props = ARRAY['밝은 의상', '스포츠용품', '액티브한 소품'] WHERE code = 'D1';
UPDATE personality_types SET recommended_props = ARRAY['도시적 패션', '특별한 액세서리', '감성적 소품'] WHERE code = 'E1';
UPDATE personality_types SET recommended_props = ARRAY['예술적 소품', '독특한 액세서리', '감각적 아이템'] WHERE code = 'E2';
UPDATE personality_types SET recommended_props = ARRAY['여행용품', '자연스러운 의상', '모험 장비'] WHERE code = 'F1';
UPDATE personality_types SET recommended_props = ARRAY['실험적 패션', '독특한 헤어', '트렌디한 액세서리'] WHERE code = 'F2';