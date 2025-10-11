-- Add terms agreement fields to users table

-- Add foreign key reference to terms table for terms of service agreement
ALTER TABLE users
  ADD COLUMN agreed_terms_id UUID REFERENCES terms(id) ON DELETE SET NULL;

-- Add foreign key reference to terms table for privacy policy agreement
ALTER TABLE users
  ADD COLUMN agreed_privacy_id UUID REFERENCES terms(id) ON DELETE SET NULL;

-- Add timestamps for when user agreed to each document
ALTER TABLE users
  ADD COLUMN terms_agreed_at TIMESTAMPTZ;

ALTER TABLE users
  ADD COLUMN privacy_agreed_at TIMESTAMPTZ;

-- Add indexes for efficient lookups
CREATE INDEX idx_users_agreed_terms ON users(agreed_terms_id);
CREATE INDEX idx_users_agreed_privacy ON users(agreed_privacy_id);

-- Add comments
COMMENT ON COLUMN users.agreed_terms_id IS 'Reference to the terms of service version the user agreed to';
COMMENT ON COLUMN users.agreed_privacy_id IS 'Reference to the privacy policy version the user agreed to';
COMMENT ON COLUMN users.terms_agreed_at IS 'Timestamp when user agreed to terms of service';
COMMENT ON COLUMN users.privacy_agreed_at IS 'Timestamp when user agreed to privacy policy';
