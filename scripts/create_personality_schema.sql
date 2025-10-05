-- kindt Personality System Database Schema
-- This script creates all necessary tables for the personality assessment system

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS choice_weights CASCADE;
DROP TABLE IF EXISTS quiz_responses CASCADE;
DROP TABLE IF EXISTS quiz_choices CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quiz_sessions CASCADE;
DROP TABLE IF EXISTS ai_image_generations CASCADE;
DROP TABLE IF EXISTS personality_admin_mapping CASCADE;
DROP TABLE IF EXISTS personality_photos CASCADE;
DROP TABLE IF EXISTS personality_types CASCADE;

-- 1. Personality Types Table
CREATE TABLE personality_types (
    code VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    example_person TEXT,
    style_keywords TEXT[],
    recommended_locations TEXT[],
    recommended_props TEXT[],
    ai_preview_prompt TEXT NOT NULL DEFAULT '',
    representative_image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Quiz Questions Table
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part TEXT NOT NULL CHECK (part IN ('감정', '사진')),
    question_text TEXT NOT NULL,
    question_image_url TEXT,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'image_text')),
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(display_order)
);

-- 3. Quiz Choices Table  
CREATE TABLE quiz_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    choice_text TEXT NOT NULL,
    choice_image_url TEXT,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(question_id, display_order)
);

-- 4. Choice Weights Table
CREATE TABLE choice_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    choice_id UUID NOT NULL REFERENCES quiz_choices(id) ON DELETE CASCADE,
    personality_code VARCHAR(10) NOT NULL REFERENCES personality_types(code) ON DELETE CASCADE,
    weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 3),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(choice_id, personality_code)
);

-- 5. Quiz Sessions Table
CREATE TABLE quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ip INET,
    user_agent TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    calculated_personality_code VARCHAR(10) REFERENCES personality_types(code),
    total_score_data JSONB,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Quiz Responses Table
CREATE TABLE quiz_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    choice_id UUID NOT NULL REFERENCES quiz_choices(id) ON DELETE CASCADE,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, question_id)
);

-- 7. AI Image Generations Table
CREATE TABLE ai_image_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE SET NULL,
    personality_code VARCHAR(10) NOT NULL REFERENCES personality_types(code),
    user_uploaded_image_url TEXT NOT NULL,
    generated_prompt TEXT NOT NULL,
    api_provider TEXT NOT NULL CHECK (api_provider IN ('openai_dalle', 'runway', 'midjourney')),
    api_request_payload JSONB,
    api_response_data JSONB,
    generated_image_url TEXT,
    generation_status TEXT NOT NULL DEFAULT 'pending' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    processing_time_seconds INTEGER,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Personality Admin Mapping Table
CREATE TABLE personality_admin_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personality_code VARCHAR(10) NOT NULL REFERENCES personality_types(code) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
    compatibility_score INTEGER NOT NULL CHECK (compatibility_score >= 1 AND compatibility_score <= 10),
    notes TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(personality_code, admin_id)
);

-- 9. Personality Photos Table (connects personality types to photos)
CREATE TABLE personality_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personality_code VARCHAR(10) NOT NULL REFERENCES personality_types(code) ON DELETE CASCADE,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    is_representative BOOLEAN DEFAULT false,
    display_order INTEGER NOT NULL CHECK (display_order >= 1 AND display_order <= 9),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(personality_code, photo_id),
    UNIQUE(personality_code, display_order)
);

-- Create indexes for better performance
CREATE INDEX idx_quiz_responses_session_id ON quiz_responses(session_id);
CREATE INDEX idx_choice_weights_choice_id ON choice_weights(choice_id);
CREATE INDEX idx_quiz_sessions_completed ON quiz_sessions(is_completed, completed_at);
CREATE INDEX idx_personality_admin_mapping_personality ON personality_admin_mapping(personality_code);
CREATE INDEX idx_personality_photos_personality ON personality_photos(personality_code);
CREATE INDEX idx_ai_generations_session_id ON ai_image_generations(quiz_session_id);
CREATE INDEX idx_ai_generations_status ON ai_image_generations(generation_status);

-- Add RLS (Row Level Security) policies
ALTER TABLE personality_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE choice_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_image_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_admin_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_photos ENABLE ROW LEVEL SECURITY;

-- Public read access for personality system data
CREATE POLICY "Public read access" ON personality_types FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quiz_questions FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access" ON quiz_choices FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access" ON choice_weights FOR SELECT USING (true);

-- Session management policies
CREATE POLICY "Users can manage their own sessions" ON quiz_sessions 
FOR ALL USING (true); -- Simplified for anonymous users

CREATE POLICY "Users can manage their own responses" ON quiz_responses 
FOR ALL USING (true); -- Simplified for anonymous users

-- AI generations policies
CREATE POLICY "Users can manage their own AI generations" ON ai_image_generations 
FOR ALL USING (true); -- Simplified for anonymous users

-- Admin-only access for mapping and photos
CREATE POLICY "Admin read access" ON personality_admin_mapping FOR SELECT USING (true);
CREATE POLICY "Admin full access" ON personality_admin_mapping FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public read access" ON personality_photos FOR SELECT USING (true);
CREATE POLICY "Admin full access" ON personality_photos FOR ALL USING (auth.role() = 'authenticated');

-- Update inquiries table to add personality-related columns
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS quiz_session_id UUID REFERENCES quiz_sessions(id);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS selected_personality_code VARCHAR(10) REFERENCES personality_types(code);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS matched_admin_id UUID REFERENCES photographers(id);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS ai_generation_id UUID REFERENCES ai_image_generations(id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_personality_types_updated_at BEFORE UPDATE ON personality_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON quiz_questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_image_generations_updated_at BEFORE UPDATE ON ai_image_generations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personality_admin_mapping_updated_at BEFORE UPDATE ON personality_admin_mapping 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE personality_types IS 'Defines the 9 personality types (A1, A2, B1, C1, D1, E1, E2, F1, F2)';
COMMENT ON TABLE quiz_questions IS 'Contains the 21 assessment questions';
COMMENT ON TABLE quiz_choices IS 'Multiple choice options for each question';
COMMENT ON TABLE choice_weights IS 'Scoring weights for personality calculation';
COMMENT ON TABLE quiz_sessions IS 'Tracks user assessment sessions';
COMMENT ON TABLE quiz_responses IS 'Stores individual user answers';
COMMENT ON TABLE ai_image_generations IS 'Tracks AI image generation requests and results';
COMMENT ON TABLE personality_admin_mapping IS 'Maps photographers to compatible personality types';
COMMENT ON TABLE personality_photos IS 'Curated photos for each personality type';