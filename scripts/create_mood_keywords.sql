-- Create mood_keywords table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.mood_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('current', 'desired')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample mood keywords
INSERT INTO public.mood_keywords (name, type, display_order)
VALUES
  -- Current mood keywords
  ('Casual', 'current', 1),
  ('Formal', 'current', 2),
  ('Sporty', 'current', 3),
  ('Vintage', 'current', 4),
  ('Minimalist', 'current', 5),
  ('Colorful', 'current', 6),
  ('Elegant', 'current', 7),
  ('Trendy', 'current', 8),
  
  -- Desired mood keywords
  ('Natural', 'desired', 1),
  ('Dramatic', 'desired', 2),
  ('Artistic', 'desired', 3),
  ('Professional', 'desired', 4),
  ('Playful', 'desired', 5),
  ('Romantic', 'desired', 6),
  ('Urban', 'desired', 7),
  ('Cinematic', 'desired', 8),
  ('Nostalgic', 'desired', 9),
  ('Bright', 'desired', 10),
  ('Moody', 'desired', 11)
ON CONFLICT (id) DO NOTHING;
