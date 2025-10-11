-- Add deleted_at column for soft deletes
ALTER TABLE inquiries
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inquiries_status_created
ON inquiries(status, created_at)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inquiries_phone_created
ON inquiries(phone, created_at);

-- Add comment to status column to document valid values
COMMENT ON COLUMN inquiries.status IS 'Valid values: pending_payment, payment_failed, reserved, contacted, completed, cancelled, expired';

-- Update existing NULL status to 'new' for backward compatibility
UPDATE inquiries
SET status = 'new'
WHERE status IS NULL;
